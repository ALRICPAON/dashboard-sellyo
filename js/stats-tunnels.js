import { app } from "/js/firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth=getAuth(app); const db=getFirestore(app);
const toDate=(d)=>{ if(!d)return null; if(typeof d==="number")return new Date(d);
  if(typeof d==="string"){const t=Date.parse(d); if(!Number.isNaN(t))return new Date(t); const fr=new Date(d); if(!Number.isNaN(fr.getTime()))return fr;}
  if(d?.toDate) return d.toDate(); return null; };
const range=(m)=>{ if(m==="all")return{from:null,to:null}; const now=new Date(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  let s; if(m==="today") s=new Date(now.getFullYear(),now.getMonth(),now.getDate()); else if(m==="7d"){s=new Date(end); s.setDate(s.getDate()-7);} else {s=new Date(end); s.setDate(s.getDate()-30);} return {from:s,to:end}; };
const inRange=(dt,{from,to})=>{ if(!from&&!to)return true; if(!dt)return false; const t=dt.getTime(); if(from&&t<from.getTime())return false; if(to&&t>=to.getTime())return false; return true; };

async function load(uid){
  // Tunnels créés
  const qt=query(collection(db,"tunnels"), where("userId","==",uid));
  const st=await getDocs(qt);
  const tunnels=[]; st.forEach(d=>tunnels.push({ ...d.data(), dt: toDate(d.data().createdAt)||toDate(d.data().date), slug: d.data().slug || d.data().tunnelSlug || d.id }));

  // Leads => identifier le tunnel (tunnelSlug || landingId || source)
  const ql=query(collection(db,"leads"), where("userId","==",uid));
  const sl=await getDocs(ql);
  const leads=[]; sl.forEach(d=>{
    const x=d.data();
    const tslug = x.tunnelSlug || x.slug || x.landingId || x.source || "(inconnu)";
    leads.push({ tunnel: tslug, dt: toDate(x.createdAt)||toDate(x.date) });
  });

  return { tunnels, leads };
}

function compute(data, mode){
  const r=range(mode);
  const tunnelsIn = data.tunnels.filter(x=>inRange(x.dt,r));
  const leadsIn   = data.leads.filter(x=>inRange(x.dt,r));

  // leads par tunnel
  const byTunnel = new Map();
  leadsIn.forEach(l=>{
    const m=byTunnel.get(l.tunnel)||{count:0,last:null};
    m.count++; if(!m.last||l.dt>m.last) m.last=l.dt; byTunnel.set(l.tunnel,m);
  });

  const totalTunnels = tunnelsIn.length;
  const totalLeads   = leadsIn.length;

  let topName="—", topCount=0;
  for(const [k,v] of byTunnel){ if(v.count>topCount){ topCount=v.count; topName=k; } }

  const table = [...byTunnel.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,50);

  return { totalTunnels, totalLeads, topName, table };
}

function render(k){
  document.getElementById("kpi-tunnels").textContent = k.totalTunnels.toLocaleString("fr-FR");
  document.getElementById("kpi-leads").textContent   = k.totalLeads.toLocaleString("fr-FR");
  document.getElementById("kpi-top").textContent     = k.topName;

  const tbody=document.getElementById("table-tunnels"); tbody.innerHTML="";
  k.table.forEach(([slug,v])=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${slug}</td><td>${v.count}</td><td>${v.last? v.last.toLocaleDateString("fr-FR"):""}</td>`;
    tbody.appendChild(tr);
  });
}

onAuthStateChanged(auth, async (user)=>{
  if(!user) return;
  const data=await load(user.uid);
  const sel=document.getElementById("period");
  const refresh=()=>render(compute(data, sel.value));
  sel.addEventListener("change", refresh);
  refresh();
});
