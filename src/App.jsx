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

// 5 anni di storico realistico — PAC mensile + mercato
const SNAPSHOTS_5Y = [
  // 2020
  { date:"Mar 20", value:4800  },{ date:"Apr 20", value:5600  },{ date:"Mag 20", value:6300  },
  { date:"Giu 20", value:7100  },{ date:"Lug 20", value:7900  },{ date:"Ago 20", value:9200  },
  { date:"Set 20", value:8800  },{ date:"Ott 20", value:9400  },{ date:"Nov 20", value:11200 },
  { date:"Dic 20", value:12800 },
  // 2021
  { date:"Gen 21", value:14200 },{ date:"Feb 21", value:15600 },{ date:"Mar 21", value:17100 },
  { date:"Apr 21", value:19400 },{ date:"Mag 21", value:18200 },{ date:"Giu 21", value:19800 },
  { date:"Lug 21", value:21200 },{ date:"Ago 21", value:23400 },{ date:"Set 21", value:22100 },
  { date:"Ott 21", value:25600 },{ date:"Nov 21", value:28900 },{ date:"Dic 21", value:27400 },
  // 2022 — bear market
  { date:"Gen 22", value:25800 },{ date:"Feb 22", value:24200 },{ date:"Mar 22", value:23600 },
  { date:"Apr 22", value:21400 },{ date:"Mag 22", value:19800 },{ date:"Giu 22", value:18200 },
  { date:"Lug 22", value:20100 },{ date:"Ago 22", value:21400 },{ date:"Set 22", value:19600 },
  { date:"Ott 22", value:21200 },{ date:"Nov 22", value:20400 },{ date:"Dic 22", value:19800 },
  // 2023 — ripresa
  { date:"Gen 23", value:21600 },{ date:"Feb 23", value:22800 },{ date:"Mar 23", value:24200 },
  { date:"Apr 23", value:25800 },{ date:"Mag 23", value:27400 },{ date:"Giu 23", value:29200 },
  { date:"Lug 23", value:31000 },{ date:"Ago 23", value:30200 },{ date:"Set 23", value:29400 },
  { date:"Ott 23", value:28800 },{ date:"Nov 23", value:31600 },{ date:"Dic 23", value:34200 },
  // 2024 — bull run
  { date:"Gen 24", value:36400 },{ date:"Feb 24", value:38800 },{ date:"Mar 24", value:41200 },
  { date:"Apr 24", value:39600 },{ date:"Mag 24", value:42800 },{ date:"Giu 24", value:44600 },
  { date:"Lug 24", value:46200 },{ date:"Ago 24", value:48800 },{ date:"Set 24", value:47400 },
  { date:"Ott 24", value:50200 },{ date:"Nov 24", value:54800 },{ date:"Dic 24", value:57200 },
];

function buildSnapshots() {
  const months = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
  // Last 12 months from the 5Y data
  return SNAPSHOTS_5Y.slice(-12).map((s,i) => ({
    ...s,
    date: months[i],
    pct: ((s.value - SNAPSHOTS_5Y.slice(-12)[0].value) / SNAPSHOTS_5Y.slice(-12)[0].value * 100),
    monthIndex: i
  }));
}

const SNAPSHOTS = buildSnapshots();

// ─── BENCHMARK DATA ──────────────────────────────────────────────────────────
const BENCHMARKS = {
  sp500:     { label:"S&P 500",      color:"#f97316", isin:"IE00B5BMR087", desc:"500 maggiori aziende USA quotate al NYSE/NASDAQ. Il benchmark azionario piu seguito al mondo.",         data:[100,104,101,108,115,112,120,126,123,132,138,142] },
  msci:      { label:"MSCI World",   color:"#a855f7", isin:"IE00B4L5Y983", desc:"1.400+ aziende in 23 paesi sviluppati. Copre circa l85% della capitalizzazione mondiale.",              data:[100,103,100,106,112,109,117,122,119,127,133,136] },
  nasdaq:    { label:"Nasdaq 100",   color:"#00c2ff", isin:"IE0032077012",  desc:"100 maggiori aziende non-finanziarie del Nasdaq. Alto peso su tech: Apple, Microsoft, Nvidia.",         data:[100,107,103,114,125,118,132,141,136,152,162,168] },
  gold:      { label:"Gold",         color:"#ffd166", isin:"IE00B579F325", desc:"Oro fisico. Bassa correlazione con azioni, usato come riserva di valore e hedging inflazione.",          data:[100,102,104,103,106,108,107,110,112,111,114,116] },
  btc:       { label:"Bitcoin",      color:"#f59e0b", isin:"N/A - spot",   desc:"Prima criptovaluta per capitalizzazione. Alta volatilita, bassa correlazione con asset tradizionali.", data:[100,118,95,130,158,142,175,190,165,210,235,248] },
  eth:       { label:"Ethereum",     color:"#6366f1", isin:"N/A - spot",   desc:"Seconda crypto per capitalizzazione. Piattaforma smart contract, base del settore DeFi e NFT.",        data:[100,115,90,125,150,135,168,182,158,198,220,235] },
  sp500val:  { label:"S&P Value",    color:"#10b981", isin:"IE00B3VVMM84", desc:"Azioni S&P 500 a basso P/E. Tende a sovraperformare in fasi di rialzo dei tassi di interesse.",         data:[100,102,100,104,108,106,110,113,111,116,119,121] },
  eurostoxx: { label:"Euro Stoxx 50",color:"#ec4899", isin:"IE00B53L3W79", desc:"50 blue chip dell Eurozona. Esposizione a Francia, Germania, Spagna, Italia e altri paesi EU.",         data:[100,103,101,105,110,107,112,116,113,119,123,125] },
  bonds:     { label:"Bond Agg",     color:"#6b7799", isin:"IE00B3F81409", desc:"Obbligazioni globali investment grade. Bassa volatilita, utile per diversificare il rischio azionario.",data:[100,101,99,100,101,100,101,102,101,102,103,103] },
  realestate:{ label:"Real Estate",  color:"#84cc16", isin:"IE00B1FZS244", desc:"REIT globali - immobiliare quotato. Buona fonte di dividendi, correlato ai tassi di interesse.",        data:[100,101,99,102,105,103,107,109,107,111,113,114] },
  emerging:  { label:"Emerging Mkt", color:"#14b8a6", isin:"IE00B4L5YC18", desc:"Mercati emergenti: Cina, India, Brasile. Alto potenziale di crescita, alta volatilita e rischio.",      data:[100,105,99,108,116,110,119,125,120,130,136,139] },
  vwce:      { label:"VWCE",         color:"#8b5cf6", isin:"IE00BK5BQT80", desc:"Vanguard FTSE All-World. 3.700+ aziende in paesi sviluppati ed emergenti. ETF del lazy investing.",     data:[100,103,100,106,112,108,117,122,118,127,132,135] },
};

const DEFAULT_BENCHMARKS = ["msci", "sp500", "nasdaq", "gold"];

// ─── COINGECKO LIVE DATA HOOK ─────────────────────────────────────────────────
function useCryptoPrices() {
  const [cryptoData, setCryptoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrices = async () => {
    try {
      const [histBtc, histEth] = await Promise.all([
        fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=365&interval=monthly"),
        fetch("https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=eur&days=365&interval=monthly"),
      ]);
      const btcJson = await histBtc.json();
      const ethJson = await histEth.json();

      const normalize = (prices) => {
        if (!prices || prices.length < 2) return null;
        const base = prices[0][1];
        return prices.slice(0, 12).map(([ts, price]) => parseFloat(((price - base) / base * 100).toFixed(2)));
      };

      const btcNorm = normalize(btcJson.prices);
      const ethNorm = normalize(ethJson.prices);

      // Also fetch current prices
      const spotRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true");
      const spotJson = await spotRes.json();

      setCryptoData({
        btcHistory: btcNorm,
        ethHistory: ethNorm,
        btcPrice: spotJson?.bitcoin?.eur,
        ethPrice: spotJson?.ethereum?.eur,
        btcChange: spotJson?.bitcoin?.eur_24h_change,
        ethChange: spotJson?.ethereum?.eur_24h_change,
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.warn("CoinGecko fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useState(() => { fetchPrices(); }, []);

  return { cryptoData, loading, lastUpdated, refetch: fetchPrices };
}

function buildBenchmarkSeries(snapshots, benchMap) {
  const bm = benchMap || BENCHMARKS;
  const base = snapshots[0]?.value || 28000;
  return snapshots.map((s, i) => {
    const portPct = ((s.value - base) / base * 100);
    const row = { date: s.date, portafoglio: parseFloat(portPct.toFixed(2)) };
    Object.keys(bm).forEach(key => {
      const d = bm[key]?.data;
      row[key] = d && d[i] != null ? parseFloat((d[i] - 100).toFixed(2)) : 0;
    });
    return row;
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
  // ── 2020 — Inizio del viaggio ──────────────────────────────────────────────
  { id:1,  date:"2020-03-20", type:"deposit",  ticker:"EUR",  name:"Primo deposito",        qty:5000,  price:1,       fees:0,     total:5000.00,  currency:"EUR" },
  { id:2,  date:"2020-03-25", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE",         qty:10,    price:62.40,   fees:1.50,  total:625.50,   currency:"EUR" },
  { id:3,  date:"2020-04-10", type:"buy",      ticker:"AAPL", name:"Apple Inc.",            qty:5,     price:71.20,   fees:1.50,  total:357.50,   currency:"USD" },
  { id:4,  date:"2020-05-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:500,   price:1,       fees:0,     total:500.00,   currency:"EUR" },
  { id:5,  date:"2020-05-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:68.10,   fees:1.50,  total:342.00,   currency:"EUR" },
  { id:6,  date:"2020-06-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:500,   price:1,       fees:0,     total:500.00,   currency:"EUR" },
  { id:7,  date:"2020-06-18", type:"buy",      ticker:"MSFT", name:"Microsoft Corp.",       qty:2,     price:196.50,  fees:1.50,  total:394.50,   currency:"USD" },
  { id:8,  date:"2020-07-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:500,   price:1,       fees:0,     total:500.00,   currency:"EUR" },
  { id:9,  date:"2020-07-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:72.30,   fees:1.50,  total:363.00,   currency:"EUR" },
  { id:10, date:"2020-08-10", type:"buy",      ticker:"BTC",  name:"Bitcoin — primo acquisto",qty:0.05,price:10800,   fees:8.00,  total:548.00,   currency:"USD" },
  { id:11, date:"2020-09-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:500,   price:1,       fees:0,     total:500.00,   currency:"EUR" },
  { id:12, date:"2020-09-18", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:70.80,   fees:1.50,  total:355.50,   currency:"EUR" },
  { id:13, date:"2020-10-20", type:"buy",      ticker:"AAPL", name:"Apple Inc.",            qty:5,     price:115.00,  fees:1.50,  total:576.50,   currency:"USD" },
  { id:14, date:"2020-11-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:500,   price:1,       fees:0,     total:500.00,   currency:"EUR" },
  { id:15, date:"2020-11-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:80.20,   fees:1.50,  total:402.50,   currency:"EUR" },
  { id:16, date:"2020-12-10", type:"buy",      ticker:"BTC",  name:"Bitcoin accumulo",    qty:0.03,  price:18500,   fees:5.00,  total:560.00,   currency:"USD" },
  { id:17, date:"2020-12-20", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q4",    qty:1,     price:8.20,    fees:0,     total:8.20,     currency:"USD" },

  // ── 2021 — Anno del toro ───────────────────────────────────────────────────
  { id:18, date:"2021-01-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:600,   price:1,       fees:0,     total:600.00,   currency:"EUR" },
  { id:19, date:"2021-01-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:84.60,   fees:1.50,  total:424.50,   currency:"EUR" },
  { id:20, date:"2021-02-10", type:"buy",      ticker:"CSPX", name:"iShares S&P 500",       qty:3,     price:338.00,  fees:2.00,  total:1016.00,  currency:"USD" },
  { id:21, date:"2021-02-20", type:"buy",      ticker:"ETH",  name:"Ethereum",              qty:0.5,   price:1480,    fees:5.00,  total:745.00,   currency:"USD" },
  { id:22, date:"2021-03-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:600,   price:1,       fees:0,     total:600.00,   currency:"EUR" },
  { id:23, date:"2021-03-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:87.40,   fees:1.50,  total:438.50,   currency:"EUR" },
  { id:24, date:"2021-04-01", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q1",    qty:1,     price:8.50,    fees:0,     total:8.50,     currency:"USD" },
  { id:25, date:"2021-04-15", type:"buy",      ticker:"MSFT", name:"Microsoft Corp.",       qty:2,     price:255.00,  fees:1.50,  total:511.50,   currency:"USD" },
  { id:26, date:"2021-05-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:600,   price:1,       fees:0,     total:600.00,   currency:"EUR" },
  { id:27, date:"2021-05-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:89.10,   fees:1.50,  total:447.00,   currency:"EUR" },
  { id:28, date:"2021-06-10", type:"buy",      ticker:"BTC",  name:"Bitcoin accumulo",    qty:0.05,  price:32000,   fees:10.00, total:1610.00,  currency:"USD" },
  { id:29, date:"2021-07-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:600,   price:1,       fees:0,     total:600.00,   currency:"EUR" },
  { id:30, date:"2021-07-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:92.30,   fees:1.50,  total:463.00,   currency:"EUR" },
  { id:31, date:"2021-08-10", type:"buy",      ticker:"CSPX", name:"iShares S&P 500",       qty:3,     price:390.00,  fees:2.00,  total:1172.00,  currency:"USD" },
  { id:32, date:"2021-09-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:600,   price:1,       fees:0,     total:600.00,   currency:"EUR" },
  { id:33, date:"2021-09-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:91.00,   fees:1.50,  total:456.50,   currency:"EUR" },
  { id:34, date:"2021-10-01", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q3",    qty:1,     price:8.80,    fees:0,     total:8.80,     currency:"USD" },
  { id:35, date:"2021-10-15", type:"buy",      ticker:"ETH",  name:"Ethereum accumulo",   qty:0.5,   price:3200,    fees:8.00,  total:1608.00,  currency:"USD" },
  { id:36, date:"2021-11-10", type:"buy",      ticker:"BTC",  name:"Bitcoin ATH zone",    qty:0.02,  price:58000,   fees:8.00,  total:1168.00,  currency:"USD" },
  { id:37, date:"2021-11-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:600,   price:1,       fees:0,     total:600.00,   currency:"EUR" },
  { id:38, date:"2021-12-15", type:"buy",      ticker:"XAUM", name:"Gold ETC hedge",      qty:10,    price:163.00,  fees:1.50,  total:1631.50,  currency:"EUR" },
  { id:39, date:"2021-12-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:5,     price:95.80,   fees:1.50,  total:480.50,   currency:"EUR" },

  // ── 2022 — Anno del bear market ────────────────────────────────────────────
  { id:40, date:"2022-01-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:700,   price:1,       fees:0,     total:700.00,   currency:"EUR" },
  { id:41, date:"2022-01-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:6,     price:95.10,   fees:1.50,  total:572.10,   currency:"EUR" },
  { id:42, date:"2022-02-15", type:"buy",      ticker:"XAUM", name:"Gold ETC hedge",      qty:5,     price:170.00,  fees:1.50,  total:851.50,   currency:"EUR" },
  { id:43, date:"2022-03-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:700,   price:1,       fees:0,     total:700.00,   currency:"EUR" },
  { id:44, date:"2022-03-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:6,     price:89.40,   fees:1.50,  total:537.90,   currency:"EUR" },
  { id:45, date:"2022-04-01", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q1",    qty:1,     price:9.00,    fees:0,     total:9.00,     currency:"USD" },
  { id:46, date:"2022-05-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:700,   price:1,       fees:0,     total:700.00,   currency:"EUR" },
  { id:47, date:"2022-05-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:7,     price:83.20,   fees:1.50,  total:583.90,   currency:"EUR" },
  { id:48, date:"2022-06-10", type:"buy",      ticker:"BTC",  name:"Bitcoin DCA bear",    qty:0.05,  price:22000,   fees:7.00,  total:1107.00,  currency:"USD" },
  { id:49, date:"2022-06-15", type:"buy",      ticker:"AAPL", name:"Apple Inc dip buy",  qty:5,     price:130.00,  fees:1.50,  total:651.50,   currency:"USD" },
  { id:50, date:"2022-07-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:700,   price:1,       fees:0,     total:700.00,   currency:"EUR" },
  { id:51, date:"2022-07-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:7,     price:81.00,   fees:1.50,  total:568.50,   currency:"EUR" },
  { id:52, date:"2022-08-10", type:"buy",      ticker:"CSPX", name:"iShares S&P 500 — dip", qty:3,     price:368.00,  fees:2.00,  total:1106.00,  currency:"USD" },
  { id:53, date:"2022-09-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:700,   price:1,       fees:0,     total:700.00,   currency:"EUR" },
  { id:54, date:"2022-09-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:7,     price:78.40,   fees:1.50,  total:550.30,   currency:"EUR" },
  { id:55, date:"2022-10-01", type:"dividend", ticker:"MSFT", name:"Microsoft Dividendo",   qty:1,     price:18.50,   fees:0,     total:18.50,    currency:"USD" },
  { id:56, date:"2022-10-15", type:"buy",      ticker:"ETH",  name:"Ethereum merge dip",  qty:0.3,   price:1280,    fees:4.00,  total:388.00,   currency:"USD" },
  { id:57, date:"2022-11-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:700,   price:1,       fees:0,     total:700.00,   currency:"EUR" },
  { id:58, date:"2022-11-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:7,     price:80.60,   fees:1.50,  total:566.70,   currency:"EUR" },
  { id:59, date:"2022-12-15", type:"buy",      ticker:"BTC",  name:"Bitcoin DCA FTX dip", qty:0.05,  price:16500,   fees:6.00,  total:831.00,   currency:"USD" },
  { id:60, date:"2022-12-20", type:"fee",      ticker:"EUR",  name:"Commissioni piattaforma",qty:1,    price:12.00,   fees:0,     total:12.00,    currency:"EUR" },

  // ── 2023 — La ripresa ──────────────────────────────────────────────────────
  { id:61, date:"2023-01-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:800,   price:1,       fees:0,     total:800.00,   currency:"EUR" },
  { id:62, date:"2023-01-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:83.40,   fees:1.50,  total:668.70,   currency:"EUR" },
  { id:63, date:"2023-02-10", type:"buy",      ticker:"MSFT", name:"Microsoft Corp.",       qty:2,     price:252.00,  fees:1.50,  total:505.50,   currency:"USD" },
  { id:64, date:"2023-03-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:800,   price:1,       fees:0,     total:800.00,   currency:"EUR" },
  { id:65, date:"2023-03-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:86.20,   fees:1.50,  total:691.10,   currency:"EUR" },
  { id:66, date:"2023-04-01", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q1",    qty:1,     price:9.20,    fees:0,     total:9.20,     currency:"USD" },
  { id:67, date:"2023-04-15", type:"buy",      ticker:"BTC",  name:"Bitcoin ripresa",     qty:0.03,  price:28000,   fees:6.00,  total:846.00,   currency:"USD" },
  { id:68, date:"2023-05-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:800,   price:1,       fees:0,     total:800.00,   currency:"EUR" },
  { id:69, date:"2023-05-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:90.10,   fees:1.50,  total:722.30,   currency:"EUR" },
  { id:70, date:"2023-06-10", type:"buy",      ticker:"CSPX", name:"iShares S&P 500",       qty:3,     price:420.00,  fees:2.00,  total:1262.00,  currency:"USD" },
  { id:71, date:"2023-07-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:800,   price:1,       fees:0,     total:800.00,   currency:"EUR" },
  { id:72, date:"2023-07-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:93.60,   fees:1.50,  total:750.30,   currency:"EUR" },
  { id:73, date:"2023-08-10", type:"sell",     ticker:"AAPL", name:"Apple presa profitto",qty:2,     price:178.00,  fees:1.50,  total:354.50,   currency:"USD" },
  { id:74, date:"2023-09-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:800,   price:1,       fees:0,     total:800.00,   currency:"EUR" },
  { id:75, date:"2023-09-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:91.80,   fees:1.50,  total:736.10,   currency:"EUR" },
  { id:76, date:"2023-10-01", type:"dividend", ticker:"MSFT", name:"Microsoft Dividendo",   qty:1,     price:19.20,   fees:0,     total:19.20,    currency:"USD" },
  { id:77, date:"2023-10-15", type:"buy",      ticker:"ETH",  name:"Ethereum accumulo",   qty:0.2,   price:1580,    fees:4.00,  total:320.00,   currency:"USD" },
  { id:78, date:"2023-11-15", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:800,   price:1,       fees:0,     total:800.00,   currency:"EUR" },
  { id:79, date:"2023-11-20", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:96.40,   fees:1.50,  total:772.70,   currency:"EUR" },
  { id:80, date:"2023-12-10", type:"buy",      ticker:"XAUM", name:"Gold ETC ribilancio", qty:5,     price:172.00,  fees:1.50,  total:861.50,   currency:"EUR" },
  { id:81, date:"2023-12-20", type:"buy",      ticker:"BTC",  name:"Bitcoin ETF hype",    qty:0.02,  price:42000,   fees:6.00,  total:846.00,   currency:"USD" },

  // ── 2024 — Bull run ────────────────────────────────────────────────────────
  { id:82, date:"2024-01-10", type:"deposit",  ticker:"EUR",  name:"Deposito mensile",      qty:1000,  price:1,       fees:0,     total:1000.00,  currency:"EUR" },
  { id:83, date:"2024-01-15", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:99.20,   fees:1.50,  total:795.10,   currency:"EUR" },
  { id:84, date:"2024-02-01", type:"buy",      ticker:"AAPL", name:"Apple Inc.",            qty:3,     price:182.00,  fees:1.50,  total:547.50,   currency:"USD" },
  { id:85, date:"2024-02-14", type:"buy",      ticker:"BTC",  name:"Bitcoin pre halving", qty:0.03,  price:48000,   fees:10.00, total:1450.00,  currency:"USD" },
  { id:86, date:"2024-03-05", type:"buy",      ticker:"MSFT", name:"Microsoft Corp.",       qty:2,     price:395.00,  fees:1.50,  total:791.50,   currency:"USD" },
  { id:87, date:"2024-04-01", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q1",    qty:1,     price:9.80,    fees:0,     total:9.80,     currency:"USD" },
  { id:88, date:"2024-04-20", type:"buy",      ticker:"ETH",  name:"Ethereum",              qty:0.3,   price:2800,    fees:6.00,  total:846.00,   currency:"USD" },
  { id:89, date:"2024-05-10", type:"buy",      ticker:"CSPX", name:"iShares S&P 500",       qty:3,     price:488.00,  fees:2.00,  total:1466.00,  currency:"USD" },
  { id:90, date:"2024-06-01", type:"sell",     ticker:"BTC",  name:"Bitcoin presa profitto",qty:0.03,  price:67000,   fees:12.00, total:1998.00,  currency:"USD" },
  { id:91, date:"2024-07-15", type:"buy",      ticker:"XAUM", name:"Gold ETC",              qty:5,     price:188.00,  fees:1.50,  total:941.50,   currency:"EUR" },
  { id:92, date:"2024-08-10", type:"deposit",  ticker:"EUR",  name:"Deposito extra",        qty:2000,  price:1,       fees:0,     total:2000.00,  currency:"EUR" },
  { id:93, date:"2024-09-15", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:10,    price:108.40,  fees:1.50,  total:1085.50,  currency:"EUR" },
  { id:94, date:"2024-10-01", type:"dividend", ticker:"MSFT", name:"Microsoft Dividendo",   qty:1,     price:21.00,   fees:0,     total:21.00,    currency:"USD" },
  { id:95, date:"2024-10-20", type:"buy",      ticker:"AAPL", name:"Apple Inc.",            qty:2,     price:225.00,  fees:1.50,  total:451.50,   currency:"USD" },
  { id:96, date:"2024-11-10", type:"buy",      ticker:"BTC",  name:"Bitcoin post elezioni",qty:0.02, price:78000,   fees:10.00, total:1570.00,  currency:"USD" },
  { id:97, date:"2024-12-15", type:"buy",      ticker:"VWCE", name:"Vanguard FTSE PAC",   qty:8,     price:113.20,  fees:1.50,  total:907.10,   currency:"EUR" },
  { id:98, date:"2024-12-20", type:"dividend", ticker:"AAPL", name:"Apple Dividendo Q4",    qty:1,     price:10.20,   fees:0,     total:10.20,    currency:"USD" },
];

const MONTHLY_CONTRIBUTIONS = [
  { m:"Gen", val:1000 },{ m:"Feb", val:1000 },{ m:"Mar", val:1000 },
  { m:"Apr", val:1000 },{ m:"Mag", val:1000 },{ m:"Giu", val:1000 },
  { m:"Lug", val:1000 },{ m:"Ago", val:3000 },{ m:"Set", val:1000 },
  { m:"Ott", val:1000 },{ m:"Nov", val:1000 },{ m:"Dic", val:1000 },
];

const DIVIDENDS = [
  { m:"Gen",val:0  },{ m:"Feb",val:0  },{ m:"Mar",val:0   },
  { m:"Apr",val:34 },{ m:"Mag",val:0  },{ m:"Giu",val:21  },
  { m:"Lug",val:0  },{ m:"Ago",val:0  },{ m:"Set",val:0   },
  { m:"Ott",val:39 },{ m:"Nov",val:0  },{ m:"Dic",val:31  },
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
      {["1G","3G","1S","1M","3M","6M","YTD","1A","2A","5A"].map(tf => (
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
function DashboardPage({ holdings, cryptoData, cryptoLoading, lastUpdated, refetch }) {
  const [tf, setTf] = useState("1A");
  const [assetFilter, setAssetFilter] = useState("Tutti");
  const [marketOpen] = useState(true);
  const [countdown] = useState("02:41:15");
  const [searchQuery, setSearchQuery] = useState("");

  const totalCurrent  = holdings.reduce((s,h) => s+h.current, 0);
  const totalInvested = holdings.reduce((s,h) => s+h.invested, 0);
  const totalPL       = totalCurrent - totalInvested;
  const totalPLpct    = totalInvested ? (totalPL/totalInvested)*100 : 0;
  const dailyPL       = totalCurrent * 0.0058;
  const dailyPLpct    = 0.58;


  // Sparkline data for KPI cards
  const sparkDaily  = [12,18,14,22,19,28,24,31,27,35,30,38,35,42];
  const sparkTotal  = [100,108,104,115,110,122,118,128,124,135,130,140,136,144];
  const sparkRisk   = [65,68,64,70,67,72,69,74,71,76,73,78,75,80];

  // Portfolio value chart data by timeframe
  const chartData = useMemo(() => {
    if (tf==="1G") return [
      {date:"09:00",value:56820},{date:"10:00",value:57050},{date:"11:00",value:56940},
      {date:"12:00",value:57180},{date:"13:00",value:57090},{date:"14:00",value:57260},
      {date:"15:00",value:57380},{date:"16:00",value:57200},
    ];
    if (tf==="3G") return [
      {date:"Ven 08:00",value:55800},{date:"Ven 16:00",value:56200},
      {date:"Sab",value:56400},{date:"Dom",value:56600},
      {date:"Lun 08:00",value:56800},{date:"Lun 16:00",value:57200},
    ];
    if (tf==="1S") return [
      {date:"Lun",value:55200},{date:"Mar",value:55800},{date:"Mer",value:55400},
      {date:"Gio",value:56200},{date:"Ven",value:56800},{date:"Sab",value:57000},{date:"Dom",value:57200},
    ];
    if (tf==="1M") return [
      {date:"1 Nov",value:54800},{date:"8 Nov",value:55600},{date:"15 Nov",value:55200},
      {date:"22 Nov",value:56400},{date:"29 Nov",value:57200},
    ];
    if (tf==="3M") return SNAPSHOTS_5Y.slice(-3);
    if (tf==="6M") return SNAPSHOTS_5Y.slice(-6);
    if (tf==="YTD") return SNAPSHOTS_5Y.slice(-12);
    if (tf==="1A") return SNAPSHOTS_5Y.slice(-12);
    if (tf==="2A") return SNAPSHOTS_5Y.slice(-24);
    if (tf==="5A") return SNAPSHOTS_5Y;
    return SNAPSHOTS_5Y;
  }, [tf]);

  // P&L calcolato sul periodo selezionato
  const periodStats = useMemo(() => {
    const data = chartData;
    if (!data || data.length < 2) return { pl: totalPL, plPct: totalPLpct, startValue: totalCurrent };
    const startValue = data[0].value;
    const endValue   = data[data.length - 1].value;
    const pl    = endValue - startValue;
    const plPct = (pl / startValue) * 100;
    return { pl, plPct, startValue, endValue };
  }, [chartData, totalCurrent, totalPL, totalPLpct]);

  // Allocation donut
  const byType = useMemo(() => {
    const m = {};
    holdings.forEach(h => { if(!m[h.type]) m[h.type]=0; m[h.type]+=h.current; });
    return Object.entries(m).map(([name,value])=>({ name, value, pct:(value/totalCurrent*100) }));
  }, [holdings, totalCurrent]);

  // Sector donut
  const bySector = useMemo(() => {
    const m = {};
    holdings.forEach(h => { if(!m[h.sector]) m[h.sector]=0; m[h.sector]+=h.current; });
    return Object.entries(m).map(([name,value],i)=>({ name, value, pct:(value/totalCurrent*100), color:SECTOR_COLORS[i] }));
  }, [holdings, totalCurrent]);

  // Risk score calculation
  const riskScore = useMemo(() => {
    const cryptoPct = byType.find(t=>t.name==="Crypto")?.pct || 0;
    const stockPct  = byType.find(t=>t.name==="Stock")?.pct  || 0;
    return Math.min(100, Math.round(cryptoPct*1.2 + stockPct*0.6 + 20));
  }, [byType]);

  const riskLabel = riskScore < 30 ? "Conservativo" : riskScore < 55 ? "Moderato" : riskScore < 75 ? "Aggressivo" : "Molto Aggressivo";
  const riskColor = riskScore < 30 ? T.green : riskScore < 55 ? T.yellow : riskScore < 75 ? T.orange : T.red;

  // Market sentiment (simulated)
  const sentimentScore = 65;
  const sentimentLabel = "Positivo";

  // Filtered assets
  const filteredAssets = useMemo(() => {
    let list = holdings;
    if (assetFilter !== "Tutti") list = list.filter(h => h.type === assetFilter);
    if (searchQuery) list = list.filter(h =>
      h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return list;
  }, [holdings, assetFilter, searchQuery]);

  // Indices live data
  const INDICES = [
    { name:"S&P 500",   value:"5.278,40", change:+1.32, color:T.green },
    { name:"NASDAQ 100",value:"18.529,95",change:+1.85, color:T.green },
    { name:"DOW JONES", value:"39.872,99",change:+0.92, color:T.green },
    { name:"DAX 40",    value:"18.675,24",change:+1.12, color:T.green },
    { name:"NIKKEI 225",value:"38.920,26",change:-0.45, color:T.red  },
    { name:"EUR/USD",   value:"1,0842",   change:-0.12, color:T.red  },
    { name:"Gold",      value:"2.341,50", change:+0.34, color:T.green },
    { name:"BTC/EUR",   value: cryptoData.btcPrice ? cryptoData.btcPrice.toLocaleString("it-IT") : "62.400",
      change: cryptoData.btcChange ?? +2.14, color: (cryptoData.btcChange??1)>=0 ? T.green : T.red },
  ];

  // Economic calendar
  const CALENDAR = [
    { time:"15:30", day:"Oggi",   flag:"🇺🇸", event:"CPI (Inflazione)",        impact:"Alto" },
    { time:"16:00", day:"Oggi",   flag:"🇺🇸", event:"Fed Interest Rate Decision",impact:"Alto" },
    { time:"09:30", day:"Domani", flag:"🇺🇸", event:"Non-Farm Payrolls",       impact:"Alto" },
    { time:"11:00", day:"Domani", flag:"🇪🇺", event:"PIL Eurozona (Q1)",        impact:"Medio" },
    { time:"14:30", day:"Ven",    flag:"🇬🇧", event:"Retail Sales UK",          impact:"Medio" },
  ];

  // AI Insights
  const AI_INSIGHTS = [
    { ticker:"AAPL", name:"Apple Inc.",      tag:"OPPORTUNITA",   tagColor:T.green,  desc:"Potenziale rialzo del 15,2% secondo l'analisi tecnica" },
    { ticker:"VWCE", name:"ETF Technology",  tag:"DIVERSIFICA",   tagColor:T.accent, desc:"Riduci rischio da concentrazione settoriale" },
    { ticker:"TSLA", name:"Tesla Inc.",      tag:"ATTENZIONE",    tagColor:T.red,    desc:"Alta volatilita prevista nei prossimi 30 giorni" },
  ];

  // Mini sparkline component
  function Sparkline({ data, color, height=36 }) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const w = 80, h = height;
    const pts = data.map((v,i) => {
      const x = (i/(data.length-1))*w;
      const y = h - ((v-min)/(max-min||1))*(h-4) - 2;
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg width={w} height={h} style={{ overflow:"visible" }}>
        <defs>
          <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${pts} ${w},${h}`}
          fill={`url(#sg-${color.replace("#","")})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}/>
      </svg>
    );
  }

  // Gauge component for Risk Score and Sentiment
  function Gauge({ value, max=100, color, size=110 }) {
    const pct = value/max;
    const angle = -140 + pct*280;
    const r = size/2 - 8;
    const cx = size/2, cy = size/2;
    const startAngle = -140*(Math.PI/180);
    const endAngle   = (angle)*(Math.PI/180);
    const x1 = cx + r*Math.cos(startAngle);
    const y1 = cy + r*Math.sin(startAngle);
    const x2 = cx + r*Math.cos(endAngle);
    const y2 = cy + r*Math.sin(endAngle);
    const largeArc = (pct > 0.5 ? 1 : 0);
    // background arc
    const bx2 = cx + r*Math.cos(40*(Math.PI/180));
    const by2 = cy + r*Math.sin(40*(Math.PI/180));
    return (
      <svg width={size} height={size*0.7} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bx2} ${by2}`}
          fill="none" stroke={T.border2} strokeWidth={8} strokeLinecap="round"/>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"/>
      </svg>
    );
  }

  return (
    <div>
      {/* ── WELCOME HEADER ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontWeight:900, fontSize:24, letterSpacing:"-0.03em", margin:0 }}>
            Benvenuto, Davide 👋
          </h1>
          <div style={{ color:T.muted2, fontSize:13, marginTop:4 }}>
            Ecco il riepilogo del tuo portafoglio oggi.
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* search */}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:T.muted, fontSize:14 }}>🔍</span>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Cerca asset, stock, ETF..."
              style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
                padding:"9px 14px 9px 36px", color:T.text, fontSize:13, width:240,
                outline:"none" }}/>
          </div>
          {/* market status */}
          <div style={{
            background: marketOpen ? `${T.green}15` : `${T.red}15`,
            border:`1px solid ${marketOpen?T.green:T.red}33`,
            borderRadius:12, padding:"8px 16px",
            display:"flex", alignItems:"center", gap:8
          }}>
            <div style={{ width:8,height:8,borderRadius:"50%",
              background:marketOpen?T.green:T.red,
              boxShadow:`0 0 8px ${marketOpen?T.green:T.red}` }}/>
            <div>
              <div style={{ color:marketOpen?T.green:T.red, fontWeight:700, fontSize:12 }}>
                {marketOpen ? "Mercato Aperto" : "Mercato Chiuso"}
              </div>
              <div style={{ color:T.muted2, fontSize:10 }}>
                {marketOpen ? `Chiude in ${countdown}` : "Apre domani 09:30"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 300px", gap:14, marginBottom:14 }}>

        {/* ── PORTFOLIO VALUE CHART (spans 2 cols) ── */}
        <div style={{ gridColumn:"1/3", background:T.card, borderRadius:20,
          padding:"24px", border:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ color:T.muted2, fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                Valore Totale Portafoglio
              </div>
              <div style={{ fontSize:36, fontWeight:900, letterSpacing:"-0.04em", lineHeight:1 }}>
                {fmtEur(totalCurrent)}
              </div>
              <div style={{ color:clr(totalPLpct), fontSize:14, fontWeight:700, marginTop:6 }}>
                {totalPL>=0?"+":""}{fmtEur(Math.abs(totalPL))} ({fmtPct(totalPLpct)})
              </div>
            </div>
            {/* timeframe tabs */}
            <div style={{ display:"flex", gap:2, background:T.surface,
              borderRadius:10, padding:3, border:`1px solid ${T.border}` }}>
              {["1G","3G","1S","1M","3M","6M","YTD","1A","2A","5A"].map(t=>(
                <button key={t} onClick={()=>setTf(t)} style={{
                  background:tf===t?T.card:"transparent",
                  color:tf===t?T.accent:T.muted2,
                  border:tf===t?`1px solid ${T.border2}`:"1px solid transparent",
                  borderRadius:7, padding:"4px 10px", cursor:"pointer",
                  fontSize:11, fontWeight:700, transition:"all .15s"
                }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
              <defs>
                <linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.green} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}
                tickFormatter={v=>"€"+Math.round(v/1000)+"k"} width={46}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:10}}
                labelStyle={{color:T.muted2,fontSize:11}}
                formatter={v=>[fmtEur(v),"Valore"]}/>
              <Area type="monotone" dataKey="value" stroke={T.green} strokeWidth={2.5}
                fill="url(#pgrad)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── ALLOCATION DONUT ── */}
        <div style={{ background:T.card, borderRadius:20, padding:"22px",
          border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, fontSize:13, color:T.muted2,
            textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Allocazione</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                  paddingAngle={3} dataKey="value" stroke="none">
                  {byType.map((e,i)=><Cell key={i} fill={ASSET_TYPE_COLORS[e.name]||T.muted}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {byType.map(c=>(
                <div key={c.name} style={{display:"flex",justifyContent:"space-between",
                  alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:2,
                      background:ASSET_TYPE_COLORS[c.name]||T.muted}}/>
                    <span style={{color:T.muted2,fontSize:12}}>{c.name}</span>
                  </div>
                  <span style={{fontWeight:700,fontSize:12,
                    color:ASSET_TYPE_COLORS[c.name]||T.text}}>{c.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,
            color:T.muted2,fontSize:11,textAlign:"center"}}>
            Totale: <strong style={{color:T.text}}>{fmtEur(totalCurrent)}</strong>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ROW ──────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:14 }}>
        {[
          { label:"Guadagno Giornaliero", value:fmtEur(dailyPL), sub:`+${dailyPLpct}%`, color:T.green, spark:sparkDaily },
          { label:`Guadagno (${tf})`, value:(periodStats.pl>=0?"+":"")+fmtEur(Math.abs(periodStats.pl)), sub:(periodStats.pl>=0?"+":"")+periodStats.plPct.toFixed(2)+"%", color:clr(periodStats.pl), spark:sparkTotal },
          { label:"Capitale Investito",   value:fmtEur(totalInvested), sub:"Costo base totale", color:T.muted2, spark:null },
          { label:"P&L Realizzato",       value:"€ 71,50", sub:"dalla vendita AAPL", color:T.green, spark:null },
        ].map((k,i)=>(
          <div key={i} style={{background:T.card,borderRadius:16,padding:"18px 20px",
            border:`1px solid ${T.border}`,position:"relative",overflow:"hidden"}}>
            <div style={{color:T.muted2,fontSize:10,fontWeight:700,
              textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.02em"}}>{k.value}</div>
            <div style={{color:k.color,fontSize:12,fontWeight:700,marginTop:4}}>{k.sub}</div>
            {k.spark && (
              <div style={{position:"absolute",bottom:12,right:12,opacity:0.7}}>
                <Sparkline data={k.spark} color={k.color}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── SECOND ROW: Risk + Sector + AI Insights + Indices ─────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 260px 220px", gap:14, marginBottom:14 }}>

        {/* Risk Score */}
        <div style={{background:T.card,borderRadius:20,padding:"20px",
          border:`1px solid ${T.border}`,textAlign:"center"}}>
          <div style={{color:T.muted2,fontSize:10,fontWeight:700,
            textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Risk Score</div>
          <div style={{display:"flex",justifyContent:"center"}}>
            <Gauge value={riskScore} color={riskColor} size={130}/>
          </div>
          <div style={{fontSize:36,fontWeight:900,color:riskColor,marginTop:-20,lineHeight:1}}>{riskScore}</div>
          <div style={{color:riskColor,fontSize:12,fontWeight:700,marginTop:4}}>{riskLabel}</div>
          <div style={{color:T.muted2,fontSize:10,marginTop:6,lineHeight:1.5}}>
            Il tuo portafoglio ha un livello di rischio {riskLabel.toLowerCase()}.
          </div>
        </div>

        {/* Sector Donut */}
        <div style={{background:T.card,borderRadius:20,padding:"20px",
          border:`1px solid ${T.border}`}}>
          <div style={{color:T.muted2,fontSize:10,fontWeight:700,
            textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Esposizione per Settore</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={bySector} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                  paddingAngle={2} dataKey="value" stroke="none">
                  {bySector.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                  fill={T.text} fontSize={10} fontWeight={700}>
                  {bySector[0]?.name}
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {bySector.map(s=>(
                <div key={s.name} style={{marginBottom:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:T.muted2}}>{s.name}</span>
                    <span style={{fontSize:11,fontWeight:700,color:s.color}}>{s.pct.toFixed(1)}%</span>
                  </div>
                  <div style={{height:3,background:T.border,borderRadius:2}}>
                    <div style={{height:3,width:`${s.pct}%`,background:s.color,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div style={{background:T.card,borderRadius:20,padding:"20px",
          border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{color:T.muted2,fontSize:10,fontWeight:700,
              textTransform:"uppercase",letterSpacing:"0.08em"}}>AI Insights</div>
            <div style={{background:`${T.purple}22`,color:T.purple,
              border:`1px solid ${T.purple}33`,borderRadius:6,
              padding:"2px 8px",fontSize:9,fontWeight:800}}>BETA</div>
          </div>
          <div style={{fontSize:11,color:T.muted2,marginBottom:12}}>
            Il nostro algoritmo ha identificato{" "}
            <span style={{color:T.accent,fontWeight:700}}>3 opportunita</span> per il tuo portafoglio.
          </div>
          {AI_INSIGHTS.map((ins,i)=>(
            <div key={i} style={{background:T.surface,borderRadius:10,padding:"10px 12px",
              marginBottom:8,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontWeight:800,fontSize:12}}>{ins.ticker}</span>
                <span style={{background:`${ins.tagColor}18`,color:ins.tagColor,
                  border:`1px solid ${ins.tagColor}33`,borderRadius:5,
                  padding:"1px 6px",fontSize:8,fontWeight:800}}>{ins.tag}</span>
              </div>
              <div style={{color:T.muted2,fontSize:10,lineHeight:1.4}}>{ins.desc}</div>
              <div style={{color:T.accent,fontSize:10,fontWeight:700,marginTop:4,cursor:"pointer"}}>
                Scopri di piu →
              </div>
            </div>
          ))}
        </div>

        {/* Indices + Currencies */}
        <div style={{background:T.card,borderRadius:20,padding:"20px",
          border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",gap:0,marginBottom:14,background:T.surface,
            borderRadius:8,padding:3,border:`1px solid ${T.border}`}}>
            {["Indici","Valute","Crypto"].map((tab,i)=>(
              <button key={tab} style={{flex:1,background:i===0?T.card:"transparent",
                color:i===0?T.accent:T.muted2,border:i===0?`1px solid ${T.border2}`:"1px solid transparent",
                borderRadius:6,padding:"4px",cursor:"pointer",fontSize:10,fontWeight:700}}>
                {tab}
              </button>
            ))}
          </div>
          {INDICES.slice(0,7).map((idx,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"6px 0",
              borderBottom:i<6?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:11,color:T.muted2}}>{idx.name}</span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:700}}>{idx.value}</div>
                <div style={{fontSize:10,color:idx.color,fontWeight:700}}>
                  {idx.change>=0?"+":""}{idx.change.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ASSETS TABLE + CALENDAR + SENTIMENT ───────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14 }}>

        {/* Assets Table */}
        <div style={{background:T.card,borderRadius:20,padding:"22px",
          border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:T.muted2,
              textTransform:"uppercase",letterSpacing:"0.08em"}}>I Tuoi Asset</div>
            {/* filter tabs */}
            <div style={{display:"flex",gap:4}}>
              {["Tutti","Stock","ETF","Crypto","Cash"].map(f=>(
                <button key={f} onClick={()=>setAssetFilter(f)} style={{
                  background:assetFilter===f?`${T.accent}18`:T.surface,
                  color:assetFilter===f?T.accent:T.muted2,
                  border:`1px solid ${assetFilter===f?T.accent+"44":T.border}`,
                  borderRadius:7,padding:"4px 10px",cursor:"pointer",
                  fontSize:11,fontWeight:700
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* table header */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 80px",
            padding:"8px 12px",background:T.surface,borderRadius:8,marginBottom:6}}>
            {["Asset","Tipo","Quantita","Prezzo Medio","Prezzo Att.","Variazione","Valore"].map((h,i)=>(
              <div key={i} style={{color:T.muted,fontSize:9,fontWeight:800,
                textTransform:"uppercase",letterSpacing:"0.08em",
                textAlign:i===0?"left":"right"}}>{h}</div>
            ))}
          </div>

          {filteredAssets.map((h,i)=>{
            const sparkData = Array.from({length:10},(_,j)=>
              h.price*(0.95+j*0.005+Math.random()*0.01));
            return (
              <div key={h.id} style={{display:"grid",
                gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 80px",
                padding:"10px 12px",
                borderBottom:i<filteredAssets.length-1?`1px solid ${T.border}`:"none",
                alignItems:"center"}}>
                {/* asset name */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:8,
                    background:`${h.color}22`,display:"flex",alignItems:"center",
                    justifyContent:"center",color:h.color,fontWeight:900,fontSize:10,flexShrink:0}}>
                    {h.ticker.slice(0,3)}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{h.name}</div>
                    <div style={{color:T.muted2,fontSize:10}}>{h.ticker}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{background:`${ASSET_TYPE_COLORS[h.type]||T.muted}18`,
                    color:ASSET_TYPE_COLORS[h.type]||T.muted,
                    border:`1px solid ${ASSET_TYPE_COLORS[h.type]||T.muted}33`,
                    borderRadius:5,padding:"2px 6px",fontSize:9,fontWeight:800}}>{h.type}</span>
                </div>
                <div style={{textAlign:"right",color:T.muted2,fontSize:12}}>{h.quantity}</div>
                <div style={{textAlign:"right",color:T.muted2,fontSize:12}}>{fmtEur(h.avgCost)}</div>
                <div style={{textAlign:"right",fontWeight:600,fontSize:12}}>{fmtEur(h.price)}</div>
                <div style={{textAlign:"right",color:clr(h.plPct),fontWeight:700,fontSize:12}}>
                  {h.plPct>=0?"+":""}{h.plPct.toFixed(2)}%
                  <div style={{display:"flex",justifyContent:"flex-end",marginTop:2}}>
                    <Sparkline data={sparkData} color={clr(h.plPct)} height={20}/>
                  </div>
                </div>
                <div style={{textAlign:"right",fontWeight:700,fontSize:12}}>{fmtEur(h.current)}</div>
              </div>
            );
          })}

          <div style={{marginTop:14,textAlign:"center"}}>
            <button style={{background:"none",border:"none",color:T.accent,
              fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Vedi tutti gli asset →
            </button>
          </div>
        </div>

        {/* Calendar + Sentiment */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Economic Calendar */}
          <div style={{background:T.card,borderRadius:20,padding:"20px",
            border:`1px solid ${T.border}`}}>
            <div style={{color:T.muted2,fontSize:10,fontWeight:700,
              textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>
              Calendario Economico
            </div>
            {CALENDAR.map((ev,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
                padding:"8px 0",borderBottom:i<CALENDAR.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{textAlign:"center",minWidth:40}}>
                  <div style={{color:T.accent,fontWeight:700,fontSize:11}}>{ev.time}</div>
                  <div style={{color:T.muted,fontSize:9}}>{ev.day}</div>
                </div>
                <div style={{fontSize:11}}>{ev.flag}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600}}>{ev.event}</div>
                  <span style={{
                    background:ev.impact==="Alto"?`${T.red}18`:`${T.yellow}18`,
                    color:ev.impact==="Alto"?T.red:T.yellow,
                    border:`1px solid ${ev.impact==="Alto"?T.red:T.yellow}33`,
                    borderRadius:4,padding:"1px 5px",fontSize:8,fontWeight:800
                  }}>Impatto {ev.impact}</span>
                </div>
              </div>
            ))}
            <button style={{background:"none",border:"none",color:T.accent,
              fontSize:11,fontWeight:700,cursor:"pointer",marginTop:10,width:"100%",textAlign:"center"}}>
              Vedi calendario completo →
            </button>
          </div>

          {/* Market Sentiment */}
          <div style={{background:T.card,borderRadius:20,padding:"20px",
            border:`1px solid ${T.border}`,textAlign:"center"}}>
            <div style={{color:T.muted2,fontSize:10,fontWeight:700,
              textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>
              Sentiment di Mercato
            </div>
            <Gauge value={sentimentScore} color={T.green} size={140}/>
            <div style={{fontSize:40,fontWeight:900,color:T.green,marginTop:-24,lineHeight:1}}>
              {sentimentScore}
            </div>
            <div style={{color:T.green,fontSize:14,fontWeight:700,marginTop:6}}>{sentimentLabel}</div>
            <div style={{color:T.muted2,fontSize:11,marginTop:6}}>
              Il sentiment di mercato e positivo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const { cryptoData, loading: cryptoLoading, lastUpdated, refetch } = useCryptoPrices();

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
        {page === "dashboard"    && <DashboardPage holdings={holdings} cryptoData={cryptoData} cryptoLoading={cryptoLoading} lastUpdated={lastUpdated} refetch={refetch}/>}
        {page === "holdings"     && <HoldingsPage holdings={holdings}/>}
        {page === "transactions" && <TransactionsPage/>}
        {page === "analytics"    && <AnalyticsPage holdings={holdings}/>}
        {page === "settings"     && <SettingsPage/>}
      </div>
    </div>
  );
}
