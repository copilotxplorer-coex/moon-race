/* MOON RACE v7 — Share to X + Zero Jitter */
const socket=io();const MOON=384400;
const COUNTRIES=[{code:"TH",name:"Thailand",flag:"🇹🇭"},{code:"US",name:"USA",flag:"🇺🇸"},{code:"CN",name:"China",flag:"🇨🇳"},{code:"RU",name:"Russia",flag:"🇷🇺"},{code:"JP",name:"Japan",flag:"🇯🇵"},{code:"KR",name:"Korea",flag:"🇰🇷"},{code:"IN",name:"India",flag:"🇮🇳"},{code:"GB",name:"UK",flag:"🇬🇧"},{code:"FR",name:"France",flag:"🇫🇷"},{code:"DE",name:"Germany",flag:"🇩🇪"},{code:"IT",name:"Italy",flag:"🇮🇹"},{code:"BR",name:"Brazil",flag:"🇧🇷"},{code:"AU",name:"Australia",flag:"🇦🇺"},{code:"CA",name:"Canada",flag:"🇨🇦"},{code:"MX",name:"Mexico",flag:"🇲🇽"},{code:"AE",name:"UAE",flag:"🇦🇪"},{code:"SA",name:"Saudi",flag:"🇸🇦"},{code:"SG",name:"Singapore",flag:"🇸🇬"},{code:"MY",name:"Malaysia",flag:"🇲🇾"},{code:"ID",name:"Indonesia",flag:"🇮🇩"},{code:"VN",name:"Vietnam",flag:"🇻🇳"},{code:"PH",name:"Philippines",flag:"🇵🇭"},{code:"SE",name:"Sweden",flag:"🇸🇪"},{code:"IL",name:"Israel",flag:"🇮🇱"},{code:"EU",name:"EU",flag:"🇪🇺"},{code:"ES",name:"Spain",flag:"🇪🇸"},{code:"NL",name:"Netherlands",flag:"🇳🇱"},{code:"PL",name:"Poland",flag:"🇵🇱"},{code:"TR",name:"Türkiye",flag:"🇹🇷"},{code:"AR",name:"Argentina",flag:"🇦🇷"},{code:"NZ",name:"New Zealand",flag:"🇳🇿"},{code:"ZA",name:"South Africa",flag:"🇿🇦"}];
const RM={falcon9:{name:"Falcon 9",company:"SpaceX",origin:"🇺🇸",emoji:"🚀",color:"#4fc3f7"},sls:{name:"SLS",company:"NASA",origin:"🇺🇸",emoji:"🛸",color:"#ff8a65"},new_glenn:{name:"New Glenn",company:"Blue Origin",origin:"🇺🇸",emoji:"🚀",color:"#81d4fa"},lm5b:{name:"LM-5B",company:"CASC",origin:"🇨🇳",emoji:"🚀",color:"#ef5350"},soyuz:{name:"Soyuz",company:"Roscosmos",origin:"🇷🇺",emoji:"🚀",color:"#66bb6a"},pslv:{name:"PSLV",company:"ISRO",origin:"🇮🇳",emoji:"🚀",color:"#ffa726"},ariane6:{name:"Ariane 6",company:"Arianespace",origin:"🇪🇺",emoji:"🚀",color:"#ab47bc"},h3:{name:"H3",company:"JAXA",origin:"🇯🇵",emoji:"🚀",color:"#ec407a"}};

let selC=null,selR=null,curId=null,gs={rockets:{},stats:[]},pIds=[null,null,null];
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const screens={lobby:$("#screen-lobby"),flight:$("#screen-flight"),dashboard:$("#screen-dashboard"),stats:$("#screen-stats")};
const rImg={};Object.keys(RM).forEach(k=>{const i=new Image();i.src=`/assets/rockets/${k}.png`;i.onerror=()=>{rImg[k]=null};i.onload=()=>{rImg[k]=i};rImg[k]=null});

/* ═══ SHARE TO X ═══ */
function getGameURL(){ return window.location.origin; }
function shareToX(rocket){
  if(!rocket) return;
  const m=RM[rocket.type]||{};
  const flag=getFlag(rocket.code);
  const pct=(rocket.distance/MOON*100).toFixed(2);
  const dist=formatDist(rocket.distance);
  const peak=formatDist(rocket.maxDistance||rocket.distance);
  const status=rocket.reached?"🌕 LANDED!":rocket.crashed?"💥 Crashed at "+peak+" km":"🚀 Flying at "+dist+" km";
  const text=`${flag} Captain ${rocket.captain||"Anonymous"} needs YOUR help!\n\n${status}\n📊 ${pct}% to the Moon (${dist} / 384,400 km)\n🏔️ Peak: ${peak} km\n🚀 ${m.name} (${m.company})\n\n👉 Click to boost my rocket!\n${getGameURL()}\n\n#MoonRace #SpaceGame`;
  const url=`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url,'_blank','width=600,height=400');
}

/* MOTION */
const mot={};
function gM(id){if(!mot[id])mot[id]={sp:Math.random()*Math.PI*2,ss:.008+Math.random()*.006,sa:15+Math.random()*10,bp:Math.random()*Math.PI*2,bs:.012+Math.random()*.008,ba:6+Math.random()*4,vi:0,t:0,tt:0,bk:0,fw:0};return mot[id]}
function uM(id,r,dt){const m=gM(id),hf=r.fuel>0&&!r.crashed&&!r.reached,fl=r.fuel<=0&&!r.crashed&&!r.reached;m.sp+=m.ss*dt;const sx=Math.sin(m.sp)*m.sa*(hf?1:fl?2.5:.3);m.bp+=m.bs*dt;const by=Math.sin(m.bp)*m.ba*(hf?1:fl?.3:.1);const tv=hf?1.5+r.fuel*.03:0;m.vi+=(tv-m.vi)*.1;const vx=(Math.random()-.5)*m.vi*2,vy=(Math.random()-.5)*m.vi*2;m.tt=Math.cos(m.sp)*(hf?3:fl?8:1)*(Math.PI/180);m.t+=(m.tt-m.t)*.05;if(fl){m.fw+=.04*dt;m.t+=Math.sin(m.fw*3)*6*(Math.PI/180)}m.bk*=.88;return{ox:sx+vx,oy:by+vy-m.bk,rot:m.t}}
function bkick(id){gM(id).bk=12+Math.random()*6}

/* NAV */
function show(n){Object.values(screens).forEach(s=>s.classList.remove("active"));$$(".nav-btn").forEach(b=>b.classList.remove("active"));if(screens[n])screens[n].classList.add("active");const b=$(`.nav-btn[data-screen="${n}"]`);if(b)b.classList.add("active");n==="flight"?startCL():stopCL()}
$$(".nav-btn").forEach(b=>b.addEventListener("click",()=>show(b.dataset.screen)));
$("#btn-back-dash").addEventListener("click",()=>show("dashboard"));

/* LOBBY */
(function(){
  const cg=$("#country-grid");COUNTRIES.forEach(c=>{const e=document.createElement("div");e.className="country-card";e.innerHTML=`<span class="country-flag">${c.flag}</span><span class="country-name">${c.name}</span>`;e.addEventListener("click",()=>{$$(".country-card").forEach(x=>x.classList.remove("selected"));e.classList.add("selected");selC=c;const p=$("#selected-country-preview");p.classList.remove("hidden");p.innerHTML=`<span class="scp-flag">${c.flag}</span><span class="scp-name">${c.name}</span>`;uLB()});cg.appendChild(e)});
  const rg=$("#rocket-grid");Object.entries(RM).forEach(([k,r])=>{const e=document.createElement("div");e.className="rocket-card";e.innerHTML=`<div class="rocket-thumb" id="rt-${k}">${r.emoji}</div><div class="rocket-info"><h3><span class="rocket-origin-flag">${r.origin}</span>${r.name}</h3><p>${r.company}</p></div>`;e.addEventListener("click",()=>{$$(".rocket-card").forEach(x=>x.classList.remove("selected"));e.classList.add("selected");selR=k;uLB()});rg.appendChild(e)});
  setTimeout(()=>{Object.entries(rImg).forEach(([k,i])=>{if(i){const t=$(`#rt-${k}`);if(t)t.innerHTML=`<img src="/assets/rockets/${k}.png" alt="${k}"/>`}})},1500);
})();
function gCN(){return($("#captain-name").value||"").trim()||"Anonymous"}
function uLB(){const b=$("#btn-launch"),s=$("#launch-summary");if(selC&&selR){b.disabled=false;const r=RM[selR];s.classList.remove("hidden");s.innerHTML=`${selC.flag} <strong>${selC.name}</strong> · <strong>${r.origin} ${r.name}</strong> · Cpt. <strong>${gCN()}</strong>`}else{b.disabled=true;s.classList.add("hidden")}}
$("#captain-name").addEventListener("input",uLB);

/* COUNTDOWN */
let cdA=false,pLD=null;
function startCD(){if(cdA)return;cdA=true;const ov=$("#countdown-overlay"),num=$("#cd-number"),lbl=$("#cd-label"),bar=$("#cd-bar"),rkt=$("#cd-rocket"),smk=$("#cd-smoke"),cap=$("#cd-captain");ov.classList.remove("hidden");num.className="countdown-number";rkt.className="countdown-rocket";smk.className="countdown-smoke";bar.style.width="0%";lbl.textContent="LAUNCH SEQUENCE INITIATED";lbl.style.color="";cap.textContent=`Captain ${gCN()} — ${selC.flag} ${selC.name}`;rkt.textContent=(RM[selR]||{}).emoji||"🚀";let c=5;num.textContent=c;setTimeout(()=>{bar.style.width="100%"},50);const iv=setInterval(()=>{c--;if(c>0){num.textContent=c;num.className="countdown-number";void num.offsetWidth;rkt.style.animationDuration=(.15-c*.015)+"s";if(c<=2){lbl.textContent="ENGINES AT FULL POWER";lbl.style.color="#f97316"}}else{clearInterval(iv);num.textContent="LIFTOFF!";num.className="countdown-number go";lbl.textContent="🔥 ALL ENGINES NOMINAL 🔥";lbl.style.color="#10b981";rkt.classList.add("liftoff");smk.classList.add("active");socket.emit("launch",pLD);setTimeout(()=>{ov.classList.add("hidden");cdA=false},1200)}},1000)}
$("#btn-launch").addEventListener("click",()=>{if(!selC||!selR)return;pLD={country:selC.name,code:selC.code,type:selR,captain:gCN()};startCD()});
socket.on("launched",d=>{curId=d.id;setTimeout(()=>show("flight"),cdA?800:0)});

/* CANVAS */
const cv=$("#flight-canvas"),cx=cv.getContext("2d");
let aId=null,stars=[],parts=[],sOff=0,clkW=[],lft=performance.now(),spdL=[];
function rCV(){cv.width=cv.parentElement.clientWidth;cv.height=cv.parentElement.clientHeight;if(!stars.length)iS()}
window.addEventListener("resize",rCV);
function iS(){stars=[];for(let i=0;i<300;i++)stars.push({x:Math.random()*2000,y:Math.random()*2000,s:Math.random()*2+.3,tw:Math.random()*Math.PI*2,sp:.005+Math.random()*.03})}
function sP(x,y,n,sp){sp=sp||1;for(let i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*14*sp,y,vx:(Math.random()-.5)*3*sp,vy:Math.random()*4*sp+2,life:1,dc:.012+Math.random()*.02,sz:Math.random()*5*sp+2})}
function dP(){for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.life-=p.dc;p.sz*=.97;if(p.life<=0){parts.splice(i,1);continue}const g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz);g.addColorStop(0,`rgba(255,220,80,${p.life})`);g.addColorStop(.4,`rgba(255,160,30,${p.life*.7})`);g.addColorStop(.7,`rgba(255,80,10,${p.life*.4})`);g.addColorStop(1,"rgba(255,40,0,0)");cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,p.sz,0,Math.PI*2);cx.fill()}}
function dSt(){const w=cv.width,h=cv.height;stars.forEach(s=>{s.tw+=s.sp;cx.fillStyle=`rgba(255,255,255,${.3+Math.sin(s.tw)*.7})`;cx.beginPath();cx.arc(s.x%(w+100)-50,((s.y+sOff*.5)%(h+100))-50,s.s,0,Math.PI*2);cx.fill()})}
function dRk(px,py,k,fl,rot){const im=rImg[k],rH=120,rW=40;cx.save();cx.translate(px,py);cx.rotate(rot||0);if(im){cx.drawImage(im,-rW/2,-rH/2,rW,rH)}else{const m=RM[k]||{color:"#ccc"};cx.fillStyle="#d0d0d8";cx.beginPath();cx.moveTo(0,-rH/2);cx.quadraticCurveTo(rW/2,-rH/3,rW/2-4,rH/3);cx.lineTo(-rW/2+4,rH/3);cx.quadraticCurveTo(-rW/2,-rH/3,0,-rH/2);cx.fill();cx.strokeStyle=m.color;cx.lineWidth=1.5;cx.stroke();cx.fillStyle=m.color;cx.beginPath();cx.moveTo(0,-rH/2-5);cx.lineTo(10,-rH/2+15);cx.lineTo(-10,-rH/2+15);cx.closePath();cx.fill();cx.fillStyle=m.color;cx.beginPath();cx.moveTo(-rW/2+4,rH/3-5);cx.lineTo(-rW/2-8,rH/3+15);cx.lineTo(-rW/2+4,rH/3+5);cx.closePath();cx.fill();cx.beginPath();cx.moveTo(rW/2-4,rH/3-5);cx.lineTo(rW/2+8,rH/3+15);cx.lineTo(rW/2-4,rH/3+5);cx.closePath();cx.fill();cx.fillStyle="#5cf";cx.beginPath();cx.arc(0,-rH/4,5,0,Math.PI*2);cx.fill()}cx.restore();cx.font="22px serif";cx.textAlign="center";cx.fillText(fl,px,py-70)}
function dE(d){const w=cv.width,h=cv.height,mx=Math.max(w,h)*.6,t=Math.min(1,d/5000),r=mx*(1-t*.85);if(r<5)return;const y=h+r*.6+t*200;const g=cx.createRadialGradient(w/2,y,r*.2,w/2,y,r);g.addColorStop(0,"#2a8fd4");g.addColorStop(.5,"#1b6baa");g.addColorStop(.8,"#0d3f6e");g.addColorStop(1,"rgba(0,0,0,0)");cx.fillStyle=g;cx.beginPath();cx.arc(w/2,y,r,0,Math.PI*2);cx.fill()}
function dMn(d){const w=cv.width,h=cv.height;if(d<MOON*.3)return;const t=(d-MOON*.3)/(MOON*.7),r=8+t*250,y=-r*.5+t*r*.8;const g=cx.createRadialGradient(w/2-r*.15,y-r*.15,r*.1,w/2,y,r);g.addColorStop(0,"#e8e8e0");g.addColorStop(.7,"#b0b0a0");g.addColorStop(1,"#888878");cx.fillStyle=g;cx.beginPath();cx.arc(w/2,y,r,0,Math.PI*2);cx.fill();cx.fillStyle="rgba(0,0,0,0.1)";cx.beginPath();cx.arc(w/2-r*.25,y-r*.15,r*.12,0,Math.PI*2);cx.fill();cx.beginPath();cx.arc(w/2+r*.3,y+r*.2,r*.08,0,Math.PI*2);cx.fill()}
function uSL(hf){const w=cv.width,h=cv.height;if(hf&&Math.random()<.3)spdL.push({x:Math.random()*w,y:-10,l:20+Math.random()*40,s:8+Math.random()*12,a:.2+Math.random()*.3});for(let i=spdL.length-1;i>=0;i--){const l=spdL[i];l.y+=l.s;if(l.y>h+50){spdL.splice(i,1);continue}cx.strokeStyle=`rgba(150,200,255,${l.a})`;cx.lineWidth=1;cx.beginPath();cx.moveTo(l.x,l.y);cx.lineTo(l.x,l.y-l.l);cx.stroke()}}

function rF(){const now=performance.now(),dt=Math.min(now-lft,50);lft=now;const w=cv.width,h=cv.height;const r=gs.rockets[curId];if(!r)return;const bg=cx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#000008");bg.addColorStop(1,"#080820");cx.fillStyle=bg;cx.fillRect(0,0,w,h);const hf=r.fuel>0&&!r.crashed&&!r.reached;if(hf)sOff+=.8;dSt();uSL(hf);dE(r.distance);dMn(r.distance);const mo=uM(curId,r,dt*.06);const rx=w/2+mo.ox,ry=h/2+mo.oy;dRk(rx,ry,r.type,getFlag(r.code),mo.rot);if(hf){const ex=rx-Math.sin(mo.rot)*55,ey=ry+Math.cos(mo.rot)*55;sP(ex,ey,4,.8+r.fuel*.02);const gr=20+Math.random()*15+r.fuel*.2,gx=rx-Math.sin(mo.rot)*60,gy=ry+Math.cos(mo.rot)*60;const gl=cx.createRadialGradient(gx,gy,0,gx,gy,gr);gl.addColorStop(0,"rgba(255,200,50,0.25)");gl.addColorStop(.5,"rgba(255,100,20,0.1)");gl.addColorStop(1,"rgba(255,50,0,0)");cx.fillStyle=gl;cx.beginPath();cx.arc(gx,gy,gr,0,Math.PI*2);cx.fill()}dP();if(r.crashed){cx.fillStyle="rgba(255,0,0,0.15)";cx.fillRect(0,0,w,h);cx.font="bold 28px Orbitron";cx.textAlign="center";cx.fillStyle="#ff4466";cx.fillText("💥 CRASHED",w/2,h/2-80);cx.font="14px Inter";cx.fillStyle="#aaa";cx.fillText("Return to lobby to relaunch",w/2,h/2-55)}if(r.reached){cx.fillStyle="rgba(0,230,118,0.08)";cx.fillRect(0,0,w,h);cx.font="bold 28px Orbitron";cx.textAlign="center";cx.fillStyle="#00e676";cx.fillText("🌕 MOON REACHED!",w/2,h/2-80)}uHUD(r)}

function uHUD(r){const m=RM[r.type]||{},fl=getFlag(r.code);$("#hud-captain").textContent="Cpt. "+(r.captain||"Anonymous");$("#hud-country").textContent=fl+" "+r.country;$("#hud-rocket").textContent=m.name||r.type;$("#hud-dist").textContent=formatDist(r.distance);const md=r.maxDistance||r.distance;$("#hud-maxdist").innerHTML=`🏔️ Peak: <span>${formatDist(md)}</span> km`;$("#hud-progress").style.width=(r.distance/MOON*100)+"%";const fp=Math.round(r.fuel);$("#hud-fuel").style.width=fp+"%";$("#hud-fuel-pct").textContent=fp+"%";$("#hud-fuel").className="fuel-fill"+(fp<25?" danger":fp<50?" warn":"");$("#hud-clicks").textContent="Clicks: "+r.clicks;const now=Date.now();clkW=clkW.filter(t=>now-t<5000);const cps=clkW.length/5,kps=cps*.1,rem=MOON-r.distance;if(rem<=0){$("#hud-eta").textContent="🌕 Arrived!";$("#hud-eta").style.color="#10b981"}else if(kps>0){const s=rem/kps;$("#hud-eta").textContent=s<3600?`ETA: ${Math.ceil(s/60)} min`:s<86400?`ETA: ${(s/3600).toFixed(1)} hrs`:`ETA: ${(s/86400).toFixed(1)} days`;$("#hud-eta").style.color=r.fuel>25?"#2563eb":"#ef4444"}else{$("#hud-eta").textContent=r.fuel>0?"⚡ Click to boost!":"⚠️ OUT OF FUEL!";$("#hud-eta").style.color=r.fuel>0?"#6b7084":"#ef4444"}}

let lR=false;
function startCL(){if(lR)return;lR=true;lft=performance.now();rCV();(function lp(){if(!lR)return;rF();aId=requestAnimationFrame(lp)})()}
function stopCL(){lR=false;if(aId)cancelAnimationFrame(aId)}

/* Click boost + Share button in flight */
$("#click-zone").addEventListener("click",e=>{if(!curId)return;const r=gs.rockets[curId];if(!r||r.crashed||r.reached)return;socket.emit("boost",{id:curId});clkW.push(Date.now());bkick(curId);const fx=$("#boost-fx");fx.style.left=e.clientX+"px";fx.style.top=e.clientY+"px";fx.textContent="+0.1";fx.style.opacity=1;fx.style.transform="translateY(0)";requestAnimationFrame(()=>{fx.style.transition="all 0.6s";fx.style.opacity=0;fx.style.transform="translateY(-40px)";setTimeout(()=>{fx.style.transition="none"},600)})});

/* ★ Share from Flight HUD */
$("#btn-share-flight").addEventListener("click",e=>{
  e.stopPropagation();
  if(!curId) return;
  shareToX(gs.rockets[curId]);
});

/* PODIUM */
function rPod(ids,rks){const pe=$("#podium"),pm=$("#podium-empty");if(!ids.length){pe.classList.add("hidden");pm.style.display="block";pIds=[null,null,null];return}pe.classList.remove("hidden");pm.style.display="none";const top=ids.slice(0,3);pIds=[top[0]||null,top[1]||null,top[2]||null];for(let i=0;i<3;i++){const rk=i+1,id=top[i],sl=$(`#podium-${rk}`);if(!id){sl.style.visibility="hidden";continue}sl.style.visibility="visible";const r=rks[id],m=RM[r.type]||{},fl=getFlag(r.code),fp=Math.round(r.fuel);const ve=$(`#podium-visual-${rk}`);if(rImg[r.type])ve.innerHTML=`<img src="/assets/rockets/${r.type}.png" alt="${m.name}"/>`;else ve.textContent=m.emoji||"🚀";$(`#podium-flag-${rk}`).textContent=fl;$(`#podium-info-${rk}`).innerHTML=`<span class="pcaptain">Cpt. ${r.captain||"Anonymous"}</span><span class="pcountry">${r.country}</span><span class="procket">${m.origin} ${m.name} · ${m.company}</span>`;$(`#podium-dist-${rk}`).innerHTML=`${formatDist(r.distance)} <small>km</small>`;$(`#podium-maxdist-${rk}`).innerHTML=`🏔️ Peak: <span>${formatDist(r.maxDistance||r.distance)}</span> km`;const ff=$(`#podium-fuel-${rk}`);ff.style.width=fp+"%";ff.className="podium-fuel-fill"+(fp<25?" danger":fp<50?" warn":"");$(`#podium-fuel-pct-${rk}`).textContent=fp+"%";const bb=$(`#podium-boost-${rk}`);if(r.crashed){bb.disabled=true;bb.textContent="💥 CRASHED"}else if(r.reached){bb.disabled=true;bb.textContent="🌕 LANDED!"}else{bb.disabled=false;bb.textContent="⚡ BOOST +0.1 km"}}}

[1,2,3].forEach(rk=>{
  $(`#podium-boost-${rk}`).addEventListener("click",e=>{e.stopPropagation();const id=pIds[rk-1];if(!id)return;const r=gs.rockets[id];if(!r||r.crashed||r.reached)return;socket.emit("boost",{id});const b=$(`#podium-boost-${rk}`);b.classList.remove("ripple");void b.offsetWidth;b.classList.add("ripple");setTimeout(()=>b.classList.remove("ripple"),400)});
  /* ★ Share from Podium */
  $(`#podium-share-${rk}`).addEventListener("click",e=>{e.stopPropagation();const id=pIds[rk-1];if(!id)return;shareToX(gs.rockets[id])});
  $(`#podium-${rk}`).addEventListener("click",e=>{if(e.target.closest(".podium-boost-btn")||e.target.closest(".podium-share-btn"))return;const id=pIds[rk-1];if(!id)return;curId=id;show("flight")});
});

/* ★ DASHBOARD — fixed track HTML structure */
function rDash(){const rks=gs.rockets;const ids=Object.keys(rks).sort((a,b)=>rks[b].distance-rks[a].distance);rPod(ids,rks);const ct=$("#dash-rockets");ct.innerHTML="";ids.forEach((id,idx)=>{const r=rks[id],m=RM[r.type]||{},fl=getFlag(r.code);const pct=Math.sqrt(r.distance/MOON)*100;const st=r.reached?"reached":r.crashed?"crashed":"flying";const stL=r.reached?"✅ LANDED":r.crashed?"💥 CRASHED":"🛰️ FLYING";const rb=idx<3?["🥇","🥈","🥉"][idx]:`#${idx+1}`;const md=r.maxDistance||r.distance;const mdL=r.crashed?`🏔️ Peak: ${formatDist(md)} km`:"";
const row=document.createElement("div");row.className=`dash-rocket-row ${st}`;
/* ★ Track uses .dr-track-bg wrapper + pointer-events:none to prevent jitter */
row.innerHTML=`<span style="font-size:1rem;width:28px;text-align:center">${rb}</span><span class="dr-flag">${fl}</span><div class="dr-info"><h4>${r.country} — ${m.origin} ${m.name||r.type}</h4><div class="dr-captain">Cpt. ${r.captain||"Anonymous"}</div><p>${m.company||""}</p>${mdL?`<div class="dr-maxdist">${mdL}</div>`:""}</div><div class="dr-track"><div class="dr-track-bg"><div class="dr-track-fill" style="width:${pct}%"></div></div><span class="dr-track-icon" style="left:${Math.min(pct,98)}%">🚀</span></div><div class="dr-dist">${formatDist(r.distance)}</div><div class="dr-status ${st}">${stL}</div>`;
row.addEventListener("click",()=>{curId=id;show("flight")});ct.appendChild(row)})}

/* STATS */
function rStat(){const el=$("#stats-content"),st=gs.stats;if(!st||!st.length){el.innerHTML='<p class="stats-empty">No successful landings yet.</p>';return}let h=`<table class="stats-table"><thead><tr><th>#</th><th>CAPTAIN</th><th>COUNTRY</th><th>ROCKET</th><th>COMPANY</th><th>CLICKS</th><th>TIME</th></tr></thead><tbody>`;st.forEach((s,i)=>{h+=`<tr><td>${i+1}</td><td><strong>${s.captain||"Anonymous"}</strong></td><td><span class="stats-flag">${getFlag(s.code)}</span>${s.country}</td><td>${s.rocket||s.type}</td><td>${s.company||"—"}</td><td>${(s.clicks||0).toLocaleString()}</td><td>${s.time?formatTime(s.time):"—"}</td></tr>`});h+=`</tbody></table>`;el.innerHTML=h}

/* SOCKET */
socket.on("state",d=>{gs=d;rDash();rStat()});
socket.on("moon",d=>{const r=d.rocket,m=RM[r.type]||{},fl=getFlag(r.code),dur=r.reachedAt&&r.launchedAt?formatTime(r.reachedAt-r.launchedAt):"—";$("#modal-details").innerHTML=`<p style="font-size:2.5rem;margin:12px 0">${fl}</p><p><strong>Captain ${r.captain||"Anonymous"}</strong></p><p><strong>${r.country}</strong> reached the Moon!</p><p>Rocket: <strong>${m.origin} ${m.name||r.type}</strong></p><p>Clicks: <strong>${(r.clicks||0).toLocaleString()}</strong> | Time: <strong>${dur}</strong></p>`;$("#modal-moon").classList.remove("hidden")});
$("#btn-modal-close").addEventListener("click",()=>$("#modal-moon").classList.add("hidden"));
socket.on("visitors",d=>{const oe=document.getElementById("visitor-online"),te=document.getElementById("visitor-total");if(oe){const p=parseInt(oe.textContent)||0;oe.textContent=d.online.toLocaleString();if(d.online!==p){oe.className="count-animate";setTimeout(()=>oe.className="",300)}}if(te){const p=parseInt(te.textContent)||0;te.textContent=d.total.toLocaleString();if(d.total!==p){te.className="count-animate";setTimeout(()=>te.className="",300)}}});

function getFlag(c){const x=COUNTRIES.find(y=>y.code===c);return x?x.flag:"🏳️"}
function formatDist(d){return d>=1000?d.toLocaleString("en",{maximumFractionDigits:1}):d.toFixed(1)}
function formatTime(ms){const s=Math.floor(ms/1000);if(s<60)return s+"s";if(s<3600)return Math.floor(s/60)+"m "+s%60+"s";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h<24?h+"h "+m+"m":Math.floor(h/24)+"d "+(h%24)+"h"}

show("lobby");
console.log("🚀 Moon Race v7 loaded");
