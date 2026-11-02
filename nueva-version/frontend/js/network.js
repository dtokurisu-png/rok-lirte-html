import { PROTOCOL_VERSION, EVENTS } from '../../compartido/protocolo.js';
export async function connectBackend(url) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost','127.0.0.1'].includes(endpoint.hostname))) throw new Error('El backend debe utilizar HTTPS.');
  const { io } = await import('https://cdn.socket.io/4.8.1/socket.io.esm.min.js');
  const socket = io(endpoint.origin, { path:'/socket.io', transports:['websocket','polling'], timeout:8000, reconnection:false, autoConnect:false });
  try {
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('El servidor no respondió.')),8000);
      socket.once('connect',()=>{clearTimeout(timer);resolve();});
      socket.once('connect_error',err=>{clearTimeout(timer);reject(err);});
      socket.connect();
    });
    const reply = await socket.timeout(7000).emitWithAck(EVENTS.HELLO,{protocolVersion:PROTOCOL_VERSION});
    if (!reply?.ok || reply.serverProtocolVersion !== PROTOCOL_VERSION) throw new Error('Versión de protocolo incompatible.');
    return socket;
  } catch(error) { socket.disconnect(); throw error; }
}
export async function createAdventureSession(socket,encounterId) {
  if (!socket?.connected) throw new Error('No hay conexión con el servidor.');
  const result=await socket.timeout(7000).emitWithAck(EVENTS.CREATE_SESSION,{encounterId});
  if (!result?.ok) throw new Error(result?.error||'No se pudo crear la sesión.');
  return result.session;
}
