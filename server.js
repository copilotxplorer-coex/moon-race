const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

const MOON = 384400;
const CLICK_KM = 0.1;
const INIT_BOOST = 100;
const MAX_FUEL = 100;
const FUEL_PER_CLICK = 0.8;
const FUEL_DECAY = 0.15;
const FALL_SPEED = 0.08;

const ROCKETS = {
  falcon9:   { name:"Falcon 9",   company:"SpaceX",       flag:"🇺🇸" },
  sls:       { name:"SLS",        company:"NASA",         flag:"🇺🇸" },
  new_glenn: { name:"New Glenn",  company:"Blue Origin",  flag:"🇺🇸" },
  lm5b:      { name:"LM-5B",     company:"CASC",         flag:"🇨🇳" },
  soyuz:     { name:"Soyuz",     company:"Roscosmos",    flag:"🇷🇺" },
  pslv:      { name:"PSLV",      company:"ISRO",         flag:"🇮🇳" },
  ariane6:   { name:"Ariane 6",  company:"Arianespace",  flag:"🇪🇺" },
  h3:        { name:"H3",        company:"JAXA",         flag:"🇯🇵" }
};

const DATA_DIR  = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "game_data.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`📁 Created data directory: ${DATA_DIR}`);
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const data = JSON.parse(raw);
      console.log(`💾 Loaded: ${Object.keys(data.rockets||{}).length} rockets, ${(data.stats||[]).length} landings, ${data.visitorTotal||0} visits`);
      return data;
    }
  } catch(e) { console.error("⚠️ Data load error:", e.message); }
  return { rockets: {}, stats: [], visitorTotal: 0 };
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      rockets, stats, visitorTotal: visitors.total, savedAt: new Date().toISOString()
    }, null, 2));
  } catch(e) { console.error("⚠️ Save error:", e.message); }
}

const savedData = loadData();
const rockets   = savedData.rockets || {};
const stats     = savedData.stats   || [];
const visitors  = { total: savedData.visitorTotal || 0, online: 0 };

setInterval(saveData, 30000);
process.on("SIGTERM", () => { saveData(); process.exit(0); });
process.on("SIGINT",  () => { saveData(); process.exit(0); });

function broadcastVisitors() {
  io.emit("visitors", { total: visitors.total, online: visitors.online });
}

function broadcastState(){
  const active = {};
  for(const id in rockets){ active[id] = rockets[id]; }
  io.emit("state", { rockets: active, stats });
}

setInterval(()=>{
  let changed = false;
  for(const id in rockets){
    const r = rockets[id];
    if(!r.launched || r.crashed || r.reached) continue;
    r.fuel = Math.max(0, r.fuel - FUEL_DECAY);
    if(r.fuel <= 0){
      r.distance = Math.max(0, r.distance - FALL_SPEED);
      if(r.distance <= 0){ r.crashed = true; r.crashedAt = Date.now(); changed = true; }
    }
    if(r.distance > (r.maxDistance || 0)){ r.maxDistance = r.distance; }
    if(r.distance >= MOON){
      r.distance = MOON; r.maxDistance = MOON;
      r.reached = true; r.reachedAt = Date.now();
      stats.push({
        country: r.country, code: r.code, captain: r.captain,
        rocket: ROCKETS[r.type]?.name, company: ROCKETS[r.type]?.company,
        type: r.type, time: r.reachedAt - r.launchedAt, clicks: r.clicks,
        maxDistance: MOON
      });
      io.emit("moon", { id, rocket: r });
      changed = true;
    }
  }
  if(changed) saveData();
  broadcastState();
}, 100);

io.on("connection", socket=>{
  visitors.total++; visitors.online++;
  broadcastVisitors(); saveData();

  socket.on("disconnect", ()=>{
    visitors.online = Math.max(0, visitors.online - 1);
    broadcastVisitors();
  });

  socket.emit("init", { ROCKETS, MOON });
  broadcastState();

  socket.on("launch", d=>{
    const id = "r_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);
    rockets[id] = {
      id, country:d.country, code:d.code, type:d.type,
      captain: (d.captain || "Anonymous").slice(0, 24),
      distance: INIT_BOOST, fuel: MAX_FUEL, maxDistance: INIT_BOOST,
      launched:true, crashed:false, reached:false,
      clicks:0, launchedAt:Date.now()
    };
    socket.emit("launched", { id });
    saveData();
  });

  socket.on("boost", d=>{
    const r = rockets[d.id];
    if(!r||!r.launched||r.crashed||r.reached) return;
    r.distance += CLICK_KM;
    r.fuel = Math.min(MAX_FUEL, r.fuel + FUEL_PER_CLICK);
    r.clicks++;
    if(r.distance > (r.maxDistance || 0)) r.maxDistance = r.distance;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log(`🚀  Moon Race v7 on port ${PORT} | Data: ${DATA_DIR}`));
