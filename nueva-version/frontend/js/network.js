import { PROTOCOL_VERSION, EVENTS } from '../../compartido/protocolo.js';
export async function connectBackend(url) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' &&
      !(endpoint.protocol === 'http:' && ['localhost','127.0.0.1'].includes(endpoint.hostname)))
    throw new Error('El backend debe utilizar HTTPS.');
  const { io } = await import('https://cdn.socket.io/4.8.1/socket.io.esm.min.js');
  const socket = io(endpoint.origin,{path:'/socket.io',transports:['websocket','polling'],
    timeout:8000,reconnection:false,autoConnect:false});
  try {
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('El servidor no respondió.')),8000);
      socket.once('connect',()=>{clearTimeout(timer);resolve();});
      socket.once('connect_error',err=>{clearTimeout(timer);reject(err);});
      socket.connect();
    });
    const reply = await socket.timeout(7000).emitWithAck(EVENTS.HELLO,{protocolVersion:PROTOCOL_VERSION});
    if (!reply?.ok || reply.serverProtocolVersion !== PROTOCOL_VERSION)
      throw new Error('Protocolo de servidor incompatible.');
    return socket;
  } catch(error) {socket.disconnect();throw error;}
}
async function query(socket,event,payload) {
  if(!socket?.connected) throw new Error('Sin conexión al servidor.');
  return socket.timeout(7000).emitWithAck(event,payload);
}
export async function createAdventureSession(socket,encounterId) {
  const reply=await query(socket,EVENTS.CREATE_SESSION,{encounterId});
  if(!reply?.ok)throw new Error(reply?.error||'No se pudo crear la sesión.');
  return reply.session;
}
export async function sendCombatAction(socket,sessionId,expectedRevision,action) {
  return query(socket,EVENTS.ACTION,{sessionId,expectedRevision,
    actionId:crypto.randomUUID(),...action});
}
export async function fetchCombatState(socket,sessionId) {
  return query(socket,EVENTS.GET_STATE,{sessionId});
}
