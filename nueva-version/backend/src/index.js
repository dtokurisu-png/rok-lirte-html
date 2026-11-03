import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {Server} from 'socket.io';
import {PROTOCOL_VERSION,EVENTS,validEncounterRequest,validActionRequest,validStateRequest} from '../../compartido/protocolo.js';
import {createSession,getSessionState,performSessionAction,tickSessions,releaseSessions} from './sesiones.js';
import {TICK_MS} from '../../motor/simulacion.js';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const encounter=read('../../datos/json/encuentros/kiara.json');
const player=read('../../datos/json/kasters/lioren.json');
const rival=read('../../datos/json/kasters/kiara.json');
const catalog=read('../../datos/json/invocaciones/prototipos.json').units;
const adapted=read('../../datos/json/invocaciones/legado-adaptado.json').units;
const combatCatalog=[...catalog,...adapted];
const port=Number(process.env.PORT||3001);
const allowedOrigins=(process.env.ROK_ALLOWED_ORIGIN||'https://dtokurisu-png.github.io')
  .split(',').map(s=>s.trim()).filter(Boolean);
const server=createServer((request,response)=>{
  if(request.method==='GET'&&new URL(request.url||'/','http://localhost').pathname==='/api/health'){
    response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    response.end(JSON.stringify({ok:true,service:'rok-backend',protocolVersion:PROTOCOL_VERSION,
      combat:'continuous-prototype-v1',tickMs:TICK_MS}));
  }else{response.writeHead(404);response.end();}
});
const io=new Server(server,{path:'/socket.io',cors:{origin:allowedOrigins,methods:['GET','POST']},
  maxHttpBufferSize:16384,pingTimeout:20000});
io.on('connection',socket=>{
  socket.data.ready=false;socket.data.windowStart=Date.now();socket.data.actionCount=0;
  socket.on(EVENTS.HELLO,(payload,ack)=>{
    if(typeof ack!=='function')return;
    const compatible=payload&&typeof payload==='object'&&!Array.isArray(payload)&&
      Object.keys(payload).length===1&&payload.protocolVersion===PROTOCOL_VERSION;
    socket.data.ready=Boolean(compatible);
    ack({ok:Boolean(compatible),serverProtocolVersion:PROTOCOL_VERSION,
      ...(!compatible?{error:'protocol-mismatch'}:{})});
  });
  socket.on(EVENTS.CREATE_SESSION,(payload,ack)=>{
    if(typeof ack!=='function')return;
    if(!socket.data.ready)return ack({ok:false,error:'protocol-required'});
    if(!validEncounterRequest(payload))return ack({ok:false,error:'invalid-payload'});
    if(payload.encounterId!==encounter.id)return ack({ok:false,error:'unknown-encounter'});
    try{ack(createSession(socket.id,encounter,player,rival,combatCatalog,payload.playerSpellbookCardIds));}
    catch(err){console.error('[ROK create]',err);ack({ok:false,error:'server-error'});}
  });
  socket.on(EVENTS.GET_STATE,(payload,ack)=>{
    if(typeof ack!=='function')return;
    if(!socket.data.ready)return ack({ok:false,error:'protocol-required'});
    if(!validStateRequest(payload))return ack({ok:false,error:'invalid-payload'});
    ack(getSessionState(socket.id,payload.sessionId));
  });
  socket.on(EVENTS.ACTION,(payload,ack)=>{
    if(typeof ack!=='function')return;
    if(!socket.data.ready)return ack({ok:false,error:'protocol-required'});
    if(!validActionRequest(payload))return ack({ok:false,error:'invalid-payload'});
    const now=Date.now();
    if(now-socket.data.windowStart>=1000){socket.data.windowStart=now;socket.data.actionCount=0;}
    if(++socket.data.actionCount>20)return ack({ok:false,error:'rate-limited'});
    try{ack(performSessionAction(socket.id,payload));}
    catch(err){console.error('[ROK action]',err);ack({ok:false,error:'server-error'});}
  });
  socket.on('disconnect',()=>releaseSessions(socket.id));
});
// Tiempo del juego controlado por servidor: el cliente nunca llama a advanceBattle.
// Si el proceso se suspende, el juego se pausa en vez de aplicar danos acumulados al reanudar.
setInterval(()=>{
  try{for(const update of tickSessions(TICK_MS))
    io.to(update.ownerId).emit(EVENTS.SYNC,{sessionId:update.sessionId,
      state:update.state,events:update.events});}
  catch(err){console.error('[ROK tick]',err);}
},TICK_MS);
server.listen(port,'0.0.0.0',()=>console.log('[ROK] Motor continuo en puerto '+port));
