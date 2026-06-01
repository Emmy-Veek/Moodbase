/* ============================================================
   Moodbase — Full App
   4 screens: Library · Upload · New Project · Recommendations
   ============================================================ */

const { useState, useEffect, useRef } = React;

/* ── IndexedDB helpers for video blob storage ── */
const _dbPromise = new Promise((res, rej) => {
  const req = indexedDB.open('moodbase_videos', 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore('videos');
  req.onsuccess = e => res(e.target.result);
  req.onerror  = e => rej(e.target.error);
});

const idbPut = (key, blob) => _dbPromise.then(db => new Promise((res, rej) => {
  const tx = db.transaction('videos', 'readwrite');
  tx.objectStore('videos').put(blob, key);
  tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
}));

const idbGet = (key) => _dbPromise.then(db => new Promise((res, rej) => {
  const tx = db.transaction('videos', 'readonly');
  const req = tx.objectStore('videos').get(key);
  req.onsuccess = e => res(e.target.result || null);
  req.onerror   = e => rej(e.target.error);
}));

const idbDel = (key) => _dbPromise.then(db => new Promise((res, rej) => {
  const tx = db.transaction('videos', 'readwrite');
  tx.objectStore('videos').delete(key);
  tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
}));

/* ════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════ */

const ASSETS = [
  { id:1,  kind:"fintech",   title:"Mercato — balances overview",    source:"dribbble.com",  video:false, tags:{ industry:["Fintech"],      component:["Dashboard","Chart"],        style:["Minimal","Light"],       platform:["Web"]    }},
  { id:2,  kind:"agri",      title:"FieldSense crop scout",          source:"mobbin.com",    video:true,  tags:{ industry:["Agriculture"],  component:["Map","Card"],               style:["Friendly","Light"],      platform:["Mobile"] }},
  { id:3,  kind:"ai",        title:"Cortex assistant thread",        source:"x.com",         video:false, tags:{ industry:["AI"],           component:["Chat","Input"],             style:["Minimal","Soft"],        platform:["Web"]    }},
  { id:4,  kind:"shop",      title:"Lume storefront grid",           source:"lapa.ninja",    video:false, tags:{ industry:["E-commerce"],   component:["Grid","Card"],              style:["Bold","Light"],          platform:["Web"]    }},
  { id:5,  kind:"health",    title:"Pulse daily rings",              source:"mobbin.com",    video:true,  tags:{ industry:["Health"],       component:["Stats","Navigation"],       style:["Calm","Light"],          platform:["Mobile"] }},
  { id:6,  kind:"devtool",   title:"Forge deploy console",           source:"github.com",    video:false, tags:{ industry:["Developer"],    component:["Console","Table"],          style:["Dark mode","Technical"], platform:["Web"]    }},
  { id:7,  kind:"travel",    title:"Wander trip editorial",          source:"behance.net",   video:false, tags:{ industry:["Travel"],       component:["Hero","Card"],              style:["Editorial","Warm"],      platform:["Web"]    }},
  { id:8,  kind:"music",     title:"Echo now playing",               source:"mobbin.com",    video:true,  tags:{ industry:["Media"],        component:["Player","Slider"],          style:["Dark mode","Bold"],      platform:["Mobile"] }},
  { id:9,  kind:"calendar",  title:"Slate booking month",            source:"dribbble.com",  video:false, tags:{ industry:["Productivity"], component:["Calendar","Navigation"],    style:["Minimal","Light"],       platform:["Web"]    }},
  { id:10, kind:"estate",    title:"Habitat listing detail",         source:"mobbin.com",    video:false, tags:{ industry:["Real estate"],  component:["Card","Gallery"],           style:["Clean","Light"],         platform:["Mobile"] }},
  { id:11, kind:"analytics", title:"Ledger reports table",           source:"saaspo.com",    video:false, tags:{ industry:["Fintech"],      component:["Table","Form"],             style:["Minimal","Light"],       platform:["Web"]    }},
  { id:12, kind:"ai",        title:"Nimbus prompt composer",         source:"x.com",         video:false, tags:{ industry:["AI"],           component:["Input","Dropdown"],         style:["Soft","Light"],          platform:["Web"]    }},
];

const DIMS = {
  industry:  { label:"Industry",  },
  component: { label:"Component", },
  style:     { label:"Style",     },
  platform:  { label:"Platform",  },
};

const FACET_PILLS = [
  ["industry","Fintech"],
  ["industry","AI"],
  ["component","Card"],
  ["component","Chart"],
  ["style","Minimal"],
  ["style","Dark mode"],
  ["platform","Mobile"],
];

/* ════════════════════════════════════════════════════════════
   ICONS  (stroke, inherit color)
   ════════════════════════════════════════════════════════════ */

function Ico({ size=16, fill=false, sw=1.7, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         fill={fill ? "currentColor" : "none"}
         stroke={fill ? "none" : "currentColor"}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const I = {
  search:   (p={}) => <Ico {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Ico>,
  plus:     (p={}) => <Ico {...p}><path d="M12 5v14M5 12h14"/></Ico>,
  check:    (p={}) => <Ico {...p}><path d="M20 6L9 17l-5-5"/></Ico>,
  x:        (p={}) => <Ico {...p}><path d="M18 6L6 18M6 6l12 12"/></Ico>,
  sun:      (p={}) => <Ico {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Ico>,
  moon:     (p={}) => <Ico {...p}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></Ico>,
  play:     (p={}) => <Ico {...p} fill><path d="M8 5v14l11-7z"/></Ico>,
  grid:     (p={}) => <Ico {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ico>,
  upload:   (p={}) => <Ico {...p}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 16v3a2 2 0 002 2h10a2 2 0 002-2v-3"/></Ico>,
  sparkle:  (p={}) => <Ico {...p}><path d="M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7 10.2 7.9z"/><path d="M19 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/></Ico>,
  chevdown: (p={}) => <Ico {...p}><path d="M6 9l6 6 6-6"/></Ico>,
  sliders:  (p={}) => <Ico {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></Ico>,
  layers:   (p={}) => <Ico {...p}><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/></Ico>,
  bookmark: (p={}) => <Ico {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></Ico>,
  image:    (p={}) => <Ico {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></Ico>,
  trash:    (p={}) => <Ico {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></Ico>,
  cols:     (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 16 16" fill="currentColor">
      <rect x="1"  y="2" width="4" height="12" rx="1"/>
      <rect x="6"  y="2" width="4" height="12" rx="1"/>
      <rect x="11" y="2" width="4" height="12" rx="1"/>
    </svg>
  ),
};

/* ════════════════════════════════════════════════════════════
   DESIGN THUMBNAILS  (abstract UI scenes)
   ════════════════════════════════════════════════════════════ */

function Thumb({ kind }) {
  const a = "var(--accent)";
  const wrap = (children, bg) => (
    <div style={{ position:"absolute", inset:0, background:bg, overflow:"hidden" }}>{children}</div>
  );
  const bar = (w, c, h=6, r=3) => ({ width:w, height:h, borderRadius:r, background:c });
  const N = { soft:"rgba(140,130,115,.22)", soft2:"rgba(140,130,115,.13)" };

  switch (kind) {
    case "fintech": return wrap(
      <div style={{ position:"absolute", inset:0, padding:"14px 14px 0", display:"flex", flexDirection:"column", gap:9 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={bar(54, N.soft, 7)} /><div style={{ ...bar(22,a,8), borderRadius:5 }} />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["62%","38%"].map((w,i)=>(
            <div key={i} style={{ flex: i ? .6 : 1, background:"rgba(255,255,255,.55)", borderRadius:8, padding:9, border:"1px solid rgba(140,130,115,.16)" }}>
              <div style={bar("40%", N.soft, 5)} />
              <div style={{ ...bar("70%", i?N.soft2:a, 9), marginTop:7 }} />
            </div>
          ))}
        </div>
        <div style={{ flex:1, background:"rgba(255,255,255,.5)", borderRadius:8, border:"1px solid rgba(140,130,115,.16)", padding:11, display:"flex", alignItems:"flex-end", gap:5 }}>
          {[34,52,40,66,48,72,58].map((h,i)=>(
            <div key={i} style={{ flex:1, height:h+"%", borderRadius:3, background: i===5?a:N.soft }} />
          ))}
        </div>
      </div>, "linear-gradient(150deg,#F3F4F8,#E9EAF1)");

    case "agri": return wrap(
      <div style={{ position:"absolute", inset:0, display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div style={{ width:"46%", height:"86%", background:"#fff", borderRadius:16, boxShadow:"0 8px 22px rgba(40,60,30,.16)", overflow:"hidden", border:"4px solid #fff" }}>
          <div style={{ height:"54%", background:"linear-gradient(160deg,#cfe3b4,#a7cf86)", position:"relative" }}>
            <div style={{ position:"absolute", left:"30%", top:"40%", width:14, height:14, borderRadius:"50% 50% 50% 0", transform:"rotate(-45deg)", background:a }} />
          </div>
          <div style={{ padding:9, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={bar("60%", N.soft, 6)} /><div style={bar("85%", N.soft2, 5)} />
            <div style={{ ...bar("100%", a, 12), borderRadius:6, marginTop:3 }} />
          </div>
        </div>
      </div>, "linear-gradient(160deg,#EAF1E0,#DCE9CC)");

    case "ai": return wrap(
      <div style={{ position:"absolute", inset:0, padding:14, display:"flex", flexDirection:"column", gap:8, justifyContent:"center" }}>
        <div style={{ alignSelf:"flex-start", maxWidth:"72%", background:"rgba(255,255,255,.7)", border:"1px solid rgba(140,130,115,.18)", borderRadius:"12px 12px 12px 4px", padding:"9px 10px" }}>
          <div style={bar("100%", N.soft, 5)} /><div style={{ ...bar("65%", N.soft2, 5), marginTop:5 }} />
        </div>
        <div style={{ alignSelf:"flex-end", maxWidth:"66%", background:a, borderRadius:"12px 12px 4px 12px", padding:"9px 10px" }}>
          <div style={bar("100%", "rgba(255,255,255,.85)", 5)} /><div style={{ ...bar("80%","rgba(255,255,255,.55)",5), marginTop:5 }} />
        </div>
        <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:7, background:"#fff", border:"1px solid rgba(140,130,115,.2)", borderRadius:10, padding:"8px 10px" }}>
          <div style={bar("60%", N.soft2, 5)} /><div style={{ width:18, height:18, borderRadius:6, background:a, marginLeft:"auto" }} />
        </div>
      </div>, "linear-gradient(150deg,#F1EFF6,#E7E3F1)");

    case "shop": return wrap(
      <div style={{ position:"absolute", inset:0, padding:13, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div style={bar(40, N.soft, 7)} /><div style={bar(28, a, 7)} />
        </div>
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{ background:"#fff", borderRadius:8, overflow:"hidden", border:"1px solid rgba(140,130,115,.14)", display:"flex", flexDirection:"column" }}>
              <div style={{ flex:1, background: i%3 ? "rgba(180,160,140,.2)" : "rgba(200,120,80,.22)" }} />
              <div style={{ padding:7 }}><div style={bar("70%",N.soft,5)} /><div style={{ ...bar(20,a,5), marginTop:5 }} /></div>
            </div>
          ))}
        </div>
      </div>, "linear-gradient(150deg,#F6F1EC,#EFE6DC)");

    case "health": return wrap(
      <div style={{ position:"absolute", inset:0, display:"flex", justifyContent:"center", alignItems:"center" }}>
        <div style={{ width:"48%", height:"86%", background:"#fff", borderRadius:16, boxShadow:"0 8px 22px rgba(40,40,60,.14)", overflow:"hidden", padding:12, display:"flex", flexDirection:"column", alignItems:"center", gap:9 }}>
          <div style={{ position:"relative", width:74, height:74, marginTop:4 }}>
            {[[a,"100%",0],["rgba(200,120,80,.4)","78%","11%"],["rgba(140,130,115,.25)","56%","22%"]].map(([c,s,o],i)=>(
              <div key={i} style={{ position:"absolute", width:s, height:s, top:o, left:o, borderRadius:"50%", border:"6px solid "+c, borderRightColor:"transparent", transform:`rotate(${i*40}deg)` }} />
            ))}
          </div>
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
            <div style={bar("100%",N.soft2,6)} /><div style={bar("70%",N.soft2,6)} />
          </div>
        </div>
      </div>, "linear-gradient(160deg,#F0EEF4,#E6E2EE)");

    case "travel": return wrap(
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
        <div style={{ flex:1.3, background:"linear-gradient(160deg,#d6b89a,#b98a63)", position:"relative", padding:13 }}>
          <div style={bar(46,"rgba(255,255,255,.8)",7)} />
          <div style={{ position:"absolute", bottom:12, left:13, ...bar("64%","rgba(255,255,255,.92)",11), borderRadius:5 }} />
        </div>
        <div style={{ flex:1, background:"#fff", padding:12, display:"flex", gap:8 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
              <div style={{ height:26, borderRadius:6, background: i===1?a:"rgba(180,160,140,.2)" }} />
              <div style={bar("80%",N.soft2,4)} />
            </div>
          ))}
        </div>
      </div>, "#EDE6DD");

    case "devtool": return wrap(
      <div style={{ position:"absolute", inset:0, background:"#1c1b22", padding:13, display:"flex", flexDirection:"column", gap:7 }}>
        <div style={{ display:"flex", gap:5 }}>
          {["#E0654A","#D9A441","#5DAE6B"].map(c=>(
            <div key={c} style={{ width:8, height:8, borderRadius:"50%", background:c }} />
          ))}
        </div>
        {[["52%","#4b8fd6"],["74%","rgba(255,255,255,.32)"],["40%",a],["64%","rgba(255,255,255,.22)"],["48%","#7fb37f"]].map(([w,c],i)=>(
          <div key={i} style={{ display:"flex", gap:7, alignItems:"center", paddingLeft: i===2||i===4 ? 14 : 0 }}>
            <div style={{ width:14, height:5, borderRadius:3, background:"rgba(255,255,255,.12)" }} />
            <div style={bar(w,c,5)} />
          </div>
        ))}
      </div>, "#1c1b22");

    case "calendar": return wrap(
      <div style={{ position:"absolute", inset:0, padding:13, display:"flex", flexDirection:"column", gap:9 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={bar(50,N.soft,7)} />
          <div style={{ display:"flex", gap:5 }}>
            <div style={{ width:14,height:14,borderRadius:5,background:N.soft2 }} />
            <div style={{ width:14,height:14,borderRadius:5,background:a }} />
          </div>
        </div>
        <div style={{ flex:1, background:"#fff", borderRadius:9, border:"1px solid rgba(140,130,115,.16)", padding:10, display:"grid", gridTemplateColumns:"repeat(7,1fr)", gridAutoRows:"1fr", gap:5 }}>
          {Array.from({length:21}).map((_,i)=>(
            <div key={i} style={{ borderRadius:4, background: i===9 ? a : (i===12||i===16) ? "rgba(200,120,80,.28)" : "rgba(140,130,115,.12)" }} />
          ))}
        </div>
      </div>, "linear-gradient(150deg,#F5F1EA,#EEE7DC)");

    case "music": return wrap(
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,#2a2440,#3a2c4a)", padding:14, display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:10 }}>
        <div style={{ width:58, height:58, borderRadius:12, background:"linear-gradient(140deg,rgba(200,120,80,.9),rgba(150,80,160,.8))", alignSelf:"center", marginBottom:"auto", marginTop:10, boxShadow:"0 10px 24px rgba(0,0,0,.3)" }} />
        <div style={bar("70%","rgba(255,255,255,.85)",6)} />
        <div style={bar("45%","rgba(255,255,255,.4)",5)} />
        <div style={{ height:4, borderRadius:3, background:"rgba(255,255,255,.18)", position:"relative" }}>
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"45%", borderRadius:3, background:"#fff" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:14, alignItems:"center" }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,.5)" }} />
          <div style={{ width:24,height:24,borderRadius:"50%",background:"#fff" }} />
          <div style={{ width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,.5)" }} />
        </div>
      </div>, "#2a2440");

    case "estate": return wrap(
      <div style={{ position:"absolute", inset:0, padding:13, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ flex:1.2, borderRadius:9, background:"linear-gradient(160deg,#b7c2cf,#8fa0b3)", position:"relative" }}>
          <div style={{ position:"absolute", top:9, right:9, width:18, height:18, borderRadius:"50%", background:"rgba(255,255,255,.85)" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={bar("46%",N.soft,8)} /><div style={{ ...bar(34,a,9), borderRadius:5 }} />
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[0,1,2].map(i=>(<div key={i} style={{ flex:1, height:8, borderRadius:4, background:N.soft2 }} />))}
        </div>
      </div>, "linear-gradient(150deg,#EEF0F2,#E2E6EB)");

    default: return wrap(
      <div style={{ position:"absolute", inset:0, padding:14, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={bar("44%",N.soft,8)} />
        <div style={{ flex:1, background:"#fff", borderRadius:9, border:"1px solid rgba(140,130,115,.16)", padding:11, display:"flex", flexDirection:"column", gap:9 }}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:18, height:18, borderRadius:6, background: i===0 ? a : N.soft2 }} />
              <div style={bar(i===0?"60%":(70-i*8)+"%", N.soft, 5)} />
              <div style={{ marginLeft:"auto", ...bar(26, i%2?"rgba(200,120,80,.25)":N.soft2, 5) }} />
            </div>
          ))}
        </div>
      </div>, "linear-gradient(150deg,#F4F1EC,#ECE6DC)");
  }
}

/* ════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ════════════════════════════════════════════════════════════ */

function Tag({ dim, children }) {
  return <span className={"tag "+dim}><span className="dot" />{children}</span>;
}

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:24, height:24, borderRadius:7, position:"relative", overflow:"hidden", boxShadow:"inset 0 0 0 1px rgba(0,0,0,.08)" }}>
        <div style={{ position:"absolute", inset:0, background:"var(--accent)" }} />
        <div style={{ position:"absolute", right:0, top:0, width:"50%", height:"58%", background:"var(--tag-component-fg)" }} />
        <div style={{ position:"absolute", left:0, bottom:0, width:"100%", height:"42%", background:"var(--tag-platform-fg)" }} />
        <div style={{ position:"absolute", right:0, bottom:0, width:"50%", height:"42%", background:"var(--tag-style-fg)" }} />
      </div>
      <span style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:17, letterSpacing:"-0.02em" }}>Moodbase</span>
    </div>
  );
}

function AppBar({ activeTab, onTabChange, right, hideTabs }) {
  return (
    <header style={{ display:"flex", alignItems:"center", gap:18, padding:"0 24px", height:60,
                     borderBottom:"1px solid var(--border)", background:"var(--surface)", flex:"none", zIndex:10 }}>
      <Logo />
      {!hideTabs && (
        <nav style={{ display:"flex", gap:2, marginLeft:10 }}>
          {["Library","Projects"].map(n=>(
            <button key={n} onClick={()=>onTabChange(n)}
              style={{ all:"unset", fontSize:13.5, fontWeight:600, padding:"7px 12px", borderRadius:8, cursor:"pointer",
                color: n===activeTab ? "var(--text)" : "var(--text-3)",
                background: n===activeTab ? "var(--surface-2)" : "transparent" }}>{n}</button>
          ))}
        </nav>
      )}
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>{right}</div>
    </header>
  );
}

function Legend() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
      {Object.entries(DIMS).map(([k,v])=>(
        <span key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-3)", fontWeight:600 }}>
          <span style={{ width:8, height:8, borderRadius:3, background:'var(--border-2)' }} />{v.label}
        </span>
      ))}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="btn soft" style={{ padding:"8px 10px" }} onClick={onToggle} title="Toggle theme">
      {theme==="dark" ? <I.sun size={15} /> : <I.moon size={15} />}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   TAG EDITOR — reusable in preview modal
   ════════════════════════════════════════════════════════════ */

function TagEditor({ dim, values, onChange }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput]   = useState('');

  const remove = v => onChange(values.filter(t => t !== v));

  const commit = () => {
    const v = input.trim();
    if (v && !values.some(t => t.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setInput(''); setAdding(false);
  };

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center' }}>
      {values.map(v => (
        <button key={v} onClick={() => remove(v)} style={{
          all:'unset', display:'inline-flex', alignItems:'center', gap:5,
          fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, lineHeight:1,
          padding:'5px 6px 5px 9px', borderRadius:'var(--r-pill)', cursor:'pointer',
          background:'var(--surface-2)', color:'var(--text-2)',
          border:'1px solid var(--border-2)',
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', opacity:.85 }} />
          {v}
          <span style={{ display:'inline-flex', marginLeft:3, opacity:.7 }}><I.x size={12} /></span>
        </button>
      ))}
      {adding ? (
        <input autoFocus value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setInput(''); setAdding(false); } }}
          onBlur={commit} placeholder="Tag name…"
          style={{ all:'unset', fontSize:12, fontWeight:500, lineHeight:1,
            padding:'5px 10px', borderRadius:'var(--r-pill)',
            border:'1.5px solid var(--accent)', color:'var(--text)',
            background:'var(--surface)', width:110 }} />
      ) : (
        <button onClick={() => setAdding(true)} style={{
          all:'unset', display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
          fontWeight:600, padding:'5px 9px', lineHeight:1, borderRadius:'var(--r-pill)',
          border:'1px dashed var(--border-2)', cursor:'pointer', color:'var(--text-3)', whiteSpace:'nowrap',
        }}>
          <I.plus size={12} /> Add
        </button>
      )}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════ */

function Toast({ message, onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), 2400);
    const done = setTimeout(onDone, 2800);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, []);
  return ReactDOM.createPortal(
    <div style={{
      position:'fixed', bottom:32, left:'50%', zIndex:9999, pointerEvents:'none',
      display:'flex', alignItems:'center', gap:9,
      padding:'11px 20px', borderRadius:'var(--r-pill)',
      background:'var(--text)', color:'var(--bg)',
      fontFamily:'var(--font-body)', fontSize:14, fontWeight:600,
      boxShadow:'0 8px 28px rgba(0,0,0,.28)',
      animation: leaving ? 'toastOut .35s ease forwards' : 'toastIn .22s ease',
    }}>
      <I.check size={15} />{message}
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════
   ASSET PREVIEW MODAL
   ════════════════════════════════════════════════════════════ */

function AssetPreviewModal({ asset, onClose, onSave, showToast }) {
  const [mode, setMode]           = useState('edit');
  const [title, setTitle]         = useState(asset.title);
  const [sourceUrl, setSourceUrl] = useState(asset.sourceUrl || '');
  const [tags, setTags]           = useState({
    industry:  [...(asset.tags.industry  || [])],
    component: [...(asset.tags.component || [])],
    style:     [...(asset.tags.style     || [])],
    platform:  [...(asset.tags.platform  || [])],
  });

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mode]);

  const displaySource = (() => {
    const raw = sourceUrl.trim();
    if (!raw) return asset.source !== 'uploaded' ? asset.source : null;
    try { return new URL(raw.startsWith('http') ? raw : 'https://'+raw).hostname.replace(/^www\./, ''); }
    catch { return raw; }
  })();

  const handleSave = () => {
    const raw = sourceUrl.trim();
    const finalUrl = raw && !raw.startsWith('http') ? 'https://' + raw : raw;
    let source = displaySource || 'uploaded';
    onSave({ ...asset, title, sourceUrl: finalUrl || null, source, tags });
    showToast('Changes saved');
    onClose();
  };

  const LinkSvg = ({ size=14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  );

  const CloseBtn = ({ onClick }) => (
    <button onClick={onClick} style={{ all:'unset', width:28, height:28, borderRadius:7, cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'var(--text-3)', background:'var(--surface-2)' }}>
      <I.x size={14} />
    </button>
  );

  const ImagePanel = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    useEffect(() => {
      if (!asset.video || !asset.videoKey) return;
      let objUrl;
      idbGet(asset.videoKey).then(blob => {
        if (blob) { objUrl = URL.createObjectURL(blob); setVideoSrc(objUrl); }
      }).catch(() => {});
      return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
    }, []);
    return (
      <div style={{ flex:'0 0 52%', background:'#000', position:'relative', minHeight:320, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        {asset.video && videoSrc
          ? <video src={videoSrc} controls autoPlay={false}
              style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
          : asset.imageUrl
            ? <img src={asset.imageUrl} alt={title}
                style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
            : <div style={{ position:'absolute', inset:0 }}><Thumb kind={asset.kind} /></div>}
        {asset.video && !videoSrc && (
          <div style={{ position:'absolute', top:12, left:12, display:'flex', alignItems:'center', gap:5,
            padding:'4px 9px', borderRadius:999, background:'rgba(20,16,10,.65)', color:'#fff',
            fontSize:11.5, fontWeight:600, backdropFilter:'blur(4px)' }}>
            <I.play size={11} /> Clip
          </div>
        )}
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, display:'flex',
      alignItems:'center', justifyContent:'center', padding:24,
      background:'rgba(14,12,8,.72)', backdropFilter:'blur(14px)',
      fontFamily:'var(--font-body)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:900, maxHeight:'90vh',
        display:'flex', borderRadius:'var(--r-xl)', overflow:'hidden', background:'var(--surface)',
        boxShadow:'0 40px 100px rgba(0,0,0,.55)', color:'var(--text)' }}>

        <ImagePanel />

        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

          {mode === 'view' ? (<>
            {/* View header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end',
              padding:'14px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <CloseBtn onClick={onClose} />
            </div>

            {/* View body */}
            <div style={{ padding:'22px 22px', display:'flex', flexDirection:'column', gap:20, flex:1, overflowY:'auto' }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', margin:'0 0 8px' }}>{title}</h2>
                {displaySource && (
                  sourceUrl
                    ? <a href={sourceUrl.startsWith('http') ? sourceUrl : 'https://'+sourceUrl}
                        target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12.5,
                          color:'var(--text-3)', fontFamily:'var(--font-mono)', textDecoration:'none' }}>
                        <LinkSvg size={12}/>{displaySource}
                      </a>
                    : <span style={{ fontSize:12.5, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
                        {displaySource}
                      </span>
                )}
              </div>
              {Object.entries(DIMS).map(([dim, { label }]) => {
                const vals = tags[dim];
                if (!vals.length) return null;
                return (
                  <div key={dim} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em',
                      textTransform:'uppercase', color:'var(--text-3)' }}>{label}</span>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {vals.map(v => <Tag key={v} dim={dim}>{v}</Tag>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View footer */}
            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button className="btn soft" style={{ width:'100%' }} onClick={() => setMode('edit')}>
                Edit tags &amp; details
              </button>
            </div>
          </>) : (<>
            {/* Edit header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text-2)' }}>Edit reference</span>
              <CloseBtn onClick={onClose} />
            </div>

            {/* Edit form */}
            <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:16, flex:1, overflowY:'auto' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                <label style={{ fontSize:11.5, fontWeight:700, color:'var(--text-3)',
                  letterSpacing:'.06em', textTransform:'uppercase' }}>Title</label>
                <div className="field" style={{ padding:'9px 12px' }}>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reference title" />
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                <label style={{ fontSize:11.5, fontWeight:700, color:'var(--text-3)',
                  letterSpacing:'.06em', textTransform:'uppercase' }}>
                  Source URL <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>— optional</span>
                </label>
                <div className="field" style={{ padding:'9px 12px' }}>
                  <span style={{ color:'var(--text-3)', flex:'none', display:'flex' }}><LinkSvg /></span>
                  <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://dribbble.com/…" />
                </div>
              </div>
              {Object.entries(DIMS).map(([dim, { label }]) => (
                <div key={dim} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ width:8, height:8, borderRadius:3,
                      background:'var(--border-2)', flex:'none' }} />
                    <label style={{ fontSize:11.5, fontWeight:700, color:'var(--text-3)',
                      letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</label>
                    <span style={{ fontSize:11.5, color:'var(--text-3)' }}>
                      {tags[dim].length} tag{tags[dim].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <TagEditor dim={dim} values={tags[dim]}
                    onChange={v => setTags(prev => ({ ...prev, [dim]: v }))} />
                </div>
              ))}
            </div>

            {/* Edit footer */}
            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)',
              display:'flex', gap:10, flexShrink:0 }}>
              <button className="btn ghost" style={{ flex:'none' }} onClick={onClose}>Cancel</button>
              <button className="btn primary" style={{ flex:1 }} onClick={handleSave}>
                <I.check size={15} /> Save changes
              </button>
            </div>
          </>)}
        </div>
      </div>
    </div>,
    document.body
  );
}


/* ════════════════════════════════════════════════════════════
   SCREEN 1 — LIBRARY VIEW
   ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
   ════════════════════════════════════════════════════════════ */

function DeleteConfirmModal({ title, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return ReactDOM.createPortal(
    <div onClick={onCancel} style={{
      position:'fixed', inset:0, zIndex:300, display:'flex',
      alignItems:'center', justifyContent:'center', padding:24,
      background:'rgba(14,12,8,.72)', backdropFilter:'blur(14px)',
      fontFamily:'var(--font-body)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:400, borderRadius:'var(--r-xl)',
        background:'var(--surface)', border:'1px solid var(--border)',
        boxShadow:'0 32px 80px rgba(0,0,0,.5)', padding:'28px 28px 24px',
        display:'flex', flexDirection:'column', gap:16, color:'var(--text)',
      }}>
        <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center',
          justifyContent:'center', background:'color-mix(in oklab,#E0654A 14%,var(--surface))',
          color:'#C14B32' }}>
          <I.trash size={20} />
        </div>
        <div>
          <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:700, letterSpacing:'-0.01em' }}>
            Delete this reference?
          </h3>
          <p style={{ margin:0, fontSize:14, color:'var(--text-2)', lineHeight:1.5 }}>
            <b style={{ color:'var(--text)' }}>"{title}"</b> will be permanently removed from your library. This can't be undone.
          </p>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button className="btn ghost" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm} style={{
            all:'unset', flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center',
            gap:8, padding:'10px 16px', borderRadius:'var(--r-sm)', cursor:'pointer',
            fontFamily:'var(--font-body)', fontWeight:600, fontSize:14,
            background:'#C14B32', color:'#fff',
          }}>
            <I.trash size={15} /> Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AssetCard({ a, onClick, onDelete }) {
  const [hovered, setHovered]           = useState(false);
  const [confirmingDelete, setConfirming] = useState(false);
  const flat = [];
  ["industry","component","style","platform"].forEach(dim=>(a.tags[dim]||[]).forEach(v=>flat.push([dim,v])));
  const shown = flat.slice(0, 4);
  const extra = flat.length - shown.length;
  return (
    <>
      <figure onClick={onClick} className="card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ margin:0, overflow:"hidden", display:"flex", flexDirection:"column", cursor:"pointer", position:"relative" }}>
        <div style={{ position:"relative", aspectRatio:"4 / 3", background:"var(--surface-2)" }}>
          {a.imageUrl ? (
            <img src={a.imageUrl} alt={a.title}
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <Thumb kind={a.kind} />
          )}
          {a.video && (
            <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:5,
              padding:"4px 8px 4px 6px", borderRadius:999, background:"rgba(20,16,10,.6)", color:"#fff",
              fontSize:11, fontWeight:600, backdropFilter:"blur(4px)" }}>
              <I.play size={11} /> Clip
            </div>
          )}
          {/* Delete button — appears on hover */}
          {hovered && (
            <button onClick={e => { e.stopPropagation(); setConfirming(true); }}
              style={{ all:"unset", position:"absolute", top:10, right:10, width:30, height:30,
                borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(193,75,50,.88)", color:"#fff", cursor:"pointer",
                backdropFilter:"blur(4px)", transition:".14s" }}>
              <I.trash size={14} />
            </button>
          )}
        </div>
        <figcaption style={{ padding:"var(--card-pad)", display:"flex", flexDirection:"column", gap:9 }}>
          <span style={{ fontWeight:600, fontSize:14, letterSpacing:"-0.01em" }}>{a.title}</span>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {shown.map(([dim,v],i)=><Tag key={i} dim={dim}>{v}</Tag>)}
            {extra>0 && <span className="tag" style={{ background:"var(--surface-2)", color:"var(--text-3)", borderColor:"var(--border)" }}>+{extra}</span>}
          </div>
          <span style={{ fontSize:11.5, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{a.source}</span>
        </figcaption>
      </figure>

      {confirmingDelete && (
        <DeleteConfirmModal
          title={a.title}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onDelete(a.id); }} />
      )}
    </>
  );
}

const SORT_OPTIONS = [
  { value:"recent", label:"Most recent" },
  { value:"oldest", label:"Oldest first" },
  { value:"az",     label:"A → Z" },
  { value:"za",     label:"Z → A" },
];

function LibraryView({ assets, onUpdateAsset, onDeleteAsset, showToast, theme, onToggleTheme, onAddAsset, onNewProject, onTabChange }) {
  const [search, setSearch]               = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [previewAsset, setPreviewAsset]   = useState(null);
  const [cols, setCols]                   = useState(4);
  const [sortBy, setSortBy]               = useState("recent");

  const toggleFilter = key =>
    setActiveFilters(prev => prev.includes(key) ? prev.filter(f=>f!==key) : [...prev, key]);

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.title.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q) ||
      Object.values(a.tags).flat().some(t=>t.toLowerCase().includes(q));
    if (!matchSearch) return false;
    if (activeFilters.length===0) return true;
    return activeFilters.every(key => {
      const [dim, val] = key.split(":");
      return (a.tags[dim]||[]).includes(val);
    });
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "oldest") return a.id - b.id;
    if (sortBy === "az")     return a.title.localeCompare(b.title);
    if (sortBy === "za")     return b.title.localeCompare(a.title);
    return b.id - a.id; // most recent
  });

  return (
    <div className="mb mb-grain screen-enter" style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <AppBar activeTab="Library" onTabChange={onTabChange} right={
        <>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn primary" onClick={onAddAsset}><I.plus size={15} /> Add asset</button>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--surface-3)", border:"1px solid var(--border-2)", marginLeft:4 }} />
        </>
      } />

      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {/* Title row */}
        <div style={{ padding:"22px 28px 0" }}>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.025em" }}>Library</h1>
          <p style={{ margin:"5px 0 0", color:"var(--text-2)", fontSize:14 }}>
            <b style={{ color:"var(--text)", fontWeight:700 }}>{sorted.length}</b> of {assets.length} references
          </p>
        </div>

        {/* Controls */}
        <div style={{ padding:"16px 28px 14px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div className="field" style={{ flex:1, maxWidth:420 }}>
              <I.search size={16} />
              <input placeholder="Search title, source, or tag…" value={search}
                onChange={e=>setSearch(e.target.value)} />
            </div>

            <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
            {/* Sort */}
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{ all:"unset", display:"flex", alignItems:"center", height:40,
                padding:"0 32px 0 12px", borderRadius:"var(--r-sm)", fontSize:13.5, fontWeight:600,
                border:"1px solid var(--border-2)", background:"var(--surface)", color:"var(--text)",
                cursor:"pointer", appearance:"none", fontFamily:"var(--font-body)",
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center" }}>
              {SORT_OPTIONS.map(o=>(
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Column picker */}
            <div style={{ display:"flex", height:40, borderRadius:"var(--r-sm)",
              border:"1px solid var(--border-2)", background:"var(--surface)", overflow:"hidden" }}>
              {/* Icon */}
              <div style={{ display:"flex", alignItems:"center", padding:"0 10px",
                borderRight:"1px solid var(--border-2)", color:"var(--text-3)" }}>
                <I.cols size={13} />
              </div>
              {/* Numbers */}
              {[3,4,5].map(n=>(
                <button key={n} onClick={()=>setCols(n)} style={{ all:"unset", width:34, height:"100%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", fontSize:13, fontWeight:700, transition:".12s",
                  background: n===cols ? "var(--surface-2)" : "transparent",
                  color: n===cols ? "var(--text)" : "var(--text-3)",
                  borderRight: n!==5 ? "1px solid var(--border)" : "none" }}>
                  {n}
                </button>
              ))}
            </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            <button className={"pill"+(activeFilters.length===0?" on":"")} onClick={()=>setActiveFilters([])}>All</button>
            {FACET_PILLS.map(([dim,v],i)=>{
              const key = `${dim}:${v}`;
              const on = activeFilters.includes(key);
              return (
                <button key={i} className={"pill"+(on?" on":"")} onClick={()=>toggleFilter(key)}>
                  {v}
                </button>
              );
            })}
            <span style={{ fontSize:13, color:"var(--text-3)", fontWeight:600, padding:"0 6px", cursor:"pointer" }}>+ more filters</span>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 28px 28px" }}>
          {filtered.length===0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:280, gap:12, color:"var(--text-3)" }}>
              <I.image size={32} />
              <p style={{ fontSize:15, fontWeight:600, margin:0 }}>No matching references</p>
              <p style={{ fontSize:13, margin:0 }}>Try a different search or clear filters</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:"var(--grid-gap)" }}>
              {sorted.map(a=><AssetCard key={a.id} a={a} onClick={()=>setPreviewAsset(a)} onDelete={onDeleteAsset} />)}
            </div>
          )}
        </div>
      </div>

      {previewAsset && (
        <AssetPreviewModal
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
          showToast={showToast}
          onSave={updated => { onUpdateAsset(updated); }} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN 2 — UPLOAD FLOW
   ════════════════════════════════════════════════════════════ */

function SuggestTag({ dim, value, confirmed, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      all:"unset", display:"inline-flex", alignItems:"center", gap:6,
      fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, lineHeight:1,
      padding:"5px 6px 5px 9px", borderRadius:"var(--r-pill)", cursor:"pointer",
      letterSpacing:".01em", whiteSpace:"nowrap", opacity: confirmed===false ? .55 : 1,
      ...(confirmed===false ? {
        background:"transparent", border:"1px dashed var(--border-2)", color:"var(--text-3)"
      } : {
        background:"var(--surface-2)", color:"var(--text)", border:"1px solid var(--border-2)"
      })
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", opacity:.85 }} />
      {value}
      <span style={{ display:"inline-flex", marginLeft:3 }}>
        {confirmed===false ? <I.plus size={12} /> : <I.x size={12} />}
      </span>
    </button>
  );
}

function UploadFlow({ theme, onToggleTheme, onCancel, onSave, onTabChange }) {
  const EMPTY_TAGS = { confirmed:[], suggested:[] };
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [fileUrl, setFileUrl]     = useState(null);  // blob URL (preview only)
  const [fileDataUrl, setFileDataUrl] = useState(null); // base64 (persisted)
  const [title, setTitle]         = useState("");
  const [addingDim, setAddingDim] = useState(null);
  const [addInput, setAddInput]   = useState("");
  const [sourceUrl, setSourceUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError]   = useState(null);
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem('mb_apikey') || '');
  const [keyDraft, setKeyDraft]   = useState('');
  const [tags, setTags] = useState({
    industry:  { ...EMPTY_TAGS }, component: { ...EMPTY_TAGS },
    style:     { ...EMPTY_TAGS }, platform:  { ...EMPTY_TAGS },
  });
  const fileInputRef = useRef(null);
  const videoKeyRef  = useRef(null);
  const videoRef     = useRef(null);

  const captureCurrentFrame = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const scale = Math.min(1, 800 / Math.max(vid.videoWidth || 1, vid.videoHeight || 1));
    const w = Math.round((vid.videoWidth  || 640) * scale);
    const h = Math.round((vid.videoHeight || 360) * scale);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(vid, 0, 0, w, h);
    setFileDataUrl(cv.toDataURL('image/jpeg', 0.85));
  };

  /* ── Image / video → base64 helpers ── */
  const toBase64DataUrl = f => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(f);
  });

  const resizeTo1280 = dataUrl => new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      res(cv.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });

  // Smaller version for localStorage (keeps file size manageable)
  const resizeForStorage = dataUrl => new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 800 / Math.max(img.width, img.height));
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      res(cv.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });

  const captureVideoFrame = url => new Promise(res => {
    const vid = document.createElement('video');
    const cv  = document.createElement('canvas');
    vid.onloadeddata = () => { vid.currentTime = 0.5; };
    vid.onseeked = () => {
      const s = Math.min(1, 1280 / Math.max(vid.videoWidth || 1, vid.videoHeight || 1));
      cv.width  = Math.round((vid.videoWidth  || 640) * s);
      cv.height = Math.round((vid.videoHeight || 360) * s);
      cv.getContext('2d').drawImage(vid, 0, 0, cv.width, cv.height);
      res(cv.toDataURL('image/jpeg', 0.85));
      vid.src = '';
    };
    vid.onerror = () => res(null);
    vid.src = url; vid.load();
  });

  /* ── Claude vision analysis ── */
  const analyze = async (f, url, key) => {
    if (!key) return;
    setAnalyzing(true);
    setApiError(null);
    setTags({ industry:{...EMPTY_TAGS}, component:{...EMPTY_TAGS}, style:{...EMPTY_TAGS}, platform:{...EMPTY_TAGS} });
    try {
      let dataUrl;
      if (f.type.startsWith('video/')) {
        dataUrl = await captureVideoFrame(url);
      } else {
        const raw = await toBase64DataUrl(f);
        dataUrl   = await resizeTo1280(raw);
      }
      if (!dataUrl) throw new Error('Could not read file');
      const b64 = dataUrl.split(',')[1];

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-request-header': 'allow',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: [
              { type:'image', source:{ type:'base64', media_type:'image/jpeg', data:b64 } },
              { type:'text', text:`You are a design library tagging assistant. Analyze this UI/product design screenshot.

Return ONLY valid JSON — no markdown fences, no explanation. Exact structure:
{
  "confirmed": { "industry":[], "component":[], "style":[], "platform":[] },
  "suggested": { "industry":[], "component":[], "style":[], "platform":[] }
}

Rules:
- "confirmed": 2-4 tags per category that are clearly visible in the screenshot
- "suggested": 0-2 plausible additional tags per category
- "platform": 1-2 tags only (Web, Mobile, Desktop, or Tablet)

Available tags (use these when they fit; add specific ones if clearly warranted):
industry: Fintech, AI, Agriculture, E-commerce, Health, Developer, Travel, Media, Real estate, Productivity, SaaS, Education, Social, Gaming, Food, Logistics, HR, CRM
component: Dashboard, Card, Chart, Table, Form, Navigation, Chat, Input, Calendar, Map, Player, Hero, Button, Dropdown, Modal, Gallery, Stats, Slider, Search, Sidebar, List, Feed, Onboarding, Settings, Profile
style: Minimal, Bold, Dark mode, Light, Soft, Editorial, Warm, Clean, Calm, Friendly, Technical, Playful, Glassmorphism, Brutalist, Colorful, Monochrome, Illustrated
platform: Web, Mobile, Desktop, Tablet` }
            ]
          }]
        })
      });

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${resp.status}`);
      }
      const result = await resp.json();
      const text   = result.content[0].text.trim()
        .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(text);
      setTags({
        industry:  { confirmed: parsed.confirmed?.industry  || [], suggested: parsed.suggested?.industry  || [] },
        component: { confirmed: parsed.confirmed?.component || [], suggested: parsed.suggested?.component || [] },
        style:     { confirmed: parsed.confirmed?.style     || [], suggested: parsed.suggested?.style     || [] },
        platform:  { confirmed: parsed.confirmed?.platform  || [], suggested: parsed.suggested?.platform  || [] },
      });
    } catch(e) {
      setApiError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── File handlers ── */
  const acceptFile = f => {
    if (!f) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setFileUrl(url);
    setFileDataUrl(null);
    setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    setTags({ industry:{...EMPTY_TAGS}, component:{...EMPTY_TAGS}, style:{...EMPTY_TAGS}, platform:{...EMPTY_TAGS} });
    analyze(f, url, apiKey);
    // Store video blob in IndexedDB so the modal can play it back
    if (f.type.startsWith('video/')) {
      const key = 'vid_' + Date.now();
      videoKeyRef.current = key;
      idbPut(key, f).catch(() => {});
    } else {
      videoKeyRef.current = null;
    }
    // Generate compressed data URL for localStorage persistence
    (async () => {
      try {
        let dataUrl;
        if (f.type.startsWith('video/')) {
          dataUrl = await captureVideoFrame(url);
        } else {
          const raw = await toBase64DataUrl(f);
          dataUrl = await resizeForStorage(raw);
        }
        if (dataUrl) setFileDataUrl(dataUrl);
      } catch { /* ignore */ }
    })();
  };

  const removeFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (videoKeyRef.current) { idbDel(videoKeyRef.current).catch(() => {}); videoKeyRef.current = null; }
    setFile(null); setFileUrl(null); setFileDataUrl(null); setTitle(''); setSourceUrl(''); setApiError(null);
    setTags({ industry:{...EMPTY_TAGS}, component:{...EMPTY_TAGS}, style:{...EMPTY_TAGS}, platform:{...EMPTY_TAGS} });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) acceptFile(f);
  };

  const onFileChange = e => { const f = e.target.files[0]; if (f) acceptFile(f); };

  const fmtSize = bytes => bytes < 1048576
    ? (bytes / 1024).toFixed(0) + ' KB'
    : (bytes / 1048576).toFixed(1) + ' MB';

  const isVideo = file && file.type.startsWith('video/');

  const saveKey = () => {
    const key = keyDraft.trim();
    if (!key) return;
    localStorage.setItem('mb_apikey', key);
    setApiKey(key);
    setKeyDraft('');
    if (file && fileUrl) analyze(file, fileUrl, key);
  };

  /* ── Tag handlers ── */
  const removeConfirmed = (dim, value) =>
    setTags(prev => ({
      ...prev,
      [dim]: { ...prev[dim], confirmed: prev[dim].confirmed.filter(v => v !== value) }
    }));

  const confirmSuggested = (dim, value) =>
    setTags(prev => ({
      ...prev,
      [dim]: {
        confirmed: [...prev[dim].confirmed, value],
        suggested: prev[dim].suggested.filter(v => v !== value),
      }
    }));

  const commitAdd = dim => {
    const v = addInput.trim();
    if (v) {
      setTags(prev => {
        const exists = [...prev[dim].confirmed, ...prev[dim].suggested]
          .some(t => t.toLowerCase() === v.toLowerCase());
        if (exists) return prev;
        return { ...prev, [dim]: { ...prev[dim], confirmed: [...prev[dim].confirmed, v] } };
      });
    }
    setAddInput(''); setAddingDim(null);
  };

  return (
    <div className="mb mb-grain screen-enter" style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <AppBar activeTab="Library" onTabChange={onTabChange} hideTabs right={
        <>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn ghost" onClick={onCancel}><I.x size={15} /> Cancel</button>
        </>
      } />

      <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 460px" }}>
        {/* Left — unified drop / preview zone */}
        <div style={{ padding:"28px 32px", overflowY:"auto", borderRight:"1px solid var(--border)" }}>
          <span className="eyebrow">Step 1 · Upload</span>
          <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.025em", margin:"6px 0 4px" }}>Add an asset</h1>
          <p style={{ color:"var(--text-2)", fontSize:14, margin:"0 0 20px" }}>
            Drop a screenshot or short clip. Moodbase analyses it and proposes tags.
          </p>

          {/* The big box: drop zone OR file preview */}
          {fileUrl ? (
            /* ── Preview state ── */
            <>
              <div style={{ position:"relative", borderRadius:"var(--r-lg)", overflow:"hidden",
                border:"1px solid var(--border)", boxShadow:"var(--shadow)", background:"#000" }}>
                {isVideo ? (
                  <video ref={videoRef} src={fileUrl} controls
                    style={{ display:"block", width:"100%", maxHeight:460, objectFit:"contain", background:"#000" }} />
                ) : (
                  <img src={fileUrl} alt={file.name}
                    style={{ display:"block", width:"100%", maxHeight:460, objectFit:"contain", background:"var(--surface-2)" }} />
                )}
                {/* File badge */}
                <div style={{ position:"absolute", top:12, left:12, display:"flex", alignItems:"center", gap:5,
                  padding:"4px 9px", borderRadius:999, background:"rgba(20,16,10,.68)", color:"#fff",
                  fontSize:11.5, fontWeight:600, whiteSpace:"nowrap", backdropFilter:"blur(4px)" }}>
                  {isVideo ? <I.play size={11} /> : <I.image size={12} />}
                  {file.name} · {fmtSize(file.size)}
                </div>
                {/* Remove button */}
                <button onClick={removeFile}
                  style={{ all:"unset", position:"absolute", top:10, right:10, width:30, height:30,
                    borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                    background:"rgba(20,16,10,.68)", color:"#fff", cursor:"pointer",
                    backdropFilter:"blur(4px)", transition:".14s" }}
                  title="Remove file">
                  <I.x size={14} />
                </button>
              </div>

              {/* ── Thumbnail frame picker (video only) ── */}
              {isVideo && (
                <div style={{ marginTop:14, padding:"14px 16px", borderRadius:"var(--r-md)",
                  border:"1px solid var(--border)", background:"var(--surface)",
                  display:"flex", alignItems:"center", gap:14 }}>
                  {/* Current thumbnail preview */}
                  <div style={{ flex:"none", width:76, height:50, borderRadius:8, overflow:"hidden",
                    background:"var(--surface-2)", border:"1px solid var(--border-2)" }}>
                    {fileDataUrl
                      ? <img src={fileDataUrl} alt="thumbnail"
                          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                          justifyContent:"center", color:"var(--text-3)" }}>
                          <I.image size={18} />
                        </div>}
                  </div>
                  {/* Instructions */}
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 3px", fontSize:13.5, fontWeight:700, color:"var(--text)" }}>
                      Thumbnail frame
                    </p>
                    <p style={{ margin:0, fontSize:12.5, color:"var(--text-3)", lineHeight:1.45 }}>
                      Scrub or pause the video at any moment, then capture that frame.
                    </p>
                  </div>
                  {/* Capture button */}
                  <button className="btn soft" style={{ flex:"none", whiteSpace:"nowrap" }}
                    onClick={captureCurrentFrame}>
                    Capture frame
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── Empty / drop-zone state ── */
            <div
              onClick={()=>fileInputRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragging(false);}}
              onDrop={onDrop}
              style={{ border:`2px dashed ${dragging?"var(--accent)":"var(--border-2)"}`,
                borderRadius:"var(--r-lg)", aspectRatio:"16 / 10",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:14, cursor:"pointer", transition:".15s",
                background: dragging?"var(--accent-soft)":"var(--surface-2)",
                color: dragging?"var(--accent)":"var(--text-3)" }}>
              <div style={{ width:52, height:52, borderRadius:14, background:"var(--accent-soft)",
                color:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I.upload size={24} />
              </div>
              <div style={{ textAlign:"center", lineHeight:1.5 }}>
                <p style={{ margin:"0 0 4px", fontSize:14.5, fontWeight:700, color:"var(--text)" }}>
                  {dragging ? "Drop to upload" : <>Drag &amp; drop your file here</>}
                </p>
                <p style={{ margin:0, fontSize:13, color:"var(--text-3)" }}>
                  or <span style={{ color:"var(--accent)", fontWeight:600 }}>browse files</span>
                </p>
                <p style={{ margin:"8px 0 0", fontSize:12, color:"var(--text-3)" }}>PNG, JPG, GIF, MP4 · up to 25 MB</p>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*,video/*"
            style={{ display:"none" }} onChange={onFileChange} />
        </div>

        {/* Right — AI suggestions */}
        <div style={{ padding:28, overflowY:"auto", background:"var(--surface)", display:"flex", flexDirection:"column", gap:18 }}>

          {/* ── No file yet ── */}
          {!file && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              gap:12, color:"var(--text-3)", textAlign:"center", padding:"40px 0" }}>
              <I.sparkle size={28} />
              <p style={{ fontSize:14, fontWeight:600, margin:0 }}>Upload a file to get AI tag suggestions</p>
              <p style={{ fontSize:12.5, margin:0, maxWidth:220, lineHeight:1.5 }}>
                Drop or browse an image or clip on the left. Claude will analyse it and suggest tags instantly.
              </p>
            </div>
          )}

          {/* ── API key setup (shown after upload if key is missing) ── */}
          {file && !apiKey && (
            <div style={{ padding:"14px 16px", borderRadius:"var(--r-md)",
              border:"1px solid var(--border-2)", background:"var(--surface-2)" }}>
              <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:700, color:"var(--text)" }}>
                Add your Anthropic API key to enable AI analysis
              </p>
              <p style={{ margin:"0 0 12px", fontSize:12.5, color:"var(--text-3)", lineHeight:1.5 }}>
                Your key is stored only in this browser and never sent anywhere except Anthropic's API.
              </p>
              <div style={{ display:"flex", gap:8 }}>
                <div className="field" style={{ flex:1, padding:"8px 12px" }}>
                  <input type="password" placeholder="sk-ant-api03-…" value={keyDraft}
                    onChange={e=>setKeyDraft(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&saveKey()} />
                </div>
                <button className="btn primary" onClick={saveKey}>Save</button>
              </div>
            </div>
          )}

          {/* ── Analysing spinner ── */}
          {file && apiKey && analyzing && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 0", color:"var(--text-3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                  <animateTransform attributeName="transform" type="rotate"
                    from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
              <span style={{ fontSize:13.5, fontWeight:600 }}>Analysing image with Claude…</span>
            </div>
          )}

          {/* ── API error ── */}
          {file && apiError && (
            <div style={{ padding:"12px 14px", borderRadius:"var(--r-md)",
              background:"color-mix(in oklab,#E0654A 12%,var(--surface))",
              border:"1px solid color-mix(in oklab,#E0654A 28%,var(--surface))" }}>
              <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:700, color:"#C14B32" }}>Analysis failed</p>
              <p style={{ margin:"0 0 10px", fontSize:12.5, color:"var(--text-2)", lineHeight:1.4, wordBreak:"break-word" }}>{apiError}</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button className="btn soft" style={{ fontSize:12.5, padding:"7px 12px" }}
                  onClick={()=>analyze(file, fileUrl, apiKey)}>
                  <I.sparkle size={13} /> Retry
                </button>
                <button className="btn ghost" style={{ fontSize:12.5, padding:"7px 12px" }}
                  onClick={()=>{ localStorage.removeItem('mb_apikey'); setApiKey(''); setApiError(null); }}>
                  Change key
                </button>
              </div>
            </div>
          )}

          {/* ── AI suggestions header ── */}
          {file && apiKey && !analyzing && !apiError && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--accent)", marginBottom:8 }}>
                <I.sparkle size={17} />
                <span style={{ fontSize:12.5, fontWeight:700, letterSpacing:".04em", textTransform:"uppercase" }}>AI suggestions</span>
                <button onClick={()=>analyze(file, fileUrl, apiKey)}
                  style={{ all:"unset", marginLeft:"auto", fontSize:11.5, color:"var(--text-3)",
                    cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                  <I.sparkle size={11} /> Re-analyse
                </button>
              </div>
              <p style={{ margin:0, fontSize:13.5, color:"var(--text-2)", lineHeight:1.55 }}>
                <b style={{ color:"var(--text)" }}>Solid</b> = confirmed · tap × to remove.{" "}
                <b style={{ color:"var(--text)" }}>Dashed</b> = suggested · tap + to add.
              </p>
            </div>
          )}

          {/* ── Tag dimensions ── */}
          {file && !analyzing && Object.entries(tags).map(([dim, {confirmed, suggested}])=>(
            <div key={dim}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
                <span style={{ width:9, height:9, borderRadius:3, background:'var(--border-2)', flex:"none" }} />
                <span style={{ fontSize:13, fontWeight:700, letterSpacing:"-0.01em", whiteSpace:"nowrap" }}>
                  {DIMS[dim].label}
                </span>
                <span style={{ fontSize:11.5, color:"var(--text-3)", fontWeight:600, whiteSpace:"nowrap" }}>
                  {confirmed.length} confirmed
                </span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7, alignItems:"center" }}>
                {confirmed.map(v=>(
                  <SuggestTag key={v} dim={dim} value={v} confirmed={true}
                    onToggle={()=>removeConfirmed(dim,v)} />
                ))}
                {suggested.map(v=>(
                  <SuggestTag key={v} dim={dim} value={v} confirmed={false}
                    onToggle={()=>confirmSuggested(dim,v)} />
                ))}
                {addingDim===dim ? (
                  <input autoFocus value={addInput}
                    onChange={e=>setAddInput(e.target.value)}
                    onKeyDown={e=>{
                      if (e.key==="Enter") commitAdd(dim);
                      if (e.key==="Escape") { setAddInput(""); setAddingDim(null); }
                    }}
                    onBlur={()=>commitAdd(dim)}
                    placeholder="Tag name…"
                    style={{ all:"unset", fontSize:12, fontWeight:500, lineHeight:1,
                      padding:"5px 10px", borderRadius:"var(--r-pill)",
                      border:"1.5px solid var(--accent)", color:"var(--text)",
                      background:"var(--surface)", width:110 }} />
                ) : (
                  <button onClick={()=>{ setAddingDim(dim); setAddInput(""); }}
                    style={{ all:"unset", display:"inline-flex", alignItems:"center", gap:5,
                      fontSize:12, fontWeight:600, padding:"5px 9px", lineHeight:1,
                      borderRadius:"var(--r-pill)", border:"1px dashed var(--border-2)",
                      cursor:"pointer", color:"var(--text-3)", whiteSpace:"nowrap" }}>
                    <I.plus size={12} /> Add
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* ── Footer: title + save ── */}
          <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <label style={{ fontSize:12.5, fontWeight:700, color:"var(--text-2)" }}>Title</label>
              {apiKey && (
                <button onClick={()=>{ localStorage.removeItem('mb_apikey'); setApiKey(''); }}
                  style={{ all:"unset", fontSize:11.5, color:"var(--text-3)", cursor:"pointer" }}>
                  Change API key
                </button>
              )}
            </div>
            <div className="field">
              <input value={title} onChange={e=>setTitle(e.target.value)}
                placeholder={file ? "Give this reference a name…" : "Upload a file first…"}
                disabled={!file} />
            </div>
            <label style={{ fontSize:12.5, fontWeight:700, color:"var(--text-2)" }}>
              Source URL <span style={{ fontWeight:400, color:"var(--text-3)" }}>— optional</span>
            </label>
            <div className="field">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                style={{ color:"var(--text-3)", flex:"none" }}>
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              <input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}
                placeholder="https://dribbble.com/…" disabled={!file}
                onBlur={e => {
                  // auto-prefix https:// if user typed a bare domain
                  const v = e.target.value.trim();
                  if (v && !v.startsWith('http')) setSourceUrl('https://' + v);
                }} />
            </div>
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button className="btn ghost" style={{ flex:"none" }} onClick={onCancel}>Discard</button>
              <button className="btn primary"
                style={{ flex:1, opacity: file?1:.45, pointerEvents: file?"auto":"none" }}
                onClick={() => onSave({
                  id: Date.now(),
                  _user: true,
                  videoKey: videoKeyRef.current || null,
                  kind: "upload",
                  title: title || file.name,
                  sourceUrl: sourceUrl || null,
                  source: sourceUrl
                    ? (() => { try { return new URL(sourceUrl).hostname.replace(/^www\./,''); } catch { return sourceUrl; } })()
                    : "uploaded",
                  video: isVideo,
                  imageUrl: fileDataUrl || fileUrl,
                  tags: {
                    industry:  tags.industry.confirmed,
                    component: tags.component.confirmed,
                    style:     tags.style.confirmed,
                    platform:  tags.platform.confirmed,
                  }
                })}>
                <I.check size={16} /> Confirm &amp; save to library
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN 3 — NEW PROJECT FORM
   ════════════════════════════════════════════════════════════ */

function ChipGroup({ dim, options, selected, onToggle, single }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {options.map(o=>{
        const on = selected.includes(o);
        return (
          <button key={o} onClick={()=>onToggle(o)}
            style={{ all:"unset", display:"inline-flex", alignItems:"center", gap:7,
              fontFamily:"var(--font-body)", fontSize:13.5, fontWeight: on?600:500,
              padding:"8px 14px", borderRadius:"var(--r-pill)", cursor:"pointer",
              transition:".14s ease", lineHeight:1,
              background: on ? "var(--accent-soft)" : "var(--surface)",
              border: on ? "1px solid var(--accent-line)" : "1px solid var(--border-2)",
              color: on ? `color-mix(in oklab, var(--accent) 72%, var(--text))` : "var(--text-2)" }}>
            {on && <span style={{ color:"var(--accent)", display:"inline-flex" }}><I.check size={13} /></span>}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function FormSection({ dim, label, hint, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:9, height:9, borderRadius:3, background:'var(--border-2)', flex:"none" }} />
        <span style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.01em", whiteSpace:"nowrap" }}>{label}</span>
        {hint && <span style={{ fontSize:12, color:"var(--text-3)", fontWeight:500, whiteSpace:"nowrap" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function NewProjectForm({ theme, onToggleTheme, onCancel, onGenerate, onTabChange }) {
  const [name, setName] = useState("Orchard — farm supply marketplace");
  const [appType, setAppType]       = useState(["Marketplace"]);
  const [industry, setIndustry]     = useState(["Agriculture","E-commerce"]);
  const [components, setComponents] = useState(["Product grid","Card","Filters","Search"]);
  const [style, setStyle]           = useState(["Warm","Friendly","Clean"]);
  const [platform, setPlatform]     = useState(["Web"]);
  const [brandColor, setBrandColor] = useState("#C2683E");
  const [notes, setNotes]           = useState("Should feel trustworthy but approachable — earthy palette, generous imagery, easy for non-technical farmers.");

  const toggle = (setter, list, v) =>
    setter(list.includes(v) ? list.filter(x=>x!==v) : [...list, v]);
  const setOne = (setter, v) => setter([v]);

  const COLORS = ["#C2683E","#2E6FAE","#7A4FB5","#2E8056","#C9A227","#D14D6E","#3A3A40","#0E9CA8"];
  const totalTags = appType.length + industry.length + components.length + style.length + platform.length;

  const ctx = {
    name, appType: appType[0]||"Marketplace", industry, components, style,
    platform: platform[0]||"Web", color: brandColor,
  };

  return (
    <div className="mb mb-grain screen-enter" style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", position:"relative" }}>
      <AppBar activeTab="Projects" onTabChange={onTabChange} right={
        <>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn ghost" onClick={onCancel}><I.x size={15} /> Cancel</button>
        </>
      } />

      <div style={{ flex:1, overflow:"hidden", display:"flex", justifyContent:"center" }}>
        <div style={{ width:780, padding:"30px 20px 0", overflowY:"auto" }}>
          <span className="eyebrow">New project</span>
          <h1 style={{ fontSize:27, fontWeight:800, letterSpacing:"-0.03em", margin:"7px 0 5px" }}>Describe what you're building</h1>
          <p style={{ color:"var(--text-2)", fontSize:14.5, margin:"0 0 26px", maxWidth:560, lineHeight:1.5 }}>
            Moodbase searches your library for the closest references and drafts a written design direction.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:26, paddingBottom:120 }}>
            <FormSection dim="industry" label="Project name">
              <div className="field" style={{ maxWidth:420 }}>
                <input value={name} onChange={e=>setName(e.target.value)} />
              </div>
            </FormSection>

            <FormSection dim="industry" label="App type" hint="select one">
              <ChipGroup single options={["Marketplace","Dashboard","Mobile app","Landing page","Web app","Internal tool"]}
                selected={appType} onToggle={v=>setOne(setAppType,v)} />
            </FormSection>

            <FormSection dim="industry" label="Industry" hint="select all that apply">
              <ChipGroup options={["Agriculture","E-commerce","Fintech","AI","Health","Logistics","Travel","Real estate"]}
                selected={industry} onToggle={v=>toggle(setIndustry,industry,v)} />
            </FormSection>

            <FormSection dim="component" label="Components you need">
              <ChipGroup options={["Product grid","Card","Filters","Navigation","Cart","Search","Form","Map","Dashboard","Table","Chart"]}
                selected={components} onToggle={v=>toggle(setComponents,components,v)} />
            </FormSection>

            <FormSection dim="style" label="Visual style">
              <ChipGroup options={["Minimal","Bold","Warm","Editorial","Friendly","Dark mode","Clean","Playful"]}
                selected={style} onToggle={v=>toggle(setStyle,style,v)} />
            </FormSection>

            <FormSection dim="platform" label="Brand color">
              <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setBrandColor(c)}
                      style={{ all:"unset", width:34, height:34, borderRadius:9, background:c, cursor:"pointer",
                        boxShadow: c===brandColor
                          ? "0 0 0 2px var(--surface), 0 0 0 4px "+c
                          : "inset 0 0 0 1px rgba(0,0,0,.08)",
                        transition:".14s" }} />
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:8,
                  border:"1px solid var(--border-2)", background:"var(--surface)" }}>
                  <span style={{ width:18, height:18, borderRadius:5, background:brandColor }} />
                  <span className="mono" style={{ fontSize:13, fontWeight:600 }}>{brandColor}</span>
                </div>
              </div>
            </FormSection>

            <FormSection dim="platform" label="Platform">
              <ChipGroup single options={["Web","Mobile","Both"]}
                selected={platform} onToggle={v=>setOne(setPlatform,v)} />
            </FormSection>

            <FormSection dim="style" label="Notes" hint="optional">
              <div className="field" style={{ alignItems:"flex-start", padding:"12px 14px" }}>
                <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}
                  style={{ all:"unset", flex:1, fontFamily:"var(--font-body)", fontSize:14, lineHeight:1.5, resize:"none", width:"100%" }} />
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:74,
        borderTop:"1px solid var(--border)",
        background:"color-mix(in oklab, var(--surface) 88%, transparent)",
        backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
        <span style={{ fontSize:13, color:"var(--text-3)" }}>
          {totalTags} tags selected
        </span>
        <button className="btn primary" style={{ padding:"11px 22px" }} onClick={()=>onGenerate(ctx)}>
          <I.sparkle size={16} /> Generate design direction
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN 4 — RECOMMENDATIONS
   ════════════════════════════════════════════════════════════ */

const DEFAULT_MATCHES = [
  { id:2,  score:96, why:["Agriculture","Card","Friendly"] },
  { id:4,  score:91, why:["Grid","Card","E-commerce"] },
  { id:10, score:84, why:["Card","Clean","Listing"] },
  { id:7,  score:78, why:["Warm","Editorial","Hero"] },
  { id:9,  score:71, why:["Navigation","Minimal"] },
  { id:1,  score:64, why:["Dashboard","Light"] },
];

function ScoreRing({ score }) {
  const r = 17, circ = 2*Math.PI*r;
  return (
    <div style={{ flex:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:3, width:54 }}>
      <div style={{ position:"relative", width:42, height:42 }}>
        <svg width="42" height="42" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r={r} fill="none" stroke="var(--border-2)" strokeWidth="4" />
          <circle cx="21" cy="21" r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ*(1-score/100)} transform="rotate(-90 21 21)" />
        </svg>
        <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12.5, fontWeight:700, color:"var(--text)" }}>{score}</span>
      </div>
      <span style={{ fontSize:10, color:"var(--text-3)", fontWeight:600, letterSpacing:".03em" }}>MATCH</span>
    </div>
  );
}

function ScoreBadge({ score }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 9px", borderRadius:999,
      background:"rgba(20,16,10,.62)", color:"#fff", fontSize:12, fontWeight:700,
      backdropFilter:"blur(4px)", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)" }} />
      {score}% match
    </span>
  );
}

function MatchCard({ m, layout }) {
  const a = ASSETS.find(x=>x.id===m.id);
  const getDim = w => ["industry","component","style","platform"]
    .find(d=>(a.tags[d]||[]).some(v=>v.toLowerCase().includes(w.toLowerCase()))) || "component";

  if (layout==="list") {
    return (
      <div className="card" style={{ display:"flex", gap:14, padding:12, alignItems:"center", margin:0 }}>
        <div style={{ width:128, height:88, borderRadius:9, overflow:"hidden", position:"relative", flex:"none", background:"var(--surface-2)" }}>
          <Thumb kind={a.kind} />
          {a.video && (
            <div style={{ position:"absolute", bottom:6, left:6, width:20, height:20, borderRadius:"50%",
              background:"rgba(20,16,10,.6)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <I.play size={10} />
            </div>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:14.5 }}>{a.title}</span>
            <span style={{ fontSize:11.5, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{a.source}</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {m.why.map((w,i)=><Tag key={i} dim={getDim(w)}>{w}</Tag>)}
          </div>
        </div>
        <ScoreRing score={m.score} />
      </div>
    );
  }
  return (
    <figure className="card" style={{ margin:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <div style={{ position:"relative", aspectRatio:"16 / 11", background:"var(--surface-2)" }}>
        <Thumb kind={a.kind} />
        <div style={{ position:"absolute", top:10, right:10 }}><ScoreBadge score={m.score} /></div>
      </div>
      <figcaption style={{ padding:13, display:"flex", flexDirection:"column", gap:9 }}>
        <span style={{ fontWeight:700, fontSize:14 }}>{a.title}</span>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {m.why.map((w,i)=><Tag key={i} dim={getDim(w)}>{w}</Tag>)}
        </div>
      </figcaption>
    </figure>
  );
}

function ProjectPanel({ ctx, onEdit }) {
  const Row = ({ dim, label, values }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <span style={{ fontSize:11.5, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text-3)" }}>{label}</span>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {values.map(v=><Tag key={v} dim={dim}>{v}</Tag>)}
      </div>
    </div>
  );
  return (
    <>
      <span className="eyebrow">Project brief</span>
      <h2 style={{ fontSize:21, fontWeight:800, letterSpacing:"-0.025em", margin:"8px 0 18px", lineHeight:1.2 }}>{ctx.name}</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        <Row dim="component" label="App type"    values={[ctx.appType]} />
        <Row dim="industry"  label="Industry"    values={ctx.industry} />
        <Row dim="component" label="Components"  values={ctx.components} />
        <Row dim="style"     label="Style"       values={ctx.style} />
        <div style={{ display:"flex", gap:24 }}>
          <Row dim="platform" label="Platform" values={[ctx.platform]} />
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <span style={{ fontSize:11.5, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text-3)" }}>Brand</span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:22, height:22, borderRadius:6, background:ctx.color, boxShadow:"inset 0 0 0 1px rgba(0,0,0,.08)" }} />
              <span className="mono" style={{ fontSize:13, fontWeight:600 }}>{ctx.color}</span>
            </div>
          </div>
        </div>
      </div>
      <button className="btn soft" style={{ marginTop:24, width:"100%" }} onClick={onEdit}>Edit brief</button>
    </>
  );
}

function DirectionCard({ compact }) {
  return (
    <div className="card" style={{ padding: compact?20:24, background:"var(--surface)", position:"relative", overflow:"hidden", flexShrink:0 }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:"var(--accent)" }} />
      <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--accent)", marginBottom:12 }}>
        <I.sparkle size={17} />
        <span style={{ fontSize:12.5, fontWeight:700, letterSpacing:".04em", textTransform:"uppercase" }}>Generated design direction</span>
        <span style={{ marginLeft:"auto", fontSize:11.5, color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>from 6 references</span>
      </div>
      <p style={{ margin:"0 0 13px", fontSize:15.5, lineHeight:1.6, color:"var(--text)", fontWeight:500 }}>
        Lean into a <b>warm, grounded marketplace</b> feel — soft paper neutrals with your terracotta brand color as a single confident accent, not a flood.
      </p>
      <p style={{ margin:"0 0 13px", fontSize:14, lineHeight:1.65, color:"var(--text-2)" }}>
        Borrow <b style={{ color:"var(--text)" }}>FieldSense</b>'s friendly card rhythm and generous product imagery, and
        <b style={{ color:"var(--text)" }}> Lume</b>'s two-up grid with clear price emphasis. Keep filters as quiet pills
        above the grid so non-technical users aren't overwhelmed. Favor large tap targets, rounded 12px corners, and a legible humanist sans.
      </p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
        {["Paper neutrals + 1 accent","2-up product grid","Quiet filter pills","Generous imagery","12px radius","Humanist sans"].map(t=>(
          <span key={t} style={{ fontSize:12.5, fontWeight:600, padding:"5px 11px", borderRadius:999,
            background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text-2)" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Recommendations({ theme, onToggleTheme, ctx, onEdit, onTabChange }) {
  const [layout, setLayout] = useState("list");

  return (
    <div className="mb mb-grain screen-enter" style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <AppBar activeTab="Projects" onTabChange={onTabChange} right={
        <>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn soft"><I.sparkle size={15} /> Regenerate</button>
        </>
      } />
      <div style={{ flex:1, overflow:"hidden", display:"grid", gridTemplateColumns: layout==="list"?"330px 1fr":"360px 1fr" }}>
        {/* Left sidebar */}
        <aside style={{ borderRight:"1px solid var(--border)", padding:"26px 24px", overflowY:"auto",
          background:"var(--surface)", display:"flex", flexDirection:"column" }}>
          <ProjectPanel ctx={ctx} onEdit={onEdit} />
          {layout==="gallery" && (
            <div style={{ marginTop:26, paddingTop:22, borderTop:"1px solid var(--border)" }}>
              <DirectionCard compact />
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ overflowY:"auto", padding:"26px 30px", display:"flex", flexDirection:"column", gap: layout==="list"?22:0 }}>
          {layout==="list" && <DirectionCard />}
          <div style={{ flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:layout==="list"?14:16, flexWrap:"wrap", gap:10 }}>
              <div>
                <h3 style={{ fontSize: layout==="list"?17:18, fontWeight:800, letterSpacing:"-0.02em", margin:0 }}>Matched references</h3>
                <p style={{ margin:"4px 0 0", fontSize:13, color:"var(--text-3)" }}>
                  6 of {ASSETS.length} saved assets · ranked by relevance to your brief
                </p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className={"pill"+(layout==="gallery"?" on":"")} onClick={()=>setLayout("gallery")}>
                  <I.grid size={13} /> Grid
                </button>
                <button className={"pill"+(layout==="list"?" on":"")} onClick={()=>setLayout("list")}>
                  <I.layers size={13} /> List
                </button>
              </div>
            </div>
            {layout==="list" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {DEFAULT_MATCHES.map(m=><MatchCard key={m.id} m={m} layout="list" />)}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
                {DEFAULT_MATCHES.map(m=><MatchCard key={m.id} m={m} layout="card" />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT APP
   ════════════════════════════════════════════════════════════ */

const FONT_STACKS = {
  "Hanken Grotesk":  "'Hanken Grotesk', system-ui, sans-serif",
  "Plus Jakarta Sans":"'Plus Jakarta Sans', system-ui, sans-serif",
  "Editorial mix":   "__editorial__",
};

const DEFAULT_CTX = {
  name:"Orchard — farm supply marketplace",
  appType:"Marketplace",
  industry:["Agriculture","E-commerce"],
  components:["Product grid","Card","Filters","Search"],
  style:["Warm","Friendly","Clean"],
  platform:"Web",
  color:"#C2683E",
};

function App() {
  const [theme, setTheme]       = useState("light");
  const [accent]                = useState("#C2683E");
  const [screen, setScreen]     = useState("library");
  const [toast, setToast]       = useState(null);
  const [assets, setAssets]     = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mb_user_assets') || '[]');
      return [...(Array.isArray(saved) ? saved : []), ...ASSETS];
    } catch { return ASSETS; }
  });
  const [projectCtx, setProjectCtx] = useState(DEFAULT_CTX);

  const showToast = msg => setToast(msg);

  useEffect(() => {
    try {
      const userAssets = assets.filter(a => a._user);
      localStorage.setItem('mb_user_assets', JSON.stringify(userAssets));
    } catch { /* storage quota exceeded */ }
  }, [assets]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-ink", "#ffffff");
    root.style.setProperty("--font-head", FONT_STACKS["Hanken Grotesk"]);
    root.style.setProperty("--font-body", FONT_STACKS["Hanken Grotesk"]);
  }, [theme, accent]);

  const toggleTheme = () => setTheme(t => t==="dark" ? "light" : "dark");
  const handleTabChange = tab => {
    if (tab === "Library") setScreen("library");
    else if (tab === "Projects") setScreen("newproject");
  };
  const common = { theme, onToggleTheme: toggleTheme, onTabChange: handleTabChange };

  if (screen==="upload") return (
    <>
      <UploadFlow {...common}
        onCancel={() => setScreen("library")}
        onSave={asset => {
          setAssets(prev => [asset, ...prev]);
          setScreen("library");
          showToast("Asset added to library");
        }} />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
  if (screen==="newproject") return (
    <NewProjectForm {...common}
      onCancel={() => setScreen("library")}
      onGenerate={ctx => { setProjectCtx({ ...ctx, color: ctx.color||"#C2683E" }); setScreen("recommendations"); }} />
  );
  if (screen==="recommendations") return (
    <Recommendations {...common}
      ctx={projectCtx}
      onEdit={() => setScreen("newproject")} />
  );

  const updateAsset = updated =>
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));

  const deleteAsset = id =>
    setAssets(prev => prev.filter(a => a.id !== id));

  return (
    <>
      <LibraryView {...common} assets={assets} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset}
        showToast={showToast}
        onAddAsset={() => setScreen("upload")}
        onNewProject={() => setScreen("newproject")} />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
