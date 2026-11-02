// Tablero del tester adaptado como geometria VISUAL (sin reglas de combate).
import * as THREE from 'three';
export const BOARD_COLUMNS=9,BOARD_ROWS=18;
export function cellToWorld(col,row){return new THREE.Vector3(col-4,0,row-8.5);}
export function buildArena(scene){
  const root=new THREE.Group();scene.add(root);
  const W=BOARD_COLUMNS,D=BOARD_ROWS;
  const base=new THREE.Mesh(new THREE.BoxGeometry(W+.5,.22,D+.5),
    new THREE.MeshStandardMaterial({color:0x162b33,roughness:.86,metalness:.12}));
  base.position.y=-.15;root.add(base);
  const geometry=new THREE.PlaneGeometry(.986,.986);
  const tiles=new THREE.InstancedMesh(geometry,
    new THREE.MeshStandardMaterial({roughness:.98,side:THREE.DoubleSide}),W*D);
  tiles.rotation.x=-Math.PI/2;tiles.position.y=.014;
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let row=0;row<D;row++)for(let col=0;col<W;col++){
    const idx=row*W+col;
    dummy.position.set(col-4,8.5-row,0);dummy.updateMatrix();
    tiles.setMatrixAt(idx,dummy.matrix);
    color.setHex(row<9?((idx%2)?0x304853:0x263f4e):((idx%2)?0x254842:0x1a3d3f));
    tiles.setColorAt(idx,color);
  }
  tiles.instanceMatrix.needsUpdate=true;
  if(tiles.instanceColor)tiles.instanceColor.needsUpdate=true;
  root.add(tiles);

  // Arte original R.O.K. independiente de la cuadricula.
  const image=new URL('../../recursos/escenarios/arena.webp',import.meta.url);
  const art=new THREE.Mesh(new THREE.PlaneGeometry(W,D),
    new THREE.MeshBasicMaterial({transparent:true,opacity:.27,
      depthWrite:false,side:THREE.DoubleSide}));
  art.rotation.x=-Math.PI/2;art.position.y=.021;
  art.scale.set(1.80,1.25,1); // ancho y largo independientes como en el tester.
  root.add(art);
  const texLoader=new THREE.TextureLoader();
  let artRequest=0;
  // El escenario real lo decide la selección existente de Aventura, no una arena fija.
  root.userData.setArenaArt=(url)=>{
    const requested=++artRequest;
    const nextUrl=typeof url==='string' && url ? url : image.href;
    texLoader.load(nextUrl,texture=>{
      if(requested!==artRequest){texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;
      const previous=art.material.map;
      art.material.map=texture;art.material.needsUpdate=true;
      art.visible=true;
      if(previous && previous!==texture)previous.dispose();
    },undefined,()=>{
      if(requested===artRequest)art.visible=Boolean(art.material.map);
    });
  };
  root.userData.setArenaArt(image.href);
  const points=[];
  for(let i=0;i<=W;i++){
    const x=i-W/2;points.push(x,.045,-D/2,x,.045,D/2);
  }
  for(let i=0;i<=D;i++){
    const z=i-D/2;points.push(-W/2,.045,z,W/2,.045,z);
  }
  const lines=new THREE.BufferGeometry();
  lines.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  root.add(new THREE.LineSegments(lines,
    new THREE.LineBasicMaterial({color:0x59c7bf,transparent:true,opacity:.55})));
  const center=new THREE.Mesh(new THREE.BoxGeometry(W,.04,.06),
    new THREE.MeshBasicMaterial({color:0xf0e7b5,transparent:true,opacity:.8}));
  center.position.y=.055;root.add(center);
  const rails=new THREE.MeshStandardMaterial({color:0x3c8687,roughness:.85});
  for(const z of [-9.04,9.04]){
    const edge=new THREE.Mesh(new THREE.BoxGeometry(W+.14,.10,.08),rails);
    edge.position.set(0,.03,z);root.add(edge);
  }
  for(const x of [-4.54,4.54]){
    const edge=new THREE.Mesh(new THREE.BoxGeometry(.08,.10,D+.14),rails);
    edge.position.set(x,.03,0);root.add(edge);
  }
  const markerGeometry=new THREE.RingGeometry(.28,.37,32);
  for(const row of [0,17])for(const col of [2,3,4,5]){
    const marker=new THREE.Mesh(markerGeometry,new THREE.MeshBasicMaterial({
      color:row===17?0x00ffe4:0xef84a2,transparent:true,opacity:.43,
      side:THREE.DoubleSide,depthWrite:false}));
    marker.rotation.x=-Math.PI/2;marker.position.copy(cellToWorld(col,row));
    marker.position.y=.061;root.add(marker);
  }
  return root;
}
