import { app } from "/js/firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth=getAuth(app); const db=getFirestore(app);
let CHART;

const toDate=(d)=>{ if(!d)return null; if(typeof d==="number")return new Date(d);
  if(typeof d==="string"){const t=Date.parse(d); if(!Number.isNaN(t))return new Date(t); const fr=new Date(d); if(!Number.isNaN(fr.getTime()))return fr;}
  if(d?.toDate) return d.toDate(); return null; };
const range=(m)=>{ if(m==="all")return{from:null,to:null}; const now=new Date(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  let s; if(m==="today") s=new Date(now.getFullYear(),now.getMonth(),now.getDate()); else if(m==="7d"){s=new Date(end); s.setDate(s.getDate()-7);} else {s=new Date(end); s.setDate(s.getDate()-30);} return {from:s,to:end}; };
const inRange=(dt,{from,to})=>{ if(!from&&!to)return true; if(!dt)return false; const t=dt.getTime(); if(from&&t<from.getTime())return false; if(to&&t>=to.getTime())return false; return true; };
const key=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const lastDays=(n=30)=>{ const out=[], end=new Date(); end.setHours(0,0,0,0); for(let i=n-1;i>=0;i--){ const d=new Date(end); d.setDate(end.getDate()-i); out.push(key(d)); } return out; };

async function load(uid){
  const q=query(collection(db,"leads"), where("userId","==",uid));
  const snap=await getDocs(q);
  const rows=[];
  snap.forEach(d=>{
    const data=d.data();
    const dt=toDate(data.createdAt)||toDate(data.date);
    // identifiant landing tolérant : landingId || pageSlug || slug || source
    const id = data.landingId || data.pageSlug || data.slug || data.source || "(inconnu)";
    rows.push({id, dt});
  });
  return rows;
}

function compute(rows, mode){
  const r=range(mode);
  const filtered=rows.filter(x=>inRange(x.dt,r));
  const byLanding=new Map();
  filtered.forEach(x=>{
    const m=byLanding.get(x.id)||{count:0,last:null};
    m.count++; if(!m.last||x.dt>m.last) m.last=x.dt; byLanding.set(x.id,m);
  });
  // KPIs
  const total=filtered.length;
  const uniq=byLanding.size;
  let topName="—", topCount=0;
  for(const [k,v] of byLanding){ if(v.count>topCount){ topCount=v.count; topName=k; } }

  // table
  const table=[...byLanding.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,50);

  // courbe 30j
  const labels=lastDays(30); const map=Object.fromEntries(labels.map(l=>[l,0]));
  rows.forEach(x=>{
    if(!x.dt) return;
    const d=new Date(x.dt); d.setHours(0,0,0,0);
    const k=key(d); if(k in map) map[k]+=1;
  });
  const data=labels.map(l=>map[l]);
  return { total, uniq, topName, table, labels, data };
}

function render(k){
  document.getElementById("kpi-leads").textContent=k.total.toLocaleString("fr-FR");
  document.getElementById("kpi-uniq").textContent=k.uniq.toLocaleString("fr-FR");
  document.getElementById("kpi-top").textContent=`${k.topName} (${k.total? Math.round((Math.max(...k.table.map(t=>t[1].count))/k.total)*100):0}%)`;

  const tbody=document.getElementById("table-lands"); tbody.innerHTML="";
  k.table.forEach(([id,v])=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${id}</td><td>${v.count}</td><td>${v.last? v.last.toLocaleDateString("fr-FR"):""}</td>`;
    tbody.appendChild(tr);
  });

  const ctx=document.getElementById("lead-chart");
  if (CHART) CHART.destroy();
  CHART=new Chart(ctx,{type:"line",data:{labels:k.labels,datasets:[{label:"Leads",data:k.data}]} ,
    options:{plugins:{legend:{labels:{color:"#ddd"}}},scales:{x:{ticks:{color:"#aaa"}},y:{ticks:{color:"#aaa"},beginAtZero:true}}}});
}

onAuthStateChanged(auth, async (user)=>{
  if(!user) return;
  const rows=await load(user.uid);
  const sel=document.getElementById("period");
  const refresh=()=>render(compute(rows, sel.value));
  sel.addEventListener("change", refresh);
  refresh();
});
