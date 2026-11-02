// R.O.K. Escena 3D: solamente representacion visual de estados/eventos del backend.
// No importar motor/, no emitir dano, no actualizar logica de combate.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildArena,cellToWorld} from './arena.js';
import {preloadModel,instantiateModel,makePlaceholder,playAnimation} from './modelos.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const seconds=ms=>ms/1000;
const SIDE_COLORS={1:0x00ffe4,2:0xf79ab5};
export class Arena3D {
  constructor({mount,statusElement}){
    if(!mount)throw Error('No se encontro contenedor de arena');
    this.mount=mount;this.status=statusElement;this.entities=new Map();this.fx=[];
    this.projectiles=new Map();this.currentState=null;this.lastRevision=-1;
    this.qualityArcher=false;this.preview=true;this.alive=true;
    this.mobile=window.matchMedia('(max-width: 780px)').matches;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x081722);
    this.scene.fog=new THREE.FogExp2(0x081722,.013);
    this.camera=new THREE.PerspectiveCamera(48,1,.1,110);
    this.renderer=new THREE.WebGLRenderer({
      antialias:!this.mobile,alpha:false,powerPreference:this.mobile?'low-power':'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.mobile?1.25:1.75));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.26;
    this.mount.appendChild(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;
    this.controls.dampingFactor=.075;
    this.controls.enablePan=true;
    this.controls.minDistance=5;this.controls.maxDistance=48;
    this.controls.minPolarAngle=THREE.MathUtils.degToRad(26);
    this.controls.maxPolarAngle=THREE.MathUtils.degToRad(78);
    this.scene.add(new THREE.HemisphereLight(0xe6ffff,0x253b50,2.1));
    const sun=new THREE.DirectionalLight(0xffffff,2.15);
    sun.position.set(-5,14,7);this.scene.add(sun);
    const fill=new THREE.DirectionalLight(0x48e0ce,.65);
    fill.position.set(5,6,-6);this.scene.add(fill);
    this.root=buildArena(this.scene);
    this.labelLayer=document.createElement('div');
    this.labelLayer.className='scene-label-layer';
    this.mount.appendChild(this.labelLayer);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(this.mount);
    this.resetCamera();this.resize();
    this.prevNow=performance.now();
    this.frame=this.loop.bind(this);
    this.raf=requestAnimationFrame(this.frame);
    this.showPreview();
    preloadModel('farolera').then(()=>{
      if(!this.alive)return;
      this.setStatus('GLB Farolera cargado · cámara 3D lista');
      for(const entity of this.entities.values())this.maybeUpgrade(entity);
    }).catch(()=>{
      if(this.alive)this.setStatus('Arena 3D lista · modelo GLB no disponible, usando representación provisional');
    });
  }
  setStatus(value){if(this.status)this.status.textContent=value;}
  resetCamera(){
    this.controls.target.set(0,.4,0);
    this.camera.position.set(0,this.mobile?16:14,this.mobile?26:22);
    this.camera.fov=this.mobile?53:47;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  fullCamera(){
    this.controls.target.set(0,.35,0);
    this.camera.position.set(0,this.mobile?23:20,this.mobile?34:31);
    this.controls.update();
  }
  resize(){
    const w=Math.max(1,this.mount.clientWidth),h=Math.max(1,this.mount.clientHeight);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }
  showPreview(){
    this.preview=true;
    this.setStatus('Vista 3D de la arena · sin combate (backend no conectado)');
    this.setState({
      revision:0,status:'preview',elapsedMs:0,
      casters:[
        {id:'lioren',name:'Lioren',side:1,role:'caster',row:16,col:4,hp:14,maxHp:14},
        {id:'kasterKiaraWater',name:'Kiara',side:2,role:'caster',row:1,col:4,hp:8,maxHp:8}
      ],
      // Muestra estática del escenario y modelos, sin IA, daño ni reloj local.
      units:[
        {id:'preview-shield-ally',name:'Farolera (vista previa)',side:1,role:'summon',
          row:13,col:3,hp:7,maxHp:7,stage:'idle',visualModel:'shield',cardId:'shield'},
        {id:'preview-archer-ally',name:'Arquera (vista previa)',side:1,role:'summon',
          row:13,col:5,hp:3,maxHp:3,stage:'idle',visualModel:'archer',cardId:'archer'},
        {id:'preview-mana-enemy',name:'Farolera rival (vista previa)',side:2,role:'summon',
          row:4,col:5,hp:5,maxHp:5,stage:'idle',visualModel:'mana',cardId:'mana'}
      ],projectiles:[]
    });
  }
  resetSession(){
    this.preview=false;this.lastRevision=-1;this.currentState=null;
    for(const entity of this.entities.values())this.removeEntity(entity);
    this.entities.clear();
    for(const p of this.projectiles.values()){this.scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();}
    this.projectiles.clear();
    for(const fx of this.fx){this.scene.remove(fx.mesh);fx.mesh.geometry.dispose();fx.mesh.material.dispose();}
    this.fx.length=0;
  }
  entityInfo(unit){return unit.role==='caster'?'caster':
    unit.visualModel==='archer'?'archer':'farolera';}
  makeEntity(unit){
    const outer=new THREE.Group();this.scene.add(outer);
    const kind=this.entityInfo(unit);
    const actor=makePlaceholder(unit.side,unit.cardId||kind,unit.role);
    outer.add(actor.model);
    const label=document.createElement('div');
    label.className='scene-unit-tag '+(unit.side===1?'ally':'enemy');
    const name=document.createElement('span');name.className='unit-name';
    const bar=document.createElement('div');bar.className='scene-health';
    const fill=document.createElement('div');fill.className='scene-health-fill';
    bar.appendChild(fill);
    const amount=document.createElement('span');amount.className='scene-health-text';
    bar.appendChild(amount);label.append(name,bar);
    this.labelLayer.appendChild(label);
    const entity={id:unit.id,outer,actor,kind,side:unit.side,
      label,name,fill,amount,unit,goal:cellToWorld(unit.col,unit.row),pulse:0,spawned:performance.now()};
    entity.outer.position.copy(entity.goal);
    entity.outer.rotation.y=unit.side===1?Math.PI:0;
    this.entities.set(entity.id,entity);
    this.maybeUpgrade(entity);
    return entity;
  }
  maybeUpgrade(entity){
    if(!this.alive||entity.kind==='caster'||entity.actor.loading||!entity.actor.placeholder)return;
    const type=entity.kind==='archer'?'arquera':'farolera';
    if(type==='arquera'&&!this.qualityArcher)return;
    entity.actor.loading=true;
    instantiateModel(type,entity.side).then(newActor=>{
      if(!this.alive||!this.entities.has(entity.id))return;
      const existing=entity.actor;
      entity.outer.remove(existing.model);
      // Los meshes temporales son exclusivos de cada actor.
      existing.model.traverse(node=>{
        if(node.isMesh){node.geometry?.dispose();node.material?.dispose();}
      });
      entity.actor=newActor;entity.outer.add(newActor.model);
      playAnimation(newActor,entity.unit.stage||'idle');
    }).catch(err=>{
      entity.actor.loading=false;
      if(this.alive)this.setStatus('Modelo '+type+' no disponible · representación 3D provisional');
    });
  }
  removeEntity(entity){
    entity.label.remove();this.scene.remove(entity.outer);
    entity.actor.mixer?.stopAllAction();
    entity.actor.model.traverse(node=>{
      if(node.isMesh){
        // Evitar destruir geometrías/texturas compartidas del GLB.
        if(entity.actor.placeholder){node.geometry?.dispose();node.material?.dispose();}
        else if(node.material){
          if(Array.isArray(node.material))for(const material of node.material)material.dispose();
          else node.material.dispose();
        }
      }
    });
  }
  removeAllExcept(identifiers){
    for(const [id,entity] of this.entities)if(!identifiers.has(id)){
      this.removeEntity(entity);this.entities.delete(id);
    }
  }
  setState(next,events=[]){
    if(!next||next.revision<this.lastRevision)return;
    this.lastRevision=next.revision;this.currentState=next;
    const identities=new Set();
    for(const unit of [...(next.casters||[]),...(next.units||[])]){
      identities.add(unit.id);
      const entity=this.entities.get(unit.id)||this.makeEntity(unit);
      entity.unit=unit;entity.goal.copy(cellToWorld(unit.col,unit.row));
      entity.name.textContent=unit.name||unit.cardId||unit.id;
      entity.fill.style.width=clamp(unit.hp/unit.maxHp*100,0,100)+'%';
      entity.amount.textContent=unit.hp+' / '+unit.maxHp;
      entity.label.classList.toggle('caster',unit.role==='caster');
      if(unit.stage)playAnimation(entity.actor,unit.stage);
    }
    // Los efectos se disparan sobre entidades anteriores antes de eliminar las derrotadas.
    for(const e of events)this.handleEvent(e);
    this.removeAllExcept(identities);
    this.syncProjectiles(next.projectiles||[]);
  }
  handleEvent(event){
    if(!event||typeof event!=='object')return;
    const unit=this.entities.get(event.unitId||event.targetId);
    if(event.type==='unit.summoned'){
      const entity=this.entities.get(event.unitId);
      if(entity)this.makeRing(entity.outer.position,event.side,.65);
    }else if(event.type==='attack.preparing'){
      const entity=this.entities.get(event.unitId);
      if(entity){entity.pulse=.6;this.makeRing(entity.outer.position,entity.side,.35);}
    }else if(event.type==='unit.hit'){
      const target=this.entities.get(event.targetId);
      if(target){target.pulse=.9;this.makeRing(target.outer.position,target.side,.48,true);}
    }else if(event.type==='unit.defeated'){
      if(unit)this.makeRing(unit.outer.position,unit.side,1.0,true);
    }else if(event.type==='projectile.launched'){
      const source=this.entities.get(event.unitId);
      if(source)this.makeRing(source.outer.position,source.side,.22);
    }
  }
  makeRing(position,side,duration=0.5,hit=false){
    const mesh=new THREE.Mesh(
      new THREE.RingGeometry(.28,.40,30),new THREE.MeshBasicMaterial({
        color:hit?0xffdc79:SIDE_COLORS[side]||0xffffff,
        transparent:true,opacity:.83,depthWrite:false,side:THREE.DoubleSide
      }));
    mesh.rotation.x=-Math.PI/2;mesh.position.copy(position);mesh.position.y=.08;
    this.scene.add(mesh);
    this.fx.push({mesh,time:0,duration,hit});
  }
  syncProjectiles(list){
    const ids=new Set();
    for(const projectile of list){
      ids.add(projectile.id);
      if(this.projectiles.has(projectile.id))continue;
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(.105,9,7),
        new THREE.MeshBasicMaterial({color:projectile.side===1?0x7cf6f3:0xff83ac}));
      mesh.position.copy(cellToWorld(projectile.col,projectile.row));mesh.position.y=1.05;
      this.scene.add(mesh);
      this.projectiles.set(projectile.id,{mesh,info:projectile});
    }
    for(const [id,projectile] of this.projectiles)if(!ids.has(id)){
      this.scene.remove(projectile.mesh);projectile.mesh.geometry.dispose();
      projectile.mesh.material.dispose();this.projectiles.delete(id);
    }
  }
  async enableArcherModel(){
    if(this.mobile){this.setStatus('Modo móvil: arquera geométrica para reducir la descarga');return false;}
    this.setStatus('Cargando Arquera original (31,5 MB)…');
    try{
      await preloadModel('arquera');
      if(!this.alive)return false;
      this.qualityArcher=true;
      for(const entity of this.entities.values())if(entity.kind==='archer')this.maybeUpgrade(entity);
      this.setStatus('Arquera GLB habilitada para invocaciones futuras');
      return true;
    }catch(error){
      this.setStatus('No se pudo cargar Arquera GLB; sigue el modelo provisional');
      return false;
    }
  }
  loop(now){
    if(!this.alive)return;
    const dt=Math.min(.05,Math.max(0,(now-this.prevNow)/1000));this.prevNow=now;
    for(const entity of this.entities.values()){
      const amount=1-Math.exp(-14*dt);
      const old=entity.outer.position.clone();
      entity.outer.position.lerp(entity.goal,amount);
      const direction=entity.goal.clone().sub(old);direction.y=0;
      if(direction.lengthSq()>.00006)entity.outer.rotation.y=Math.atan2(direction.x,direction.z);
      else if(entity.unit?.targetId){
        const target=this.entities.get(entity.unit.targetId);
        if(target){
          const toward=target.outer.position.clone().sub(entity.outer.position);
          if(toward.lengthSq()>.0001){
            const desired=Math.atan2(toward.x,toward.z);
            entity.outer.rotation.y+=Math.atan2(Math.sin(desired-entity.outer.rotation.y),
              Math.cos(desired-entity.outer.rotation.y))*Math.min(1,dt*7);
          }
        }
      }
      entity.actor.mixer?.update(dt);
      const walking=entity.unit?.stage==='moving'&&direction.lengthSq()>.00006;
      if(entity.actor.placeholder){
        const bob=walking?Math.sin(now*.015+entity.side)*.055:0;
        entity.actor.model.position.y=bob;
      }
      entity.pulse=Math.max(0,entity.pulse-dt);
      entity.outer.scale.setScalar(1+entity.pulse*.06);
      const labelWorld=entity.outer.localToWorld(new THREE.Vector3(0,1.93,0));
      const projected=labelWorld.project(this.camera);
      const visible=projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<1.22&&Math.abs(projected.y)<1.28;
      entity.label.hidden=!visible;
      if(visible){
        entity.label.style.left=((projected.x*.5+.5)*100)+'%';
        entity.label.style.top=((-projected.y*.5+.5)*100)+'%';
      }
    }
    for(let i=this.fx.length-1;i>=0;i--){
      const e=this.fx[i];e.time+=dt;
      const progress=clamp(e.time/e.duration,0,1);
      e.mesh.scale.setScalar(1+progress*2.3);
      e.mesh.material.opacity=(1-progress)*.83;
      if(progress>=1){
        this.scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();
        this.fx.splice(i,1);
      }
    }
    const state=this.currentState;
    if(state){
      for(const item of this.projectiles.values()){
        const p=item.info;
        const target=this.entities.get(p.targetId);
        if(!target)continue;
        const end=target.outer.position.clone();end.y=1.05;
        const from=cellToWorld(p.col,p.row);from.y=1.05;
        const duration=Math.max(.1,p.impactAtMs-(state.elapsedMs-100));
        const progress=clamp(1-(p.impactAtMs-state.elapsedMs)/duration,0,1);
        item.mesh.position.copy(from.lerp(end,progress));
      }
    }
    this.controls.target.x=clamp(this.controls.target.x,-5,5);
    this.controls.target.z=clamp(this.controls.target.z,-10,10);
    this.controls.update();
    this.renderer.render(this.scene,this.camera);
    this.raf=requestAnimationFrame(this.frame);
  }
  dispose(){
    this.alive=false;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();
    for(const e of this.entities.values())this.removeEntity(e);
    this.entities.clear();this.controls.dispose();this.renderer.dispose();this.labelLayer.remove();
    this.renderer.domElement.remove();
  }
}
