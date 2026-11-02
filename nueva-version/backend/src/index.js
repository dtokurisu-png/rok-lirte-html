import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { Server } from 'socket.io';
import { PROTOCOL_VERSION, EVENTS, validEncounterRequest } from '../../compartido/protocolo.js';
import { createSession, releaseSessions } from './sesiones.js';
const encounter = JSON.parse(readFileSync(new URL('../../datos/json/encuentros/kiara.json', import.meta.url), 'utf8'));
const rival = JSON.parse(readFileSync(new URL('../../datos/json/kasters/kiara.json', import.meta.url), 'utf8'));
const player = JSON.parse(readFileSync(new URL('../../datos/json/kasters/lioren.json', import.meta.url), 'utf8'));
const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.ROK_ALLOWED_ORIGIN || 'https://dtokurisu-png.github.io';
const server = createServer((request, response) => {
  if (request.method === 'GET' && new URL(request.url || '/', 'http://localhost').pathname === '/api/health') {
    response.writeHead(200, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
    response.end(JSON.stringify({ ok:true, service:'rok-backend', protocolVersion:PROTOCOL_VERSION }));
  } else { response.writeHead(404); response.end(); }
});
const io = new Server(server, {
  path:'/socket.io', cors:{origin:allowedOrigin,methods:['GET','POST']}, maxHttpBufferSize:16384
});
io.on('connection', socket => {
  socket.data.ready = false;
  socket.on(EVENTS.HELLO, (payload, ack) => {
    if (typeof ack !== 'function') return;
    const compatible = payload && typeof payload === 'object' &&
      !Array.isArray(payload) && Object.keys(payload).length === 1 &&
      payload.protocolVersion === PROTOCOL_VERSION;
    socket.data.ready = Boolean(compatible);
    ack({ ok:Boolean(compatible), serverProtocolVersion:PROTOCOL_VERSION,
      ...(!compatible ? {error:'protocol-mismatch'} : {}) });
  });
  socket.on(EVENTS.CREATE_SESSION, (payload, ack) => {
    if (typeof ack !== 'function') return;
    if (!socket.data.ready) return ack({ok:false,error:'protocol-required'});
    if (!validEncounterRequest(payload)) return ack({ok:false,error:'invalid-payload'});
    if (payload.encounterId !== encounter.id) return ack({ok:false,error:'unknown-encounter'});
    try { ack(createSession(socket.id,encounter,player,rival)); }
    catch { ack({ok:false,error:'server-error'}); }
  });
  socket.on('disconnect', () => releaseSessions(socket.id));
});
server.listen(port,'0.0.0.0',()=>console.log('[R.O.K.] Backend iniciado, puerto '+port));
