const express = require("express");
const http = require("http");
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

const rockets = {};
const stats   = [];

function broadcastState(){
  const active = {};
  for(const id in rockets){ active[id] = rockets[id]; }
  io.emit("state", { rockets: active, stats });
}

setInterval(()=>{
  for(const id in rockets){
    const r = rockets[id];
    if(!r.launched || r.crashed || r.reached) continue;
    r.fuel = Math.max(0, r.fuel - FUEL_DECAY);
    if(r.fuel <= 0){
      r.distance = Math.max(0, r.distance - FALL_SPEED);
      if(r.distance <= 0){ r.crashed = true; r.crashedAt = Date.now(); }
    }
    if(r.distance >= MOON){
      r.distance = MOON;
      r.reached = true;
      r.reachedAt = Date.now();
      stats.push({
        country: r.country, code: r.code, captain: r.captain,
        rocket: ROCKETS[r.type]?.name, company: ROCKETS[r.type]?.company,
        type: r.type, time: r.reachedAt - r.launchedAt, clicks: r.clicks
      });
      io.emit("moon", { id, rocket: r });
    }
  }
  broadcastState();
}, 100);

io.on("connection", socket=>{
  socket.emit("init", { ROCKETS, MOON });
  broadcastState();

  socket.on("launch", d=>{
    const id = "r_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);
    const captainName = (d.captain || "Anonymous").slice(0, 24);
    rockets[id] = {
      id, country:d.country, code:d.code, type:d.type,
      captain: captainName,
      distance: INIT_BOOST, fuel: MAX_FUEL,
      launched:true, crashed:false, reached:false,
      clicks:0, launchedAt:Date.now()
    };
    socket.emit("launched", { id });
  });

  socket.on("boost", d=>{
    const r = rockets[d.id];
    if(!r||!r.launched||r.crashed||r.reached) return;
    r.distance += CLICK_KM;
    r.fuel = Math.min(MAX_FUEL, r.fuel + FUEL_PER_CLICK);
    r.clicks++;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log(`🚀  Moon Race v4 running on port ${PORT}`));
