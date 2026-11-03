// Visual: nunca decide HP, objetivos ni resultados de combate.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
const loader=new GLTFLoader();
const GLB_ROOT='https://dtokurisu-png.github.io/rok-3d-test/';
const SOURCES=Object.freeze({
  farolera:[
    new URL('../../recursos/modelos-3d/farolera/chiara_idle.glb',import.meta.url).href,
    GLB_ROOT+'chiara_idle.glb'
  ],
  arquera:[GLB_ROOT+'ARQUERA%20DEL%20DECIERTO%20GLTF.glb']
});
const cache=new Map();
async function loadWithFallback(urls){
  let lastError;
  for(const url of urls){
    try{return await loader.loadAsync(url);}
    catch(error){lastError=error;}
  }
  throw lastError||Error('No hay modelos disponibles');
}
export async function preloadModel(type){
  if(!SOURCES[type])throw Error('Modelo no registrado: '+type);
  if(!cache.has(type))cache.set(type,loadWithFallback(SOURCES[type]).catch(e=>{
    cache.delete(type);throw e;
  }));
  return cache.get(type);
}
export function hasModel(type){return cache.has(type);}
function humanoid(color,caster=false,bow=false){
  const group=new THREE.Group();
  const material=new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.18});
  const skin=new THREE.MeshStandardMaterial({color:0xe9c39e,roughness:.84});
  const cloth=new THREE.MeshStandardMaterial({color:caster?0x364060:0x3b4d4c,roughness:.9});
  const mesh=(geo,mat,x,y,z)=>{
    const item=new THREE.Mesh(geo,mat);item.position.set(x,y,z);
    item.castShadow=true;item.receiveShadow=true;group.add(item);return item;
  };
  mesh(new THREE.CylinderGeometry(.22,.34,.80,10),material,0,.85,0);
  mesh(new THREE.SphereGeometry(.17,12,8),skin,0,1.47,0);
  mesh(new THREE.ConeGeometry(.35,.55,9),cloth,0,1.82,0);
  for(const dir of [-1,1]){
    const arm=mesh(new THREE.CapsuleGeometry(.095,.42,4,8),cloth,dir*.32,.99,0);arm.rotation.z=dir*.28;
    mesh(new THREE.CapsuleGeometry(.105,.48,4,8),material,dir*.145,.32,0);
  }
  if(caster){
    const staff=mesh(new THREE.CylinderGeometry(.025,.025,1.55,8),new THREE.MeshStandardMaterial({color:0xcbb078,metalness:.55}),.48,.78,.1);
    mesh(new THREE.IcosahedronGeometry(.13,1),new THREE.MeshStandardMaterial({color:0x5dfaf2,emissive:0x1a7e83,emissiveIntensity:.8}),.48,1.62,.1);
  }
  if(bow){
    const arc=mesh(new THREE.TorusGeometry(.43,.025,5,16,Math.PI),new THREE.MeshStandardMaterial({color:0x9a672e}),-.4,1.08,.1);
    arc.rotation.y=Math.PI/2;
  }
  return group;
}
export function makePlaceholder(side,kind,role){
  const color=side===1?0x48c9ae:0xb45e87;
  const model=humanoid(color,role==='caster',kind==='archer');
  return {model,mixer:null,actions:new Map(),placeholder:true};
}
export async function instantiateModel(type,side){
  const gltf=await preloadModel(type);
  const model=cloneSkinned(gltf.scene);
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=.001)throw Error('Modelo sin dimensiones validas');
  const scale=1.63/size.y;
  model.scale.multiplyScalar(scale);
  model.position.y=-bounds.min.y*scale;
  model.traverse(o=>{
    if(!o.isMesh)return;
    o.frustumCulled=false;
    // Cada unidad es independiente; no modificar texturas ni opacidad del GLB.
    if(Array.isArray(o.material))o.material=o.material.map(m=>m.clone());
    else if(o.material)o.material=o.material.clone();
  });
  const mixer=new THREE.AnimationMixer(model);
  const actions=new Map();
  for(const clip of gltf.animations||[]){
    const action=mixer.clipAction(clip);
    actions.set(clip.name.toLowerCase(),action);
  }
  const idle=[...actions.entries()].find(([name])=>/idle|standing/.test(name))?.[1]||
    actions.values().next().value;
  if(idle)idle.reset().play();
  return {model,mixer,actions,placeholder:false};
}
export function playAnimation(actor,stage){
  if(!actor?.mixer)return;
  const names=stage==='moving'?['walk','run']:stage==='preparing'?['attack','magic','cast','aim']:
    stage==='defeated'?['death','dying']:stage==='hit'?['react','hit']:['idle','standing'];
  const entry=[...actor.actions.entries()].find(([name])=>names.some(n=>name.includes(n)));
  if(!entry)return;
  const action=entry[1];
  if(actor.activeAction===action)return;
  if(actor.activeAction){actor.activeAction.fadeOut(.14);}
  action.reset().fadeIn(.14).play();
  actor.activeAction=action;
}
