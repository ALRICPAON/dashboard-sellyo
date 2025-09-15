import { app } from "/js/firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
let CHART;

const toDate = (d) => {
  if (!d) return null;
  if (typeof d === "number") return new Date(d);
  if (typeof d === "string") { const t = Date.parse(d); if (!Number.isNaN(t)) return new Date(t); const fr = new Date(d); if (!Number.isNaN(fr.getTime())) return fr; }
  if (d?.toDate) return d.toDate();
  return null;
};
const range = (mode)=>{
  if(mode==="all") return {from:null,to:null};
  const now=new Date(), end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  let start;
  if(mode==="today") start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  else if(mode==="7d"){ start=new Date(end); start.setDate(start.getDate()-7); }
  else { start=new Date(end); start.setDate(start.getDate()-30); }
  return {from:start,to:end};
};
const inRange=(dt,{from,to})=>{
  if(!from && !to) return true;
  if(!dt) return false;
  const t=dt.getTime();
  if(from && t<from.getTime())return false;
  if(to && t>=to.getTime())return false;
  return true;
};
const fmt=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const lastDays=(n=30)=>{ const out=[]; const end=new Date(); end.setHours(0,0,0,0); for(let i=n-1;i>=0;i--){ const d=new Date(end); d.setDate(d.getDate()-i); out.push(fmt(d)); } return out; };

async function load(uid){
  const q = query(collection(db,"emails"), where("userId","==",uid));
  const snap = await getDocs(q);
  const rows=[];
  snap.forEach(d=>{
    const data=d.data();
    const dt = toDate(data.createdAt) || toDate(data.scheduledAt) || toDate(data.date);
    const recipients = Array.isArray(data.recipients) ? data.recipients.length : (Number(data.recipientsCount)||0);
    rows.push({subject:data.name || data.subject || "(Sans sujet)", recipients, status:(data.status||"").toLowerCase(), dt});
  });
  return rows;
}

function compute(rows, mode){
  const r = range(mode);
  const sent = rows.filter(rw => (!rw.status || rw.status==="sent") && inRange(rw.dt, r));
  const sentCount = sent.length;
  const recipientsTotal = sent.reduce((a,b)=>a+(b.recipients||0),0);
  const avg = sentCount? Math.round(recipientsTotal/sentCount) : 0;
  // bucket jour (30j)
  const labels = lastDays(30);
  const map = Object.fromEntries(labels.map(l=>[l,0]));
  rows.forEach(rw=>{
    if(!rw.dt || !inRange(rw.dt, {from:new Date(Date.now()-30*864e5), to:new Date()})) return;
    const k = fmt(new Date(rw.dt.setHours(0,0,0,0)));
    if(k in map) map[k] += (rw.recipients||0);
  });
  const chartData = labels.map(l=>map[l]);
  // top 5 par recipients
  const top = [...sent].sort((a,b)=> (b.recipients||0)-(a.recipients||0)).slice(0,5);
  return { sentCount, recipientsTotal, avg, labels, chartData, top };
}

function drawChart(labels,data){
  const ctx=document.getElementById("mail-chart");
  if (CHART) CHART.destroy();
  CHART = new Chart(ctx,{ type:"line", data:{ labels, datasets:[{ label:"Destinataires", data }] },
    options:{ plugins:{legend:{labels:{color:"#ddd"}}}, scales:{x:{ticks:{color:"#aaa"}}, y:{ticks:{color:"#aaa"}, beginAtZero:true}} }});
}

function render(kpis){
  document.getElementById("kpi-sent").textContent = kpis.sentCount.toLocaleString("fr-FR");
  document.getElementById("kpi-recipients").textContent = kpis.recipientsTotal.toLocaleString("fr-FR");
  document.getElementById("kpi-avg").textContent = kpis.avg.toLocaleString("fr-FR");
  drawChart(kpis.labels, kpis.chartData);
  const tbody=document.getElementById("mail-top"); tbody.innerHTML="";
  kpis.top.forEach(t=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${t.subject}</td><td>${(t.recipients||0).toLocaleString("fr-FR")}</td><td>${t.dt? t.dt.toLocaleDateString("fr-FR"):""}</td>`;
    tbody.appendChild(tr);
  });
}

onAuthStateChanged(auth, async (user)=>{
  if(!user) return;
  const rows = await load(user.uid);
  const sel = document.getElementById("period");
  const refresh = ()=> render(compute(rows, sel.value));
  sel.addEventListener("change", refresh);
  refresh();
});
