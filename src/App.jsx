import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine
} from "recharts";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  bg:       "#07090f",
  surface:  "#0d1117",
  card:     "#111927",
  cardHover:"#152030",
  border:   "#1a2332",
  border2:  "#1f2d42",
  accent:   "#00c2ff",
  accent2:  "#0066ff",
  green:    "#00e5a0",
  red:      "#ff3d6b",
  yellow:   "#ffd166",
  purple:   "#8b5cf6",
  orange:   "#f97316",
  text:     "#e2e8f4",
  muted:    "#4d6380",
  muted2:   "#6b84a0",
};

// ─── DEMO DATA ───────────────────────────────────────────────────────────────
const ASSETS = [
  { id:1, ticker:"AAPL",  name:"Apple Inc.",            type:"Stock",  sector:"Technology",   geo:"USA",    currency:"USD", quantity:15,   avgCost:148.50, price:192.80, color:"#00c2ff" },
  { id:2, ticker:"MSFT",  name:"Microsoft Corp.",        type:"Stock",  sector:"Technology",   geo:"USA",    currency:"USD", quantity:8,    avgCost:295.00, price:378.40, color:"#0066ff" },
  { id:3, ticker:"VWCE",  name:"Vanguard FTSE All-World",type:"ETF",    sector:"Global",       geo:"Global", currency:"EUR", quantity:30,   avgCost:95.20,  price:113.60, color:"#8b5cf6" },
  { id:4, ticker:"CSPX",  name:"iShares Core S&P 500",  type:"ETF",    sector:"USA Equity",   geo:"USA",    currency:"USD", quantity:12,   avgCost:442.00, price:516.20, color:"#6366f1" },
  { id:5, ticker:"BTC",   name:"Bitcoin",               type:"Crypto", sector:"Crypto",       geo:"Global", currency:"USD", quantity:0.18, avgCost:36500,  price:63200,  color:"#f97316" },
  { id:6, ticker:"ETH",   name:"Ethereum",              type:"Crypto", sector:"Crypto",       geo:"Global", currency:"USD", quantity:1.5,  avgCost:1980,   price:3120,   color:"#ffd166" },
  { id:7, ticker:"XAUM",  name:"Gold ETC",              type:"ETF",    sector:"Commodities",  geo:"Global", currency:"EUR", quantity:20,   avgCost:175.00, price:198.40, color:"#e5c07b" },
  { id:8, ticker:"EUR",   name:"Cash EUR",              type:"Cash",   sector:"Cash",         geo:"Europe", currency:"EUR", quantity:2800, avgCost:1,      price:1,      color:"#00e5a0" },
];

function buildSnapshots() {
  const months = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
  let v = 28000;
  return months.map((m, i) => {
    v *= (1 + (Math.random() * 0.08 - 0.02));
    return { date: m, value: Math.round(v), pct: ((v - 28000) / 28000 * 100), monthIndex: i };
  });
}

const SNAPSHOTS = buildSnapshots();

// ─── BENCHMARK DATA ──────────────────────────────────────────────────────────
const BENCHMARKS = {
  sp500:     { label:'S&P 500',      color:'#f97316', isin:'IE00B5BMR087', desc:'500 maggiori aziende USA quotate al NYSE/NASDAQ. Il benchmark azionario più seguito al mondo.', data:[100,104,101,108,115,112,120,126,123,132,138,142] },
  msci:      { label:'MSCI World',   color:'#a855f7', isin:'IE00B4L5Y983', desc:'1.400+ aziende in 23 paesi sviluppati. Copre circa l'85% della capitalizzazione mondiale.', data:[100,103,100,106,112,109,117,122,119,127,133,136] },
  nasdaq:    { label:'Nasdaq 100',   color:'#00c2ff', isin:'IE0032077012',  desc:'100 maggiori aziende non-finanziarie del Nasdaq. Alto peso su tech (Apple, Microsoft, Nvidia).', data:[100,107,103,114,125,118,132,141,136,152,162,168] },
  gold:      { label:'Gold',         color:'#ffd166', isin:'IE00B579F325', desc:'Oro fisico. Bassa correlazione con azioni, usato come riserva di valore e hedging.', data:[100,102,104,103,106,108,107,110,112,111,114,116] },
  btc:       { label:'Bitcoin',      color:'#f59e0b', isin:'N/A — spot',   desc:'Prima criptovaluta per capitalizzazione. Alta volatilità, bassa correlazione con asset tradizionali.', data:[100,118,95,130,158,142,175,190,165,210,235,248] },
  eth:       { label:'Ethereum',     color:'#6366f1', isin:'N/A — spot',   desc:'Seconda crypto per capitalizzazione. Piattaforma smart contract, base del settore DeFi/NFT.', data:[100,115,90,125,150,135,168,182,158,198,220,235] },
  sp500val:  { label:'S&P Value',    color:'#10b981', isin:'IE00B3VVMM84', desc:'Azioni S&P 500 a basso P/E (valore). Tende a sovraperformare in fasi di rialzo dei tassi.', data:[100,102,100,104,108,106,110,113,111,116,119,121] },
  eurostoxx: { label:'Euro Stoxx 50',color:'#ec4899', isin:'IE00B53L3W79', desc:'50 blue chip dell'Eurozona. Esposizione a Francia, Germania, Spagna, Italia e altri.', data:[100,103,101,105,110,107,112,116,113,119,123,125] },
  bonds:     { label:'Bond Agg',     color:'#6b7799', isin:'IE00B3F81409', desc:'Obbligazioni globali investment grade. Bassa volatilità, utile per diversificare il rischio.', data:[100,101,99,100,101,100,101,102,101,102,103,103] },
  realestate:{ label:'Real Estate',  color:'#84cc16', isin:'IE00B1FZS244', desc:'REIT globali — immobiliare quotato. Buona fonte di dividendi, correlato ai tassi di interesse.', data:[100,101,99,102,105,103,107,109,107,111,113,114] },
  emerging:  { label:'Emerging Mkt', color:'#14b8a6', isin:'IE00B4L5YC18', desc:'Mercati emergenti (Cina, India, Brasile…). Alto potenziale, alta volatilità e rischio geopolitico.', data:[100,105,99,108,116,110,119,125,120,130,136,139] },
  vwce:      { label:'VWCE',         color:'#8b5cf6', isin:'IE00BK5BQT80', desc:'Vanguard FTSE All-World. ~3.700 aziende in paesi sviluppati ed emergenti. ETF per eccellenza del lazy investing.', data:[100,103,100,106,112,108,117,122,118,127,132,135] },
};

const DEFAULT_BENCHMARKS = ["msci", "sp500", "nasdaq", "gold"];

function buildBenchmarkSeries(snapshots) {
  const base = snapshots[0]?.value || 28000;
  return snapshots.map((s, i) => {
    const portPct = ((s.value - base) / base * 100);
    return {
      date: s.date,
      portafoglio: parseFloat(portPct.toFixed(2)),
      sp500:  parseFloat((BENCHMARKS.sp500.data[i]  - 100).toFixed(2)),
      msci:   parseFloat((BENCHMARKS.msci.data[i]   - 100).toFixed(2)),
      btc:    parseFloat((BENCHMARKS.btc.data[i]    - 100).toFixed(2)),
      bonds:  parseFloat((BENCHMARKS.bonds.data[i]  - 100).toFixed(2)),
    };
  });
}


function filterSnapshots(snapshots, tf) {
  const n = snapshots.length;
  if (tf === "1M") return snapshots.slice(-1);
  if (tf === "3M") return snapshots.slice(-3);
  if (tf === "6M") return snapshots.slice(-6);
  if (tf === "YTD") return snapshots; // same as full year in demo
  if (tf === "1Y") return snapshots;
  if (tf === "MAX") return snapshots;
  return snapshots;
}

const TRANSACTIONS = [
  { id:1, date:"2024-01-10", type:"buy",      ticker:"AAPL",  name:"Apple Inc.",        qty:15,   price:148.50, fees:1.50,  total:2229.00,  currency:"USD" },
  { id:2, date:"2024-01-15", type:"deposit",  ticker:"EUR",   name:"Cash Deposit",      qty:5000, price:1,      fees:0,     total:5000.00,  currency:"EUR" },
  { id:3, date:"2024-02-01", type:"buy",      ticker:"VWCE",  name:"Vanguard FTSE",     qty:30,   price:95.20,  fees:2.00,  total:2858.00,  currency:"EUR" },
  { id:4, date:"2024-02-14", type:"buy",      ticker:"BTC",   name:"Bitcoin",           qty:0.18, price:36500,  fees:12.00, total:6582.00,  currency:"USD" },
  { id:5, date:"2024-03-05", type:"buy",      ticker:"MSFT",  name:"Microsoft",         qty:8,    price:295.00, fees:1.50,  total:2361.50,  currency:"USD" },
  { id:6, date:"2024-04-01", type:"dividend", ticker:"AAPL",  name:"Apple Dividend",    qty:1,    price:24.00,  fees:0,     total:24.00,    currency:"USD" },
  { id:7, date:"2024-04-20", type:"buy",      ticker:"ETH",   name:"Ethereum",          qty:1.5,  price:1980,   fees:8.00,  total:2978.00,  currency:"USD" },
  { id:8, date:"2024-05-10", type:"buy",      ticker:"CSPX",  name:"iShares S&P500",    qty:12,   price:442.00, fees:2.00,  total:5306.00,  currency:"USD" },
  { id:9, date:"2024-06-01", type:"sell",     ticker:"AAPL",  name:"Apple Inc.",        qty:2,    price:185.00, fees:1.50,  total:368.50,   currency:"USD" },
  { id:10,date:"2024-07-15", type:"buy",      ticker:"XAUM",  name:"Gold ETC",          qty:20,   price:175.00, fees:1.50,  total:3501.50,  currency:"EUR" },
];

const MONTHLY_CONTRIBUTIONS = [
  { m:"Gen", val:5000 },{ m:"Feb", val:2860 },{ m:"Mar", val:2360 },
  { m:"Apr", val:0 },   { m:"Mag", val:5310 },{ m:"Giu", val:0 },
  { m:"Lug", val:3500 },{ m:"Ago", val:0 },   { m:"Set", val:0 },
  { m:"Ott", val:0 },   { m:"Nov", val:0 },   { m:"Dic", val:0 },
];

const DIVIDENDS = [
  { m:"Gen",val:0 },{ m:"Feb",val:0 },{ m:"Mar",val:0 },
  { m:"Apr",val:24 },{ m:"Mag",val:0 },{ m:"Giu",val:18 },
  { m:"Lug",val:0 },{ m:"Ago",val:24 },{ m:"Set",val:0 },
  { m:"Ott",val:22 },{ m:"Nov",val:0 },{ m:"Dic",val:26 },
];

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────
function calcHoldings(assets) {
  return assets.map(a => {
    const invested = a.quantity * a.avgCost;
    const current  = a.quantity * a.price;
    const pl       = current - invested;
    const plPct    = invested > 0 ? (pl / invested) * 100 : 0;
    return { ...a, invested, current, pl, plPct };
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const f2 = n => isNaN(n) ? "0.00" : Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtEur = n => `€ ${f2(n)}`;
const fmtPct = n => `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(2)}%`;
const clr = n => n >= 0 ? T.green : T.red;
const sign = n => n >= 0 ? "▲" : "▼";

const TYPE_CONFIG = {
  buy:      { label:"Acquisto",  color:T.accent,  bg:`${T.accent}18`  },
  sell:     { label:"Vendita",   color:T.red,     bg:`${T.red}18`     },
  dividend: { label:"Dividendo", color:T.green,   bg:`${T.green}18`   },
  deposit:  { label:"Deposito",  color:T.purple,  bg:`${T.purple}18`  },
  withdrawal:{ label:"Prelievo", color:T.yellow,  bg:`${T.yellow}18`  },
  fee:      { label:"Commissione",color:T.muted2, bg:`${T.muted}18`   },
};

const ASSET_TYPE_COLORS = { Stock:"#00c2ff", ETF:"#8b5cf6", Crypto:"#f97316", Cash:"#00e5a0" };
const SECTOR_COLORS = ["#00c2ff","#8b5cf6","#f97316","#00e5a0","#ffd166","#ff3d6b","#6366f1","#e5c07b"];

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix="€ " }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border2}`, borderRadius:10,
      padding:"10px 14px", boxShadow:"0 8px 32px #000a" }}>
      <div style={{ color:T.muted2, fontSize:11, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||T.accent, fontWeight:700, fontSize:14 }}>
          {prefix}{typeof p.value === "number" ? f2(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subColor, icon }) {
  return (
    <div style={{ background:T.card, borderRadius:16, padding:"20px 22px",
      border:`1px solid ${T.border}`, flex:1, minWidth:150 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ color:T.muted2, fontSize:11, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>{label}</div>
        {icon && <span style={{ fontSize:16, opacity:0.5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ color:subColor||T.muted2, fontSize:12, marginTop:7, fontWeight:600 }}>{sub}</div>}
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontWeight:800, fontSize:17, letterSpacing:"-0.02em" }}>{title}</div>
      {sub && <div style={{ color:T.muted2, fontSize:12, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      background:`${color}18`, color, border:`1px solid ${color}33`,
      borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:800,
      letterSpacing:"0.08em", textTransform:"uppercase", whiteSpace:"nowrap"
    }}>{label}</span>
  );
}

// ─── INFO TOOLTIP ─────────────────────────────────────────────────────────────
function InfoTooltip({ isin, desc }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:"relative", display:"inline-flex" }}
      onMouseEnter={()=>setShow(true)}
      onMouseLeave={()=>setShow(false)}>
      <span style={{
        width:15, height:15, borderRadius:"50%",
        background:T.border2, color:T.muted2,
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        fontSize:9, fontWeight:900, cursor:"default", flexShrink:0,
        border:`1px solid ${T.border2}`, lineHeight:1
      }}>i</span>
      {show && (
        <div style={{
          position:"absolute", left:"calc(100% + 8px)", top:"50%", transform:"translateY(-50%)",
          background:T.surface, border:`1px solid ${T.border2}`,
          borderRadius:12, padding:"12px 14px", zIndex:300,
          width:240, boxShadow:"0 12px 40px #000e",
          pointerEvents:"none"
        }}>
          <div style={{ color:T.text, fontSize:12, lineHeight:1.6, marginBottom:8 }}>{desc}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:T.muted, fontSize:10, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.08em" }}>ISIN</span>
            <span style={{ color:T.accent, fontSize:11, fontWeight:700,
              background:`${T.accent}12`, borderRadius:5, padding:"2px 7px",
              border:`1px solid ${T.accent}22` }}>{isin}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TIMEFRAME SELECTOR ───────────────────────────────────────────────────────
function TimeframeSelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, background:T.surface,
      borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
      {["1M","3M","6M","YTD","1Y","MAX"].map(tf => (
        <button key={tf} onClick={() => onChange(tf)} style={{
          background: value===tf ? T.card : "transparent",
          color: value===tf ? T.accent : T.muted2,
          border: value===tf ? `1px solid ${T.border2}` : "1px solid transparent",
          borderRadius:7, padding:"5px 11px", cursor:"pointer",
          fontSize:12, fontWeight:700, transition:"all .15s"
        }}>{tf}</button>
      ))}
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV = [
  { key:"dashboard",    label:"Dashboard",    icon:"◈" },
  { key:"holdings",     label:"Holdings",     icon:"⊞" },
  { key:"transactions", label:"Transazioni",  icon:"↕" },
  { key:"analytics",    label:"Analytics",    icon:"∿" },
  { key:"settings",     label:"Impostazioni", icon:"⚙" },
];

// ══════════════════════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════════════════════

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ holdings }) {
  const [tf, setTf] = useState("1Y");
  const [activeBenchmarks, setActiveBenchmarks] = useState(DEFAULT_BENCHMARKS);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredSnapshots = useMemo(() => {
    if (tf === "1M") return SNAPSHOTS.slice(-1);
    if (tf === "3M") return SNAPSHOTS.slice(-3);
    if (tf === "6M") return SNAPSHOTS.slice(-6);
    return SNAPSHOTS;
  }, [tf]);

  const benchSeries = useMemo(() => buildBenchmarkSeries(filteredSnapshots), [filteredSnapshots]);

  const totalCurrent  = holdings.reduce((s,h) => s + h.current, 0);
  const totalInvested = holdings.reduce((s,h) => s + h.invested, 0);
  const totalPL       = totalCurrent - totalInvested;
  const totalPLpct    = totalInvested ? (totalPL / totalInvested) * 100 : 0;
  const realizedPL    = 368.50 - (2 * 148.50); // from demo sell
  const cashBalance   = 2800;
  const dailyChange   = totalCurrent * 0.0034;

  // allocation by type
  const byType = useMemo(() => {
    const m = {};
    holdings.forEach(h => {
      if (!m[h.type]) m[h.type] = 0;
      m[h.type] += h.current;
    });
    return Object.entries(m).map(([name, value]) => ({
      name, value, pct: (value / totalCurrent) * 100
    }));
  }, [holdings, totalCurrent]);

  // sector allocation
  const bySector = useMemo(() => {
    const m = {};
    holdings.forEach(h => {
      if (!m[h.sector]) m[h.sector] = 0;
      m[h.sector] += h.current;
    });
    return Object.entries(m).map(([name, value], i) => ({
      name, value, pct: (value / totalCurrent) * 100, color: SECTOR_COLORS[i]
    }));
  }, [holdings, totalCurrent]);

  return (
    <div>
      {/* hero bar */}
      <div style={{
        background:`linear-gradient(135deg, #0d1829 0%, #0a1020 100%)`,
        borderRadius:20, padding:"28px 32px", marginBottom:20,
        border:`1px solid ${T.border2}`, position:"relative", overflow:"hidden"
      }}>
        <div style={{
          position:"absolute", top:-60, right:-60, width:240, height:240,
          borderRadius:"50%", background:`radial-gradient(circle, ${T.accent}12, transparent 70%)`
        }}/>
        <div style={{
          position:"absolute", bottom:-40, left:"40%", width:160, height:160,
          borderRadius:"50%", background:`radial-gradient(circle, ${T.accent2}10, transparent 70%)`
        }}/>
        <div style={{ color:T.muted2, fontSize:12, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
          Portafoglio Totale
        </div>
        <div style={{ fontSize:48, fontWeight:900, letterSpacing:"-0.04em", lineHeight:1,
          background:`linear-gradient(135deg, ${T.text}, ${T.accent})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          {fmtEur(totalCurrent)}
        </div>
        <div style={{ display:"flex", gap:24, marginTop:14, flexWrap:"wrap" }}>
          <span style={{ color:T.muted2, fontSize:13 }}>
            Investito: <strong style={{ color:T.text }}>{fmtEur(totalInvested)}</strong>
          </span>
          <span style={{ color:clr(totalPL), fontSize:15, fontWeight:800 }}>
            {sign(totalPL)} {fmtEur(Math.abs(totalPL))} ({fmtPct(totalPLpct)})
          </span>
          <span style={{ color:T.muted2, fontSize:12, marginLeft:"auto", alignSelf:"flex-end" }}>
            Aggiornato: oggi 18:42
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <KpiCard label="P&L Non Realizzato" value={fmtEur(totalPL)}
          sub={fmtPct(totalPLpct)} subColor={clr(totalPL)} icon="📈"/>
        <KpiCard label="P&L Realizzato" value={fmtEur(Math.abs(realizedPL))}
          sub="dalla vendita AAPL" subColor={clr(realizedPL)} icon="✓"/>
        <KpiCard label="Cash Balance" value={fmtEur(cashBalance)}
          sub="EUR disponibili" icon="💶"/>
        <KpiCard label="Variazione Giornaliera" value={fmtEur(dailyChange)}
          sub="+0.34% oggi" subColor={T.green} icon="∿"/>
        <KpiCard label="Rendimento Totale" value={fmtPct(totalPLpct)}
          sub={`su ${fmtEur(totalInvested)} investiti`} subColor={clr(totalPL)} icon="⊕"/>
      </div>

      {/* BENCHMARK COMPARISON CHART */}
      <div style={{ background:T.card, borderRadius:20, padding:"28px",
        border:`1px solid ${T.border}`, marginBottom:16 }}>
        
        {/* header row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:"-0.02em", marginBottom:4 }}>
              Benchmark Comparison
            </div>
            <div style={{ color:T.muted2, fontSize:12 }}>Portafoglio vs indici di mercato — rendimento %</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {/* active benchmark pills + dropdown */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              {activeBenchmarks.map(key => {
                const b = BENCHMARKS[key];
                if (!b) return null;
                return (
                  <div key={key} style={{
                    background:`${b.color}22`, color:b.color,
                    border:`1px solid ${b.color}55`,
                    borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700,
                    display:"flex", alignItems:"center", gap:6
                  }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:b.color,display:"inline-block" }}/>
                    {b.label}
                    <button onClick={()=>setActiveBenchmarks(p=>p.filter(k=>k!==key))}
                      style={{ background:"none", border:"none", color:b.color,
                        cursor:"pointer", fontSize:13, lineHeight:1, padding:"0 0 0 2px", fontWeight:900 }}>×</button>
                  </div>
                );
              })}

              {/* add benchmark dropdown */}
              <div style={{ position:"relative" }}>
                <button onClick={()=>setDropdownOpen(o=>!o)} style={{
                  background: dropdownOpen ? `${T.accent}22` : T.surface,
                  color: dropdownOpen ? T.accent : T.muted2,
                  border:`1px solid ${dropdownOpen ? T.accent+"44" : T.border}`,
                  borderRadius:8, padding:"5px 12px", cursor:"pointer",
                  fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:6
                }}>
                  ＋ Aggiungi indice
                  <span style={{ fontSize:9, opacity:0.7 }}>{dropdownOpen?"▲":"▼"}</span>
                </button>

                {dropdownOpen && (
                  <div style={{
                    position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:200,
                    background:T.card, border:`1px solid ${T.border2}`,
                    borderRadius:14, padding:"8px", minWidth:220,
                    boxShadow:"0 16px 48px #000d",
                    display:"flex", flexDirection:"column", gap:2
                  }}>
                    <div style={{ color:T.muted, fontSize:10, fontWeight:700,
                      textTransform:"uppercase", letterSpacing:"0.1em",
                      padding:"4px 8px 8px" }}>Seleziona indice</div>
                    {Object.entries(BENCHMARKS).map(([key, b]) => {
                      const active = activeBenchmarks.includes(key);
                      return (
                        <button key={key}
                          onClick={()=>{
                            setActiveBenchmarks(p => active ? p.filter(k=>k!==key) : [...p, key]);
                          }}
                          style={{
                            background: active ? `${b.color}18` : "transparent",
                            color: active ? b.color : T.text,
                            border:`1px solid ${active ? b.color+"33" : "transparent"}`,
                            borderRadius:8, padding:"9px 12px", cursor:"pointer",
                            fontSize:12, fontWeight: active ? 700 : 500,
                            textAlign:"left", display:"flex", alignItems:"center",
                            justifyContent:"space-between", gap:10, transition:"all .1s"
                          }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ width:10,height:10,borderRadius:3,
                              background:b.color,display:"inline-block",flexShrink:0 }}/>
                            {b.label}
                            <InfoTooltip isin={b.isin} desc={b.desc}/>
                          </div>
                          {active && <span style={{ fontSize:14, fontWeight:900 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <TimeframeSelector value={tf} onChange={setTf}/>
          </div>
        </div>

        {/* stat pills */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { label:"Il tuo portafoglio", color:T.accent,
              val: benchSeries.length ? `+${benchSeries[benchSeries.length-1].portafoglio.toFixed(1)}%` : "—" },
            ...Object.entries(BENCHMARKS)
              .filter(([k])=>activeBenchmarks.includes(k))
              .map(([k,b]) => ({
                label: b.label, color: b.color,
                val: benchSeries.length ? `+${benchSeries[benchSeries.length-1][k]?.toFixed(1)||0}%` : "—"
              }))
          ].map(item => (
            <div key={item.label} style={{
              background: `${item.color}12`,
              border: `1px solid ${item.color}33`,
              borderRadius:10, padding:"8px 14px",
              display:"flex", alignItems:"center", gap:8
            }}>
              <div style={{ width:10, height:10, borderRadius:3, background:item.color }}/>
              <span style={{ color:T.muted2, fontSize:11 }}>{item.label}</span>
              <span style={{ color:item.color, fontWeight:800, fontSize:14 }}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* main line chart */}
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={benchSeries} margin={{ top:5, right:10, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
            <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v => v+"%"} width={46}/>
            <ReferenceLine y={0} stroke={T.muted2} strokeDasharray="4 4" strokeWidth={1}/>
            <Tooltip
              contentStyle={{ background:T.card, border:`1px solid ${T.border2}`, borderRadius:12,
                boxShadow:"0 8px 32px #000c", padding:"12px 16px" }}
              labelStyle={{ color:T.muted2, fontSize:11, marginBottom:6 }}
              formatter={(val, name) => [
                <span style={{ fontWeight:800 }}>{val > 0 ? "+" : ""}{val}%</span>,
                name === "portafoglio" ? "Il tuo portafoglio" : BENCHMARKS[name]?.label || name
              ]}
            />
            {/* portafoglio — always shown, thicker */}
            <Line type="monotone" dataKey="portafoglio" stroke={T.accent}
              strokeWidth={3} dot={false} name="portafoglio"
              strokeDasharray={undefined}/>
            {/* benchmarks */}
            {activeBenchmarks.map(key => (
              <Line key={key} type="monotone" dataKey={key}
                stroke={BENCHMARKS[key].color} strokeWidth={1.5}
                dot={false} strokeDasharray="5 3" name={key}/>
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* outperformance summary */}
        <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
          {Object.entries(BENCHMARKS)
            .filter(([k]) => activeBenchmarks.includes(k))
            .map(([key, b]) => {
              const last = benchSeries[benchSeries.length-1];
              if (!last) return null;
              const diff = (last.portafoglio - (last[key]||0));
              const beating = diff > 0;
              return (
                <div key={key} style={{
                  background: beating ? `${T.green}10` : `${T.red}10`,
                  border: `1px solid ${beating ? T.green : T.red}33`,
                  borderRadius:10, padding:"10px 16px", flex:1, minWidth:140
                }}>
                  <div style={{ color:T.muted2, fontSize:10, fontWeight:700,
                    textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>
                    vs {b.label}
                  </div>
                  <div style={{ color: beating ? T.green : T.red, fontWeight:900, fontSize:18 }}>
                    {beating?"+":""}{diff.toFixed(2)}%
                  </div>
                  <div style={{ color:T.muted2, fontSize:11, marginTop:2 }}>
                    {beating ? "🏆 Stai battendo l'indice" : "📉 Sotto la media"}
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* value chart + allocation */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16, marginBottom:16 }}>
        {/* area chart */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px",
          border:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <SectionHeader title="Valore Portafoglio" sub="Performance storica"/>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={filteredSnapshots} margin={{ top:5, right:10, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}
                tickFormatter={v => "€"+Math.round(v/1000)+"k"} width={50}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Area type="monotone" dataKey="value" stroke={T.accent} strokeWidth={2.5}
                fill="url(#g1)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* donut allocation */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px",
          border:`1px solid ${T.border}` }}>
          <SectionHeader title="Allocazione" sub="Per categoria"/>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byType} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                paddingAngle={3} dataKey="value" stroke="none">
                {byType.map((e,i) => (
                  <Cell key={i} fill={ASSET_TYPE_COLORS[e.name] || T.muted}/>
                ))}
              </Pie>
              <Tooltip formatter={v => fmtEur(v)}
                contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
            {byType.map(c => (
              <div key={c.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:3,
                    background:ASSET_TYPE_COLORS[c.name]||T.muted }}/>
                  <span style={{ color:T.muted2, fontSize:13 }}>{c.name}</span>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ color:T.muted2, fontSize:12 }}>{fmtEur(c.value)}</span>
                  <span style={{ fontWeight:800, fontSize:13,
                    color:ASSET_TYPE_COLORS[c.name]||T.text }}>{c.pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* second row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
        {/* sector */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px",
          border:`1px solid ${T.border}` }}>
          <SectionHeader title="Settori" sub="Esposizione per settore"/>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {bySector.map((s,i) => (
              <div key={s.name}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:T.muted2 }}>{s.name}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.pct.toFixed(1)}%</span>
                </div>
                <div style={{ height:4, background:T.border, borderRadius:2 }}>
                  <div style={{ height:4, width:`${s.pct}%`, background:s.color, borderRadius:2 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* contributions */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px",
          border:`1px solid ${T.border}` }}>
          <SectionHeader title="Contributi Mensili" sub="Versamenti nel 2024"/>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={MONTHLY_CONTRIBUTIONS} margin={{ top:0, right:0, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="m" tick={{ fill:T.muted, fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:T.muted, fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v ? "€"+v/1000+"k" : ""} width={38}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="val" fill={T.purple} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* dividends */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px",
          border:`1px solid ${T.border}` }}>
          <SectionHeader title="Dividendi" sub="Incassi per mese"/>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={DIVIDENDS} margin={{ top:0, right:0, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="m" tick={{ fill:T.muted, fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:T.muted, fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v ? "€"+v : ""} width={30}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="val" fill={T.green} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* top movers */}
      <div style={{ background:T.card, borderRadius:20, padding:"24px",
        border:`1px solid ${T.border}` }}>
        <SectionHeader title="Top Holdings" sub="Per performance"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[...holdings].sort((a,b) => b.plPct - a.plPct).slice(0,4).map(h => (
            <div key={h.id} style={{
              background:T.surface, borderRadius:14, padding:"16px",
              border:`1px solid ${T.border}`, transition:"all .2s"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background:`${h.color}22`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:h.color, fontWeight:900, fontSize:11
                }}>{h.ticker.slice(0,3)}</div>
                <Badge label={h.type} color={ASSET_TYPE_COLORS[h.type]||T.muted}/>
              </div>
              <div style={{ fontWeight:800, fontSize:14, marginBottom:2 }}>{h.ticker}</div>
              <div style={{ color:T.muted2, fontSize:11, marginBottom:10 }}>{h.name}</div>
              <div style={{ color:clr(h.plPct), fontWeight:800, fontSize:20 }}>
                {fmtPct(h.plPct)}
              </div>
              <div style={{ color:T.muted2, fontSize:12 }}>{fmtEur(h.pl)} P&L</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HOLDINGS PAGE ─────────────────────────────────────────────────────────────
function HoldingsPage({ holdings }) {
  const [sort, setSort] = useState("value");
  const totalCurrent = holdings.reduce((s,h) => s + h.current, 0);

  const sorted = useMemo(() => [...holdings].sort((a,b) => {
    if (sort==="value") return b.current - a.current;
    if (sort==="pl")    return b.pl - a.pl;
    if (sort==="plpct") return b.plPct - a.plPct;
    if (sort==="ticker") return a.ticker.localeCompare(b.ticker);
    return 0;
  }), [holdings, sort]);

  const cols = [
    { key:"ticker", label:"Asset" },
    { key:"value",  label:"Valore" },
    { key:"qty",    label:"Quantità" },
    { key:"avg",    label:"Costo Medio" },
    { key:"price",  label:"Prezzo Att." },
    { key:"cost",   label:"Costo Totale" },
    { key:"pl",     label:"P&L €" },
    { key:"plpct",  label:"P&L %" },
    { key:"alloc",  label:"Alloc." },
  ];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <SectionHeader title="Holdings" sub={`${holdings.length} posizioni aperte`}/>
        <div style={{ display:"flex", gap:8 }}>
          {[["value","Valore"],["pl","P&L €"],["plpct","P&L %"],["ticker","Ticker"]].map(([k,l])=>(
            <button key={k} onClick={()=>setSort(k)} style={{
              background: sort===k ? `${T.accent}18` : T.card,
              color: sort===k ? T.accent : T.muted2,
              border:`1px solid ${sort===k?T.accent+"44":T.border}`,
              borderRadius:8, padding:"6px 12px", cursor:"pointer",
              fontSize:11, fontWeight:700
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        {/* header */}
        <div style={{
          display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr",
          padding:"14px 20px", borderBottom:`1px solid ${T.border}`,
          background:T.surface
        }}>
          {cols.map(c => (
            <div key={c.key} style={{ color:T.muted, fontSize:10, fontWeight:800,
              textTransform:"uppercase", letterSpacing:"0.08em",
              textAlign: c.key==="ticker" ? "left" : "right" }}>{c.label}</div>
          ))}
        </div>

        {sorted.map((h, i) => {
          const alloc = (h.current / totalCurrent) * 100;
          return (
            <div key={h.id} style={{
              display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr",
              padding:"16px 20px",
              borderBottom: i < sorted.length-1 ? `1px solid ${T.border}` : "none",
              background: i%2===0 ? "transparent" : `${T.surface}66`,
              transition:"background .15s"
            }}>
              {/* asset */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background:`${h.color}22`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:h.color, fontWeight:900, fontSize:11, flexShrink:0
                }}>{h.ticker.slice(0,3)}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:14 }}>{h.ticker}</div>
                  <div style={{ color:T.muted2, fontSize:11 }}>{h.name}</div>
                  <Badge label={h.type} color={ASSET_TYPE_COLORS[h.type]||T.muted}/>
                </div>
              </div>
              {/* value */}
              <div style={{ textAlign:"right", fontWeight:700, fontSize:14, alignSelf:"center" }}>
                {fmtEur(h.current)}
              </div>
              {/* qty */}
              <div style={{ textAlign:"right", color:T.muted2, fontSize:13, alignSelf:"center" }}>
                {h.quantity}
              </div>
              {/* avg cost */}
              <div style={{ textAlign:"right", color:T.muted2, fontSize:13, alignSelf:"center" }}>
                {fmtEur(h.avgCost)}
              </div>
              {/* current price */}
              <div style={{ textAlign:"right", fontWeight:600, fontSize:13, alignSelf:"center" }}>
                {fmtEur(h.price)}
              </div>
              {/* cost basis */}
              <div style={{ textAlign:"right", color:T.muted2, fontSize:13, alignSelf:"center" }}>
                {fmtEur(h.invested)}
              </div>
              {/* pl € */}
              <div style={{ textAlign:"right", color:clr(h.pl), fontWeight:700, fontSize:13, alignSelf:"center" }}>
                {h.pl>=0?"+":"-"}{fmtEur(Math.abs(h.pl))}
              </div>
              {/* pl % */}
              <div style={{ textAlign:"right", color:clr(h.plPct), fontWeight:800, fontSize:14, alignSelf:"center" }}>
                {fmtPct(h.plPct)}
              </div>
              {/* alloc */}
              <div style={{ textAlign:"right", alignSelf:"center" }}>
                <div style={{ color:T.muted2, fontSize:12, marginBottom:4 }}>{alloc.toFixed(1)}%</div>
                <div style={{ height:3, background:T.border, borderRadius:2 }}>
                  <div style={{ height:3, width:`${Math.min(alloc,100)}%`,
                    background:h.color, borderRadius:2 }}/>
                </div>
              </div>
            </div>
          );
        })}

        {/* totals */}
        <div style={{
          display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr",
          padding:"16px 20px",
          background:`linear-gradient(135deg,${T.accent}0a,${T.accent2}0a)`,
          borderTop:`1px solid ${T.accent}33`
        }}>
          <div style={{ fontWeight:800, fontSize:14, color:T.accent }}>TOTALE</div>
          <div style={{ textAlign:"right", fontWeight:800, fontSize:15 }}>
            {fmtEur(holdings.reduce((s,h)=>s+h.current,0))}
          </div>
          <div/><div/><div/>
          <div style={{ textAlign:"right", fontWeight:700, fontSize:13 }}>
            {fmtEur(holdings.reduce((s,h)=>s+h.invested,0))}
          </div>
          <div style={{ textAlign:"right", fontWeight:800, fontSize:14,
            color:clr(holdings.reduce((s,h)=>s+h.pl,0)) }}>
            {fmtEur(Math.abs(holdings.reduce((s,h)=>s+h.pl,0)))}
          </div>
          <div style={{ textAlign:"right", fontWeight:800, fontSize:14,
            color:clr(holdings.reduce((s,h)=>s+h.pl,0)/holdings.reduce((s,h)=>s+h.invested,0)*100) }}>
            {fmtPct(holdings.reduce((s,h)=>s+h.pl,0)/holdings.reduce((s,h)=>s+h.invested,0)*100)}
          </div>
          <div/>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS PAGE ────────────────────────────────────────────────────────
function TransactionsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:"buy", ticker:"", qty:"", price:"", fees:"", date:"", notes:"" });

  const types = ["all","buy","sell","dividend","deposit","withdrawal"];

  const filtered = TRANSACTIONS.filter(t => {
    if (filter !== "all" && t.type !== filter) return false;
    if (search && !t.ticker.toLowerCase().includes(search.toLowerCase()) &&
        !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <SectionHeader title="Transazioni" sub={`${filtered.length} operazioni`}/>
        <button onClick={()=>setShowForm(s=>!s)} style={{
          background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
          color:"#fff", border:"none", borderRadius:10,
          padding:"10px 18px", cursor:"pointer", fontWeight:800, fontSize:13
        }}>＋ Nuova Transazione</button>
      </div>

      {/* add form */}
      {showForm && (
        <div style={{ background:T.card, borderRadius:20, padding:"24px",
          border:`1px solid ${T.accent}33`, marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Nuova Transazione</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
            {/* type */}
            <div>
              <label style={{ display:"block", color:T.muted2, fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Tipo</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`,
                  borderRadius:10, padding:"10px 12px", color:T.text, fontSize:13 }}>
                {["buy","sell","dividend","deposit","withdrawal","fee"].map(t=>(
                  <option key={t} value={t}>{TYPE_CONFIG[t]?.label||t}</option>
                ))}
              </select>
            </div>
            {[["ticker","Ticker","text"],["qty","Quantità","number"],
              ["price","Prezzo (€)","number"],["fees","Commissioni (€)","number"],
              ["date","Data","date"]].map(([k,l,type])=>(
              <div key={k}>
                <label style={{ display:"block", color:T.muted2, fontSize:11, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{l}</label>
                <input type={type} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  placeholder={l} style={{ width:"100%", background:T.surface,
                    border:`1px solid ${T.border}`, borderRadius:10,
                    padding:"10px 12px", color:T.text, fontSize:13, boxSizing:"border-box" }}/>
              </div>
            ))}
          </div>
          {/* preview */}
          {form.qty && form.price && (
            <div style={{ background:`${T.accent}0a`, borderRadius:10, padding:"12px 16px",
              border:`1px solid ${T.accent}22`, marginBottom:12 }}>
              <span style={{ color:T.muted2, fontSize:12 }}>Totale stimato: </span>
              <span style={{ color:T.accent, fontWeight:800, fontSize:15 }}>
                {fmtEur((+form.qty*(+form.price))+(+form.fees||0))}
              </span>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowForm(false)} style={{
              background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
              color:"#fff", border:"none", borderRadius:10,
              padding:"10px 24px", cursor:"pointer", fontWeight:800, fontSize:13
            }}>Salva Transazione</button>
            <button onClick={()=>setShowForm(false)} style={{
              background:T.surface, color:T.muted2,
              border:`1px solid ${T.border}`, borderRadius:10,
              padding:"10px 18px", cursor:"pointer", fontWeight:700, fontSize:13
            }}>Annulla</button>
          </div>
        </div>
      )}

      {/* filters */}
      <div style={{ display:"flex", gap:12, marginBottom:16, alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Cerca ticker o nome..."
          style={{ background:T.card, border:`1px solid ${T.border}`,
            borderRadius:10, padding:"9px 14px", color:T.text, fontSize:13,
            width:200, outline:"none" }}/>
        <div style={{ display:"flex", gap:4 }}>
          {types.map(t => (
            <button key={t} onClick={()=>setFilter(t)} style={{
              background: filter===t ? `${T.accent}18` : T.card,
              color: filter===t ? T.accent : T.muted2,
              border:`1px solid ${filter===t?T.accent+"44":T.border}`,
              borderRadius:8, padding:"7px 12px", cursor:"pointer",
              fontSize:11, fontWeight:700, textTransform:"capitalize"
            }}>{t==="all" ? "Tutti" : TYPE_CONFIG[t]?.label||t}</button>
          ))}
        </div>
      </div>

      {/* table */}
      <div style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"0.7fr 1.5fr 1fr 1fr 1fr 1fr 1fr 0.8fr",
          padding:"12px 20px", borderBottom:`1px solid ${T.border}`, background:T.surface }}>
          {["Data","Asset","Tipo","Quantità","Prezzo","Commissioni","Totale",""].map((h,i)=>(
            <div key={i} style={{ color:T.muted, fontSize:10, fontWeight:800,
              textTransform:"uppercase", letterSpacing:"0.08em",
              textAlign: i>1 ? "right" : "left" }}>{h}</div>
          ))}
        </div>
        {filtered.map((t, i) => {
          const tc = TYPE_CONFIG[t.type] || { label:t.type, color:T.muted, bg:`${T.muted}18` };
          return (
            <div key={t.id} style={{
              display:"grid", gridTemplateColumns:"0.7fr 1.5fr 1fr 1fr 1fr 1fr 1fr 0.8fr",
              padding:"14px 20px",
              borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none",
              background: i%2===0 ? "transparent" : `${T.surface}66`
            }}>
              <div style={{ color:T.muted2, fontSize:12, alignSelf:"center" }}>{t.date}</div>
              <div style={{ alignSelf:"center" }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{t.ticker}</div>
                <div style={{ color:T.muted2, fontSize:11 }}>{t.name}</div>
              </div>
              <div style={{ alignSelf:"center" }}>
                <span style={{ background:tc.bg, color:tc.color,
                  border:`1px solid ${tc.color}33`, borderRadius:6,
                  padding:"3px 8px", fontSize:10, fontWeight:800 }}>{tc.label}</span>
              </div>
              <div style={{ textAlign:"right", color:T.muted2, fontSize:13, alignSelf:"center" }}>{t.qty}</div>
              <div style={{ textAlign:"right", fontWeight:600, fontSize:13, alignSelf:"center" }}>{fmtEur(t.price)}</div>
              <div style={{ textAlign:"right", color:T.muted2, fontSize:13, alignSelf:"center" }}>{fmtEur(t.fees)}</div>
              <div style={{ textAlign:"right", fontWeight:700, fontSize:13, alignSelf:"center" }}>{fmtEur(t.total)}</div>
              <div style={{ textAlign:"right", alignSelf:"center", display:"flex", gap:6, justifyContent:"flex-end" }}>
                <button style={{ background:`${T.accent}18`, color:T.accent,
                  border:`1px solid ${T.accent}33`, borderRadius:6,
                  padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700 }}>✎</button>
                <button style={{ background:`${T.red}18`, color:T.red,
                  border:`1px solid ${T.red}33`, borderRadius:6,
                  padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function AnalyticsPage({ holdings }) {
  const totalCurrent = holdings.reduce((s,h)=>s+h.current,0);

  // geo exposure
  const byGeo = useMemo(() => {
    const m = {};
    holdings.forEach(h => { if (!m[h.geo]) m[h.geo]=0; m[h.geo]+=h.current; });
    return Object.entries(m).map(([name,value],i) => ({
      name, value, pct:(value/totalCurrent*100), color:SECTOR_COLORS[i]
    }));
  }, [holdings, totalCurrent]);

  // currency exposure
  const byCurrency = useMemo(() => {
    const m = {};
    holdings.forEach(h => { if (!m[h.currency]) m[h.currency]=0; m[h.currency]+=h.current; });
    return Object.entries(m).map(([name,value],i) => ({
      name, value, pct:(value/totalCurrent*100), color:[T.accent,T.green,T.yellow][i]||T.muted
    }));
  }, [holdings, totalCurrent]);

  // performance % line
  const perfLine = SNAPSHOTS.map(s => ({ ...s, pct: s.pct?.toFixed(2)||0 }));

  // drawdown
  let peak = 0;
  const ddData = SNAPSHOTS.map(s => {
    if (s.value > peak) peak = s.value;
    const dd = peak > 0 ? ((s.value - peak) / peak * 100) : 0;
    return { date:s.date, dd: parseFloat(dd.toFixed(2)) };
  });

  return (
    <div>
      <SectionHeader title="Analytics Avanzate" sub="Analisi approfondita del portafoglio"/>

      {/* performance % */}
      <div style={{ background:T.card, borderRadius:20, padding:"24px",
        border:`1px solid ${T.border}`, marginBottom:16 }}>
        <SectionHeader title="Performance %" sub="Rendimento percentuale nel tempo"/>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={perfLine} margin={{ top:5, right:10, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
            <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v=>v+"%"} width={42}/>
            <ReferenceLine y={0} stroke={T.muted} strokeDasharray="4 4"/>
            <Tooltip content={<ChartTooltip prefix="" />}/>
            <Line type="monotone" dataKey="pct" stroke={T.green} strokeWidth={2.5} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* drawdown */}
      <div style={{ background:T.card, borderRadius:20, padding:"24px",
        border:`1px solid ${T.border}`, marginBottom:16 }}>
        <SectionHeader title="Drawdown" sub="Perdita massima dal picco"/>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={ddData} margin={{ top:5, right:10, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="gdd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.red} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={T.red} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
            <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v=>v+"%"} width={42}/>
            <ReferenceLine y={0} stroke={T.muted}/>
            <Tooltip content={<ChartTooltip prefix=""/>}/>
            <Area type="monotone" dataKey="dd" stroke={T.red} strokeWidth={2}
              fill="url(#gdd)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* geo + currency */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* geo */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px", border:`1px solid ${T.border}` }}>
          <SectionHeader title="Esposizione Geografica"/>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={byGeo} cx="50%" cy="50%" outerRadius={60} dataKey="value" stroke="none">
                {byGeo.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={v=>fmtEur(v)}
                contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {byGeo.map(g => (
              <div key={g.name} style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:g.color }}/>
                  <span style={{ color:T.muted2, fontSize:12 }}>{g.name}</span>
                </div>
                <span style={{ fontWeight:700, fontSize:12, color:g.color }}>{g.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* currency */}
        <div style={{ background:T.card, borderRadius:20, padding:"24px", border:`1px solid ${T.border}` }}>
          <SectionHeader title="Esposizione Valutaria"/>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={byCurrency} cx="50%" cy="50%" outerRadius={60} dataKey="value" stroke="none">
                {byCurrency.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={v=>fmtEur(v)}
                contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {byCurrency.map(c => (
              <div key={c.name} style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:c.color }}/>
                  <span style={{ color:T.muted2, fontSize:12 }}>{c.name}</span>
                </div>
                <span style={{ fontWeight:700, fontSize:12, color:c.color }}>{c.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* gainers losers */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:T.card, borderRadius:20, padding:"24px", border:`1px solid ${T.border}` }}>
          <SectionHeader title="🏆 Top Gainers"/>
          {[...holdings].sort((a,b)=>b.plPct-a.plPct).slice(0,4).map(h=>(
            <div key={h.id} style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", padding:"10px 0",
              borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32,height:32,borderRadius:8,background:`${h.color}22`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:h.color,fontWeight:900,fontSize:10 }}>{h.ticker.slice(0,3)}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{h.ticker}</div>
                  <div style={{ color:T.muted2, fontSize:11 }}>{fmtEur(h.current)}</div>
                </div>
              </div>
              <div style={{ color:T.green, fontWeight:800, fontSize:15 }}>{fmtPct(h.plPct)}</div>
            </div>
          ))}
        </div>
        <div style={{ background:T.card, borderRadius:20, padding:"24px", border:`1px solid ${T.border}` }}>
          <SectionHeader title="📉 Peggiori"/>
          {[...holdings].sort((a,b)=>a.plPct-b.plPct).slice(0,4).map(h=>(
            <div key={h.id} style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", padding:"10px 0",
              borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32,height:32,borderRadius:8,background:`${h.color}22`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:h.color,fontWeight:900,fontSize:10 }}>{h.ticker.slice(0,3)}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{h.ticker}</div>
                  <div style={{ color:T.muted2, fontSize:11 }}>{fmtEur(h.current)}</div>
                </div>
              </div>
              <div style={{ color:clr(h.plPct), fontWeight:800, fontSize:15 }}>{fmtPct(h.plPct)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage() {
  const [currency, setCurrency] = useState("EUR");
  const [theme, setTheme] = useState("dark");
  const [tz, setTz] = useState("Europe/Rome");
  const [notifications, setNotifications] = useState(true);

  return (
    <div style={{ maxWidth:600 }}>
      <SectionHeader title="Impostazioni" sub="Configura il tuo account Portly"/>

      {/* profile */}
      <div style={{ background:T.card, borderRadius:20, padding:"24px",
        border:`1px solid ${T.border}`, marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:T.accent }}>Account</div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <div style={{
            width:60, height:60, borderRadius:16,
            background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, fontWeight:900
          }}>P</div>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>Portfolio User</div>
            <div style={{ color:T.muted2, fontSize:13 }}>user@portly.app</div>
            <Badge label="Free Plan" color={T.muted2}/>
          </div>
        </div>
        <div style={{
          background:`linear-gradient(135deg,${T.accent}12,${T.purple}12)`,
          borderRadius:14, padding:"16px 20px",
          border:`1px solid ${T.accent}22`
        }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>🚀 Passa a Portly Pro</div>
          <div style={{ color:T.muted2, fontSize:12, marginBottom:12 }}>
            Asset illimitati · Grafici avanzati · Alert prezzi · Import automatico broker
          </div>
          <button style={{
            background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
            color:"#fff", border:"none", borderRadius:10,
            padding:"9px 20px", cursor:"pointer", fontWeight:800, fontSize:13
          }}>Inizia prova gratuita 14 giorni →</button>
        </div>
      </div>

      {/* preferences */}
      <div style={{ background:T.card, borderRadius:20, padding:"24px",
        border:`1px solid ${T.border}`, marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:T.accent }}>Preferenze</div>
        {[
          ["Valuta Base", <select value={currency} onChange={e=>setCurrency(e.target.value)}
            style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
              padding:"8px 12px", color:T.text, fontSize:13 }}>
            {["EUR","USD","GBP","CHF"].map(c=><option key={c}>{c}</option>)}
          </select>],
          ["Tema", <div style={{ display:"flex", gap:8 }}>
            {["dark","light"].map(t=>(
              <button key={t} onClick={()=>setTheme(t)} style={{
                background:theme===t?`${T.accent}22`:T.surface,
                color:theme===t?T.accent:T.muted2,
                border:`1px solid ${theme===t?T.accent+"44":T.border}`,
                borderRadius:8, padding:"7px 14px", cursor:"pointer",
                fontSize:12, fontWeight:700, textTransform:"capitalize"
              }}>{t==="dark"?"🌙 Scuro":"☀️ Chiaro"}</button>
            ))}
          </div>],
          ["Fuso Orario", <select value={tz} onChange={e=>setTz(e.target.value)}
            style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
              padding:"8px 12px", color:T.text, fontSize:13 }}>
            {["Europe/Rome","Europe/London","America/New_York"].map(z=><option key={z}>{z}</option>)}
          </select>],
          ["Notifiche Prezzi", <button onClick={()=>setNotifications(n=>!n)} style={{
            background:notifications?`${T.green}22`:T.surface,
            color:notifications?T.green:T.muted2,
            border:`1px solid ${notifications?T.green+"44":T.border}`,
            borderRadius:8, padding:"7px 14px", cursor:"pointer",
            fontSize:12, fontWeight:700
          }}>{notifications?"● Attive":"○ Disattive"}</button>],
        ].map(([label,ctrl])=>(
          <div key={label} style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", padding:"14px 0",
            borderBottom:`1px solid ${T.border}` }}>
            <span style={{ color:T.muted2, fontSize:13 }}>{label}</span>
            {ctrl}
          </div>
        ))}
      </div>

      {/* portfolios */}
      <div style={{ background:T.card, borderRadius:20, padding:"24px",
        border:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.accent }}>Portafogli</div>
          <button style={{
            background:`${T.accent}18`, color:T.accent,
            border:`1px solid ${T.accent}33`, borderRadius:8,
            padding:"6px 12px", cursor:"pointer", fontSize:12, fontWeight:700
          }}>＋ Nuovo</button>
        </div>
        {["Portafoglio Principale","ETF Long Term","Crypto Speculation"].map((p,i)=>(
          <div key={p} style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", padding:"12px 0",
            borderBottom: i<2?`1px solid ${T.border}`:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:8,height:8,borderRadius:2,
                background:[T.accent,T.purple,T.orange][i] }}/>
              <span style={{ fontSize:13 }}>{p}</span>
              {i===0 && <Badge label="Principale" color={T.accent}/>}
            </div>
            <button style={{ background:`${T.red}18`, color:T.red,
              border:`1px solid ${T.red}33`, borderRadius:6,
              padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function Portly() {
  const [page, setPage] = useState("dashboard");
  const holdings = useMemo(() => calcHoldings(ASSETS), []);

  const totalCurrent  = holdings.reduce((s,h)=>s+h.current,0);
  const totalPL       = holdings.reduce((s,h)=>s+h.pl,0);
  const totalPLpct    = (totalPL / holdings.reduce((s,h)=>s+h.invested,0)) * 100;

  return (
    <div style={{
      minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"'Sora', 'DM Sans', 'Segoe UI', sans-serif",
      display:"flex"
    }}>
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div style={{
        width:220, background:T.surface,
        borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column",
        position:"fixed", top:0, left:0, height:"100vh",
        zIndex:100, flexShrink:0
      }}>
        {/* logo */}
        <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:`linear-gradient(135deg,${T.accent},${T.accent2})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:900, fontSize:18, color:"#fff"
            }}>P</div>
            <span style={{ fontWeight:900, fontSize:20, letterSpacing:"-0.03em" }}>
              Portly
            </span>
          </div>
        </div>

        {/* portfolio mini card */}
        <div style={{ padding:"16px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ background:T.card, borderRadius:12, padding:"14px",
            border:`1px solid ${T.border}` }}>
            <div style={{ color:T.muted2, fontSize:10, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
              Totale
            </div>
            <div style={{ fontWeight:900, fontSize:18, letterSpacing:"-0.02em" }}>
              {fmtEur(totalCurrent)}
            </div>
            <div style={{ color:clr(totalPLpct), fontSize:12, fontWeight:700, marginTop:4 }}>
              {sign(totalPLpct)} {fmtPct(totalPLpct)}
            </div>
          </div>
        </div>

        {/* nav */}
        <nav style={{ flex:1, padding:"12px 10px" }}>
          {NAV.map(n => (
            <button key={n.key} onClick={()=>setPage(n.key)} style={{
              display:"flex", alignItems:"center", gap:12,
              width:"100%", padding:"11px 12px", borderRadius:12,
              background: page===n.key ? `${T.accent}18` : "transparent",
              color: page===n.key ? T.accent : T.muted2,
              border: page===n.key ? `1px solid ${T.accent}33` : "1px solid transparent",
              cursor:"pointer", marginBottom:4, fontWeight: page===n.key ? 700 : 500,
              fontSize:13, textAlign:"left", transition:"all .15s"
            }}>
              <span style={{ fontSize:16, width:20, textAlign:"center" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* bottom */}
        <div style={{ padding:"16px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:`linear-gradient(135deg,${T.accent},${T.purple})`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontWeight:900, fontSize:13
            }}>U</div>
            <div>
              <div style={{ fontWeight:700, fontSize:12 }}>User</div>
              <div style={{ color:T.muted2, fontSize:10 }}>Piano Free</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div style={{ marginLeft:220, flex:1, padding:"28px 28px", minHeight:"100vh", overflowX:"hidden" }}>
        {page === "dashboard"    && <DashboardPage holdings={holdings}/>}
        {page === "holdings"     && <HoldingsPage holdings={holdings}/>}
        {page === "transactions" && <TransactionsPage/>}
        {page === "analytics"    && <AnalyticsPage holdings={holdings}/>}
        {page === "settings"     && <SettingsPage/>}
      </div>
    </div>
  );
}
