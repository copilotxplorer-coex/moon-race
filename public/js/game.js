/* ═══════════════════════════════════════════════
   MOON RACE v4 — Clean White + Captain + Flags
   ═══════════════════════════════════════════════ */
const socket = io();
const MOON = 384400;

const COUNTRIES = [
  {code:"TH",name:"Thailand",flag:"🇹🇭"},{code:"US",name:"USA",flag:"🇺🇸"},
  {code:"CN",name:"China",flag:"🇨🇳"},{code:"RU",name:"Russia",flag:"🇷🇺"},
  {code:"JP",name:"Japan",flag:"🇯🇵"},{code:"KR",name:"Korea",flag:"🇰🇷"},
  {code:"IN",name:"India",flag:"🇮🇳"},{code:"GB",name:"UK",flag:"🇬🇧"},
  {code:"FR",name:"France",flag:"🇫🇷"},{code:"DE",name:"Germany",flag:"🇩🇪"},
  {code:"IT",name:"Italy",flag:"🇮🇹"},{code:"BR",name:"Brazil",flag:"🇧🇷"},
  {code:"AU",name:"Australia",flag:"🇦🇺"},{code:"CA",name:"Canada",flag:"🇨🇦"},
  {code:"MX",name:"Mexico",flag:"🇲🇽"},{code:"AE",name:"UAE",flag:"🇦🇪"},
  {code:"SA",name:"Saudi",flag:"🇸🇦"},{code:"SG",name:"Singapore",flag:"🇸🇬"},
  {code:"MY",name:"Malaysia",flag:"🇲🇾"},{code:"ID",name:"Indonesia",flag:"🇮🇩"},
  {code:"VN",name:"Vietnam",flag:"🇻🇳"},{code:"PH",name:"Philippines",flag:"🇵🇭"},
  {code:"SE",name:"Sweden",flag:"🇸🇪"},{code:"IL",name:"Israel",flag:"🇮🇱"},
  {code:"EU",name:"EU",flag:"🇪🇺"},{code:"ES",name:"Spain",flag:"🇪🇸"},
  {code:"NL",name:"Netherlands",flag:"🇳🇱"},{code:"PL",name:"Poland",flag:"🇵🇱"},
  {code:"TR",name:"Türkiye",flag:"🇹🇷"},{code:"AR",name:"Argentina",flag:"🇦🇷"},
  {code:"NZ",name:"New Zealand",flag:"🇳🇿"},{code:"ZA",name:"South Africa",flag:"🇿🇦"}
];

const ROCKET_META = {
  falcon9:{name:"Falcon 9",company:"SpaceX",origin:"🇺🇸",emoji:"🚀",color:"#4fc3f7"},
  sls:{name:"SLS",company:"NASA",origin:"🇺🇸",emoji:"🛸",color:"#ff8a65"},
  new_glenn:{name:"New Glenn",company:"Blue Origin",origin:"🇺🇸",emoji:"🚀",color:"#81d4fa"},
  lm5b:{name:"LM-5B",company:"CASC",origin:"🇨🇳",emoji:"🚀",color:"#ef5350"},
  soyuz:{name:"Soyuz",company:"Roscosmos",origin:"🇷🇺",emoji:"🚀",color:"#66bb6a"},
  pslv:{name:"PSLV",company:"ISRO",origin:"🇮🇳",emoji:"🚀",color:"#ffa726"},
  ariane6:{name:"Ariane 6",company:"Arianespace",origin:"🇪🇺",emoji:"🚀",color:"#ab47bc"},
  h3:{name:"H3",company:"JAXA",origin:"🇯🇵",emoji:"🚀",color:"#ec407a"}
};

let selectedCountry=null, selectedRocket=null, currentRocketId=null;
let gameState={rockets:{},stats:[]};
let podiumIds=[null,null,null];

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const screens={lobby:$("#screen-lobby"),flight:$("#screen-flight"),dashboard:$("#screen-dashboard"),stats:$("#screen-stats")};

const rocketImages={};
Object.keys(ROCKET_META).forEach(k=>{
  const img=new Image();img.src=`/assets/rockets/${k}.png`;
  img.onerror=()=>{rocketImages[k]=null};img.onload=()=>{rocketImages[k]=img};
  rocketImages[k]=null;
});

/* ═══ MOTION PHYSICS ═══ */
const rocketMotion={};
function getMotion(id){
  if(!rocketMotion[id]) rocketMotion[id]={
    swayPhase:Math.random()*Math.PI*2,swaySpeed:0.008+Math.random()*0.006,swayAmp:15+Math.random()*10,
    bobPhase:Math.random()*Math.PI*2,bobSpeed:0.012+Math.random()*0.008,bobAmp:6+Math.random()*4,
    vibeIntensity:0,tilt:0,tiltTarget:0,boostKick:0,fallWobblePhase:0
  };
  return rocketMotion[id];
}
function updateMotion(id,rocket,dt){
  const m=getMotion(id);
  const hasFuel=rocket.fuel>0&&!rocket.crashed&&!rocket.reached;
  const isFalling=rocket.fuel<=0&&!rocket.crashed&&!rocket.reached;
  m.swayPhase+=m.swaySpeed*dt;
  const swayMult=hasFuel?1.0:(isFalling?2.5:0.3);
  const swayX=Math.sin(m.swayPhase)*m.swayAmp*swayMult;
  m.bobPhase+=m.bobSpeed*dt;
  const bobMult=hasFuel?1.0:(isFalling?0.3:0.1);
  const bobY=Math.sin(m.bobPhase)*m.bobAmp*bobMult;
  const targetVibe=hasFuel?(1.5+rocket.fuel*0.03):0;
  m.vibeIntensity+=(targetVibe-m.vibeIntensity)*0.1;
  const vibeX=(Math.random()-0.5)*m.vibeIntensity*2;
  const vibeY=(Math.random()-0.5)*m.vibeIntensity*2;
  m.tiltTarget=Math.cos(m.swayPhase)*(hasFuel?3:(isFalling?8:1))*(Math.PI/180);
  m.tilt+=(m.tiltTarget-m.tilt)*0.05;
  if(isFalling){m.fallWobblePhase+=0.04*dt;m.tilt+=Math.sin(m.fallWobblePhase*3)*6*(Math.PI/180);}
  m.boostKick*=0.88;
  return {offsetX:swayX+vibeX,offsetY:bobY+vibeY-m.boostKick,rotation:m.tilt,vibeIntensity:m.vibeIntensity};
}
function triggerBoostKick(id){getMotion(id).boostKick=12+Math.random()*6;}

/* ═══ NAVIGATION ═══ */
function showScreen(name){
  Object.values(screens).forEach(s=>s.classList.remove("active"));
  $$(".nav-btn").forEach(b=>b.classList.remove("active"));
  if(screens[name]) screens[name].classList.add("active");
  const btn=$(`.nav-btn[data-screen="${name}"]`);if(btn) btn.classList.add("active");
  if(name==="flight") startCanvasLoop(); else stopCanvasLoop();
}
$$(".nav-btn").forEach(b=>b.addEventListener("click",()=>showScreen(b.dataset.screen)));
$("#btn-back-dash").addEventListener("click",()=>showScreen("dashboard"));

/* ═══ LOBBY BUILD ═══ */
(function buildLobby(){
  const cg=$("#country-grid");
  COUNTRIES.forEach(c=>{
    const el=document.createElement("div");
    el.className="country-card";
    el.innerHTML=`<span class="country-flag">${c.flag}</span><span class="country-name">${c.name}</span>`;
    el.addEventListener("click",()=>{
      $$(".country-card").forEach(x=>x.classList.remove("selected"));
      el.classList.add("selected");
      selectedCountry=c;
      // Update preview
      const pv=$("#selected-country-preview");
      pv.classList.remove("hidden");
      pv.innerHTML=`<span class="scp-flag">${c.flag}</span><span class="scp-name">${c.name}</span>`;
      updateLaunchBtn();
    });
    cg.appendChild(el);
  });

  const rg=$("#rocket-grid");
  Object.entries(ROCKET_META).forEach(([key,r])=>{
    const el=document.createElement("div");
    el.className="rocket-card";
    el.innerHTML=`
      <div class="rocket-thumb" id="rthumb-${key}">${r.emoji}</div>
      <div class="rocket-info">
        <h3><span class="rocket-origin-flag">${r.origin}</span>${r.name}</h3>
        <p>${r.company}</p>
      </div>`;
    el.addEventListener("click",()=>{
      $$(".rocket-card").forEach(x=>x.classList.remove("selected"));
      el.classList.add("selected");
      selectedRocket=key;
      updateLaunchBtn();
    });
    rg.appendChild(el);
  });

  setTimeout(()=>{
    Object.entries(rocketImages).forEach(([k,img])=>{
      if(img){const th=$(`#rthumb-${k}`);if(th) th.innerHTML=`<img src="/assets/rockets/${k}.png" alt="${k}"/>`;}
    });
  },1500);
})();

function getCaptainName(){
  return ($("#captain-name").value||"").trim() || "Anonymous";
}

function updateLaunchBtn(){
  const btn=$("#btn-launch"),sum=$("#launch-summary");
  if(selectedCountry&&selectedRocket){
    btn.disabled=false;
    const r=ROCKET_META[selectedRocket];
    const cap=getCaptainName();
    sum.classList.remove("hidden");
    sum.innerHTML=`${selectedCountry.flag} <strong>${selectedCountry.name}</strong> · <strong>${r.origin} ${r.name}</strong> · Cpt. <strong>${cap}</strong>`;
  } else {btn.disabled=true;sum.classList.add("hidden");}
}
$("#captain-name").addEventListener("input", updateLaunchBtn);

/* ═══ COUNTDOWN ═══ */
let countdownActive=false, pendingLaunchData=null;
function startCountdown(){
  if(countdownActive) return;
  countdownActive=true;
  const overlay=$("#countdown-overlay"),numEl=$("#cd-number"),labelEl=$("#cd-label"),barEl=$("#cd-bar"),rktEl=$("#cd-rocket"),smokeEl=$("#cd-smoke"),capEl=$("#cd-captain");
  overlay.classList.remove("hidden");
  numEl.className="countdown-number";rktEl.className="countdown-rocket";smokeEl.className="countdown-smoke";
  barEl.style.width="0%";labelEl.textContent="LAUNCH SEQUENCE INITIATED";labelEl.style.color="";
  capEl.textContent=`Captain ${getCaptainName()} — ${selectedCountry.flag} ${selectedCountry.name}`;
  const rMeta=ROCKET_META[selectedRocket]||{};
  rktEl.textContent=rMeta.emoji||"🚀";
  let count=5;numEl.textContent=count;
  setTimeout(()=>{barEl.style.width="100%"},50);
  const interval=setInterval(()=>{
    count--;
    if(count>0){
      numEl.textContent=count;numEl.className="countdown-number";void numEl.offsetWidth;
      rktEl.style.animationDuration=(0.15-count*0.015)+"s";
      if(count<=2){labelEl.textContent="ENGINES AT FULL POWER";labelEl.style.color="#f97316";}
    } else {
      clearInterval(interval);
      numEl.textContent="LIFTOFF!";numEl.className="countdown-number go";
      labelEl.textContent="🔥 ALL ENGINES NOMINAL 🔥";labelEl.style.color="#10b981";
      rktEl.classList.add("liftoff");smokeEl.classList.add("active");
      socket.emit("launch",pendingLaunchData);
      setTimeout(()=>{overlay.classList.add("hidden");countdownActive=false;},1200);
    }
  },1000);
}

$("#btn-launch").addEventListener("click",()=>{
  if(!selectedCountry||!selectedRocket) return;
  pendingLaunchData={
    country:selectedCountry.name,code:selectedCountry.code,
    type:selectedRocket,captain:getCaptainName()
  };
  startCountdown();
});
socket.on("launched",d=>{
  currentRocketId=d.id;
  const wait=countdownActive?800:0;
  setTimeout(()=>showScreen("flight"),wait);
});

/* ═══ CANVAS ═══ */
const canvas=$("#flight-canvas"),ctx=canvas.getContext("2d");
let animId=null,stars=[],particles=[],starOffset=0,clicksInWindow=[];
let frameTime=0,lastFrameTime=performance.now();
let speedLines=[];

function resizeCanvas(){canvas.width=canvas.parentElement.clientWidth;canvas.height=canvas.parentElement.clientHeight;if(!stars.length) initStars();}
window.addEventListener("resize",resizeCanvas);

function initStars(){stars=[];for(let i=0;i<300;i++) stars.push({x:Math.random()*2000,y:Math.random()*2000,s:Math.random()*2+0.3,tw:Math.random()*Math.PI*2,sp:0.005+Math.random()*0.03});}
function spawnParticles(x,y,n,intensity){const sp=intensity||1;for(let i=0;i<n;i++) particles.push({x:x+(Math.random()-0.5)*14*sp,y,vx:(Math.random()-0.5)*3*sp,vy:Math.random()*4*sp+2,life:1,decay:0.012+Math.random()*0.02,size:Math.random()*5*sp+2});}
function drawParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;p.size*=0.97;if(p.life<=0){particles.splice(i,1);continue;}const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);g.addColorStop(0,`rgba(255,220,80,${p.life})`);g.addColorStop(0.4,`rgba(255,160,30,${p.life*0.7})`);g.addColorStop(0.7,`rgba(255,80,10,${p.life*0.4})`);g.addColorStop(1,"rgba(255,40,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}}
function drawStars(){const w=canvas.width,h=canvas.height;stars.forEach(s=>{s.tw+=s.sp;const a=0.3+Math.sin(s.tw)*0.7;const yy=((s.y+starOffset*0.5)%(h+100))-50;const xx=s.x%(w+100)-50;ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.beginPath();ctx.arc(xx,yy,s.s,0,Math.PI*2);ctx.fill();});}

function drawRocketSprite(cx,cy,rocketKey,countryFlag,rotation){
  const img=rocketImages[rocketKey],rH=120,rW=40;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation||0);
  if(img){ctx.drawImage(img,-rW/2,-rH/2,rW,rH);}
  else{
    const meta=ROCKET_META[rocketKey]||{color:"#ccc"};
    ctx.fillStyle="#d0d0d8";ctx.beginPath();ctx.moveTo(0,-rH/2);ctx.quadraticCurveTo(rW/2,-rH/3,rW/2-4,rH/3);ctx.lineTo(-rW/2+4,rH/3);ctx.quadraticCurveTo(-rW/2,-rH/3,0,-rH/2);ctx.fill();ctx.strokeStyle=meta.color;ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=meta.color;ctx.beginPath();ctx.moveTo(0,-rH/2-5);ctx.lineTo(10,-rH/2+15);ctx.lineTo(-10,-rH/2+15);ctx.closePath();ctx.fill();
    ctx.fillStyle=meta.color;ctx.beginPath();ctx.moveTo(-rW/2+4,rH/3-5);ctx.lineTo(-rW/2-8,rH/3+15);ctx.lineTo(-rW/2+4,rH/3+5);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(rW/2-4,rH/3-5);ctx.lineTo(rW/2+8,rH/3+15);ctx.lineTo(rW/2-4,rH/3+5);ctx.closePath();ctx.fill();
    ctx.fillStyle="#5cf";ctx.beginPath();ctx.arc(0,-rH/4,5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  ctx.font="22px serif";ctx.textAlign="center";ctx.fillText(countryFlag,cx,cy-70);
}

function drawEarth(distance){const w=canvas.width,h=canvas.height,maxR=Math.max(w,h)*0.6,t=Math.min(1,distance/5000),r=maxR*(1-t*0.85);if(r<5) return;const yy=h+r*0.6+t*200;const g=ctx.createRadialGradient(w/2,yy,r*0.2,w/2,yy,r);g.addColorStop(0,"#2a8fd4");g.addColorStop(0.5,"#1b6baa");g.addColorStop(0.8,"#0d3f6e");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(w/2,yy,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(100,200,255,0.15)";ctx.lineWidth=r*0.08;ctx.beginPath();ctx.arc(w/2,yy,r+r*0.04,0,Math.PI*2);ctx.stroke();}
function drawMoon(distance){const w=canvas.width,h=canvas.height;if(distance<MOON*0.3) return;const t=(distance-MOON*0.3)/(MOON*0.7),r=8+t*250,yy=-r*0.5+t*r*0.8;const g=ctx.createRadialGradient(w/2-r*0.15,yy-r*0.15,r*0.1,w/2,yy,r);g.addColorStop(0,"#e8e8e0");g.addColorStop(0.7,"#b0b0a0");g.addColorStop(1,"#888878");ctx.fillStyle=g;ctx.beginPath();ctx.arc(w/2,yy,r,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(0,0,0,0.1)";ctx.beginPath();ctx.arc(w/2-r*0.25,yy-r*0.15,r*0.12,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(w/2+r*0.3,yy+r*0.2,r*0.08,0,Math.PI*2);ctx.fill();}

function updateSpeedLines(hasFuel){const w=canvas.width,h=canvas.height;if(hasFuel&&Math.random()<0.3) speedLines.push({x:Math.random()*w,y:-10,len:20+Math.random()*40,speed:8+Math.random()*12,alpha:0.2+Math.random()*0.3});for(let i=speedLines.length-1;i>=0;i--){const l=speedLines[i];l.y+=l.speed;if(l.y>h+50){speedLines.splice(i,1);continue;}ctx.strokeStyle=`rgba(150,200,255,${l.alpha})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x,l.y-l.len);ctx.stroke();}}

function renderFlight(){
  const now=performance.now(),dt=Math.min(now-lastFrameTime,50);lastFrameTime=now;frameTime+=dt;
  const w=canvas.width,h=canvas.height;
  const r=gameState.rockets[currentRocketId];if(!r) return;
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#000008");bg.addColorStop(1,"#080820");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const hasFuel=r.fuel>0&&!r.crashed&&!r.reached;
  if(hasFuel) starOffset+=0.8;
  drawStars();updateSpeedLines(hasFuel);drawEarth(r.distance);drawMoon(r.distance);
  const motion=updateMotion(currentRocketId,r,dt*0.06);
  const rx=w/2+motion.offsetX,ry=h/2+motion.offsetY;
  drawRocketSprite(rx,ry,r.type,getFlag(r.code),motion.rotation);
  if(hasFuel){const ex=rx-Math.sin(motion.rotation)*55,ey=ry+Math.cos(motion.rotation)*55;spawnParticles(ex,ey,4,0.8+r.fuel*0.02);
    const glowR=20+Math.random()*15+r.fuel*0.2,gx=rx-Math.sin(motion.rotation)*60,gy=ry+Math.cos(motion.rotation)*60;
    const glow=ctx.createRadialGradient(gx,gy,0,gx,gy,glowR);glow.addColorStop(0,"rgba(255,200,50,0.25)");glow.addColorStop(0.5,"rgba(255,100,20,0.1)");glow.addColorStop(1,"rgba(255,50,0,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(gx,gy,glowR,0,Math.PI*2);ctx.fill();}
  drawParticles();
  if(r.crashed){ctx.fillStyle="rgba(255,0,0,0.15)";ctx.fillRect(0,0,w,h);ctx.font="bold 28px Orbitron";ctx.textAlign="center";ctx.fillStyle="#ff4466";ctx.fillText("💥 CRASHED",w/2,h/2-80);ctx.font="14px Inter";ctx.fillStyle="#aaa";ctx.fillText("Return to lobby to relaunch",w/2,h/2-55);}
  if(r.reached){ctx.fillStyle="rgba(0,230,118,0.08)";ctx.fillRect(0,0,w,h);ctx.font="bold 28px Orbitron";ctx.textAlign="center";ctx.fillStyle="#00e676";ctx.fillText("🌕 MOON REACHED!",w/2,h/2-80);}
  updateHUD(r);
}

function updateHUD(r){
  const meta=ROCKET_META[r.type]||{},flag=getFlag(r.code);
  $("#hud-captain").textContent="Cpt. "+(r.captain||"Anonymous");
  $("#hud-country").textContent=flag+" "+r.country;
  $("#hud-rocket").textContent=meta.name||r.type;
  $("#hud-dist").textContent=formatDist(r.distance);
  $("#hud-progress").style.width=(r.distance/MOON*100)+"%";
  const fp=Math.round(r.fuel);
  $("#hud-fuel").style.width=fp+"%";$("#hud-fuel-pct").textContent=fp+"%";
  $("#hud-fuel").className="fuel-fill"+(fp<25?" danger":fp<50?" warn":"");
  $("#hud-clicks").textContent="Clicks: "+r.clicks;
  const now=Date.now();clicksInWindow=clicksInWindow.filter(t=>now-t<5000);
  const cps=clicksInWindow.length/5,kps=cps*0.1,remaining=MOON-r.distance;
  if(remaining<=0){$("#hud-eta").textContent="🌕 Arrived!";$("#hud-eta").style.color="#10b981";}
  else if(kps>0){const sec=remaining/kps;
    if(sec<3600) $("#hud-eta").textContent=`ETA: ${Math.ceil(sec/60)} min`;
    else if(sec<86400) $("#hud-eta").textContent=`ETA: ${(sec/3600).toFixed(1)} hrs`;
    else $("#hud-eta").textContent=`ETA: ${(sec/86400).toFixed(1)} days`;
    $("#hud-eta").style.color=r.fuel>25?"#2563eb":"#ef4444";
  } else {
    $("#hud-eta").textContent=r.fuel>0?"⚡ Click to boost!":"⚠️ OUT OF FUEL!";
    $("#hud-eta").style.color=r.fuel>0?"#6b7084":"#ef4444";
  }
}

let loopRunning=false;
function startCanvasLoop(){if(loopRunning) return;loopRunning=true;lastFrameTime=performance.now();resizeCanvas();(function loop(){if(!loopRunning) return;renderFlight();animId=requestAnimationFrame(loop)})();}
function stopCanvasLoop(){loopRunning=false;if(animId) cancelAnimationFrame(animId);}

/* Click boost (flight) */
$("#click-zone").addEventListener("click",e=>{
  if(!currentRocketId) return;const r=gameState.rockets[currentRocketId];if(!r||r.crashed||r.reached) return;
  socket.emit("boost",{id:currentRocketId});clicksInWindow.push(Date.now());triggerBoostKick(currentRocketId);
  const fx=$("#boost-fx");fx.style.left=e.clientX+"px";fx.style.top=e.clientY+"px";
  fx.textContent="+0.1";fx.style.opacity=1;fx.style.transform="translateY(0)";
  requestAnimationFrame(()=>{fx.style.transition="all 0.6s";fx.style.opacity=0;fx.style.transform="translateY(-40px)";setTimeout(()=>{fx.style.transition="none"},600);});
});

/* ═══ PODIUM ═══ */
function renderPodium(sortedIds,rockets){
  const podiumEl=$("#podium"),podiumEmpty=$("#podium-empty");
  if(!sortedIds.length){podiumEl.classList.add("hidden");podiumEmpty.style.display="block";podiumIds=[null,null,null];return;}
  podiumEl.classList.remove("hidden");podiumEmpty.style.display="none";
  const top=sortedIds.slice(0,3);podiumIds=[top[0]||null,top[1]||null,top[2]||null];
  for(let i=0;i<3;i++){
    const rank=i+1,id=top[i]||null,slotEl=$(`#podium-${rank}`);
    if(!id){slotEl.style.visibility="hidden";continue;}
    slotEl.style.visibility="visible";
    const r=rockets[id],meta=ROCKET_META[r.type]||{},flag=getFlag(r.code),fp=Math.round(r.fuel);
    const visualEl=$(`#podium-visual-${rank}`);
    if(rocketImages[r.type]) visualEl.innerHTML=`<img src="/assets/rockets/${r.type}.png" alt="${meta.name}"/>`;
    else visualEl.textContent=meta.emoji||"🚀";
    $(`#podium-flag-${rank}`).textContent=flag;
    $(`#podium-info-${rank}`).innerHTML=`<span class="pcaptain">Cpt. ${r.captain||"Anonymous"}</span><span class="pcountry">${r.country}</span><span class="procket">${meta.origin} ${meta.name} · ${meta.company}</span>`;
    $(`#podium-dist-${rank}`).innerHTML=`${formatDist(r.distance)} <small>km</small>`;
    const ff=$(`#podium-fuel-${rank}`);ff.style.width=fp+"%";ff.className="podium-fuel-fill"+(fp<25?" danger":fp<50?" warn":"");
    $(`#podium-fuel-pct-${rank}`).textContent=fp+"%";
    const bb=$(`#podium-boost-${rank}`);
    if(r.crashed){bb.disabled=true;bb.textContent="💥 CRASHED";}
    else if(r.reached){bb.disabled=true;bb.textContent="🌕 LANDED!";}
    else{bb.disabled=false;bb.textContent="⚡ BOOST +0.1 km";}
  }
}

[1,2,3].forEach(rank=>{
  $(`#podium-boost-${rank}`).addEventListener("click",e=>{
    e.stopPropagation();const id=podiumIds[rank-1];if(!id) return;
    const r=gameState.rockets[id];if(!r||r.crashed||r.reached) return;
    socket.emit("boost",{id});
    const btn=$(`#podium-boost-${rank}`);btn.classList.remove("ripple");void btn.offsetWidth;btn.classList.add("ripple");setTimeout(()=>btn.classList.remove("ripple"),400);
  });
  $(`#podium-${rank}`).addEventListener("click",e=>{
    if(e.target.closest(".podium-boost-btn")) return;
    const id=podiumIds[rank-1];if(!id) return;currentRocketId=id;showScreen("flight");
  });
});

/* ═══ DASHBOARD ═══ */
function renderDashboard(){
  const rockets=gameState.rockets;
  const ids=Object.keys(rockets).sort((a,b)=>rockets[b].distance-rockets[a].distance);
  renderPodium(ids,rockets);
  const container=$("#dash-rockets");container.innerHTML="";
  ids.forEach((id,idx)=>{
    const r=rockets[id],meta=ROCKET_META[r.type]||{},flag=getFlag(r.code);
    const pct=Math.sqrt(r.distance/MOON)*100;
    const status=r.reached?"reached":r.crashed?"crashed":"flying";
    const statusLabel=r.reached?"✅ LANDED":r.crashed?"💥 CRASHED":"🛰️ FLYING";
    const rankBadge=idx<3?["🥇","🥈","🥉"][idx]:`#${idx+1}`;
    const row=document.createElement("div");row.className=`dash-rocket-row ${status}`;
    row.innerHTML=`
      <span style="font-size:1rem;width:28px;text-align:center">${rankBadge}</span>
      <span class="dr-flag">${flag}</span>
      <div class="dr-info">
        <h4>${r.country} — ${meta.origin} ${meta.name||r.type}</h4>
        <div class="dr-captain">Cpt. ${r.captain||"Anonymous"}</div>
        <p>${meta.company||""}</p>
      </div>
      <div class="dr-track"><div class="dr-track-fill" style="width:${pct}%"></div><span class="dr-track-icon" style="left:${Math.min(pct,98)}%">🚀</span></div>
      <div class="dr-dist">${formatDist(r.distance)}</div>
      <div class="dr-status ${status}">${statusLabel}</div>`;
    row.addEventListener("click",()=>{currentRocketId=id;showScreen("flight")});
    container.appendChild(row);
  });
}

/* ═══ STATS ═══ */
function renderStats(){
  const el=$("#stats-content"),st=gameState.stats;
  if(!st||!st.length){el.innerHTML='<p class="stats-empty">No successful landings yet.</p>';return;}
  let html=`<table class="stats-table"><thead><tr><th>#</th><th>CAPTAIN</th><th>COUNTRY</th><th>ROCKET</th><th>COMPANY</th><th>CLICKS</th><th>TIME</th></tr></thead><tbody>`;
  st.forEach((s,i)=>{
    const flag=getFlag(s.code);
    html+=`<tr>
      <td>${i+1}</td>
      <td><strong>${s.captain||"Anonymous"}</strong></td>
      <td><span class="stats-flag">${flag}</span>${s.country}</td>
      <td>${s.rocket||s.type}</td>
      <td>${s.company||"—"}</td>
      <td>${(s.clicks||0).toLocaleString()}</td>
      <td>${s.time?formatTime(s.time):"—"}</td>
    </tr>`;
  });
  html+=`</tbody></table>`;el.innerHTML=html;
}

/* ═══ SOCKET ═══ */
socket.on("state",data=>{gameState=data;renderDashboard();renderStats();});
socket.on("moon",data=>{
  const r=data.rocket,meta=ROCKET_META[r.type]||{},flag=getFlag(r.code);
  const dur=r.reachedAt&&r.launchedAt?formatTime(r.reachedAt-r.launchedAt):"—";
  $("#modal-details").innerHTML=`
    <p style="font-size:2.5rem;margin:12px 0">${flag}</p>
    <p><strong>Captain ${r.captain||"Anonymous"}</strong></p>
    <p><strong>${r.country}</strong> reached the Moon!</p>
    <p>Rocket: <strong>${meta.origin} ${meta.name||r.type}</strong> (${meta.company||""})</p>
    <p>Total Clicks: <strong>${(r.clicks||0).toLocaleString()}</strong></p>
    <p>Time: <strong>${dur}</strong></p>`;
  $("#modal-moon").classList.remove("hidden");
});
$("#btn-modal-close").addEventListener("click",()=>$("#modal-moon").classList.add("hidden"));

/* ═══ HELPERS ═══ */
function getFlag(code){const c=COUNTRIES.find(x=>x.code===code);return c?c.flag:"🏳️";}
function formatDist(d){if(d>=1000) return d.toLocaleString("en",{maximumFractionDigits:1});return d.toFixed(1);}
function formatTime(ms){const s=Math.floor(ms/1000);if(s<60) return s+"s";if(s<3600) return Math.floor(s/60)+"m "+s%60+"s";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);if(h<24) return h+"h "+m+"m";return Math.floor(h/24)+"d "+(h%24)+"h";}

showScreen("lobby");
console.log("🚀 Moon Race v4 loaded");
