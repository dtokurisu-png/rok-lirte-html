import {PROTOCOL_VERSION,EVENTS} from '../../compartido/protocolo.js';
export async function connectBackend(url){
  const endpoint=new URL(url);
  if(endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&
    ['localhost','127.0.0.1'].includes(endpoint.hostname)))
    throw Error('El backend debe utilizar HTTPS.');
  const {io}=await import('https://cdn.socket.io/4.8.1/socket.io.esm.min.js');
  const socket=io(endpoint.origin,{path:'/socket.io',transports:['websocket','polling'],
    timeout:8000,reconnection:false,autoConnect:false});
  try{
    await new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(Error('El servidor no respondio')),8000);
      socket.once('connect',()=>{clearTimeout(t);resolve();});
      socket.once('connect_error',error=>{clearTimeout(t);reject(error);});
      socket.connect();
    });
    const ack=await socket.timeout(7000).emitWithAck(EVENTS.HELLO,{protocolVersion:PROTOCOL_VERSION});
    if(!ack?.ok||ack.serverProtocolVersion!==PROTOCOL_VERSION)throw Error('Protocolo incompatible');
    return socket;
  }catch(error){socket.disconnect();throw error;}
}
async function query(socket,event,data){
  if(!socket?.connected)throw Error('Sin conexion al servidor');
  return socket.timeout(7000).emitWithAck(event,data);
}
export async function createAdventureSession(socket,encounterId){
  const response=await query(socket,EVENTS.CREATE_SESSION,{encounterId});
  if(!response?.ok)throw Error(response?.error||'No se pudo crear combate');
  return response.session;
}
export async function summonUnit(socket,sessionId,cardId){
  return query(socket,EVENTS.ACTION,{sessionId,actionId:crypto.randomUUID(),type:'summon',cardId});
}
export async function fetchCombatState(socket,sessionId){
  return query(socket,EVENTS.GET_STATE,{sessionId});
}
export function listenCombatSync(socket,listener){socket.on(EVENTS.SYNC,listener);}
