import * as THREE from './three.module.js';
import { suspension } from './ride-geometry.mjs';
import { fitCamera } from './fit-camera.mjs';

const TAU = Math.PI * 2;
const mat = (color, metalness=.4, roughness=.3, extra={}) => new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const steel = mat('#9ba8bf', .85, .24);
const darkSteel = mat('#26344a', .75, .32);
const cream = mat('#f1e1bf', .35, .34);
const red = mat('#bd263c', .55, .26);
const gold = mat('#c29a56', .75, .22);
const blue = mat('#274fbe', .55, .25);
const pink = mat('#b83b91', .5, .28);
const warm = mat('#ffd7a3',.15,.28,{emissive:'#ff9b42',emissiveIntensity:2.5});
const ice = mat('#b9eaff',.1,.3,{emissive:'#2b95ff',emissiveIntensity:2});
const neon = mat('#ff728d',.15,.28,{emissive:'#ff3159',emissiveIntensity:2});
const glass = new THREE.MeshPhysicalMaterial({color:'#8ab7cf',metalness:.2,roughness:.12,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false});
const unitBox = new THREE.BoxGeometry(1,1,1);
const unitTube = new THREE.CylinderGeometry(1,1,1,8);
const bulbGeo = new THREE.SphereGeometry(.027,6,5);

function box(parent,size,pos,material){const m=new THREE.Mesh(unitBox,material);m.scale.set(...size);m.position.set(...pos);parent.add(m);return m;}
function tube(parent,a,b,r,material=steel){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),v=end.clone().sub(start);const m=new THREE.Mesh(unitTube,material);m.scale.set(r,v.length(),r);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(m);return m;}
function ring(parent,radius,pos,material=steel,thickness=.035){const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,8,128),material);mesh.position.set(...pos);parent.add(mesh);return mesh;}
function cylinder(parent,rt,rb,h,pos,material,segments=48){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);m.position.set(...pos);parent.add(m);return m;}
function bulbs(parent,points,material=warm,size=1){const mesh=new THREE.InstancedMesh(bulbGeo,material,points.length);const matrix=new THREE.Matrix4();points.forEach((p,i)=>{matrix.makeScale(size,size,size);matrix.setPosition(...p);mesh.setMatrixAt(i,matrix)});parent.add(mesh);return mesh;}
function circlePoints(r,y,n=96,plane='xy',z=0){return Array.from({length:n},(_,i)=>{const a=i*TAU/n;return plane==='xy'?[r*Math.cos(a),y+r*Math.sin(a),z]:[r*Math.cos(a),y,r*Math.sin(a)]});}
function cabin(parent,index){
  const g=new THREE.Group();parent.add(g);
  const paint=index%3===0?red:index%3===1?blue:cream;
  tube(g,[0,0,0],[0,-.22,0],.027,steel);
  box(g,[.46,.12,.37],[0,-.76,0],paint);
  box(g,[.42,.08,.35],[0,-.26,0],paint);
  box(g,[.39,.41,.32],[0,-.5,0],glass);
  for(const x of [-.215,.215])for(const z of [-.16,.16])tube(g,[x,-.27,z],[x,-.72,z],.015,steel);
  box(g,[.31,.1,.09],[0,-.63,-.09],red);
  box(g,[.31,.1,.09],[0,-.63,.09],red);
  box(g,[.4,.025,.025],[0,-.43,.18],steel);
  box(g,[.29,.023,.024],[0,-.29,.19],warm);
  return g;
}
function wheel(){
  const root=new THREE.Group(), rotor=new THREE.Group(), cabins=[];
  const y=5.05, radius=3.85;
  for(const z of [-.57,.57]){
    for(const x of [-2.5,2.5]){
      tube(root,[x,0,z*1.6],[0,y,z],.095,cream);
      tube(root,[x,0,z*1.6],[0,y,z],.034,warm).position.z+=.11;
      box(root,[.75,.15,.7],[x,.05,z*1.6],darkSteel);
    }
    tube(root,[-1.6,1.8,z*1.4],[1.6,1.8,z*1.4],.04,steel);
  }
  tube(root,[0,y,-.9],[0,y,.9],.15,gold);
  rotor.position.y=y;root.add(rotor);
  for(const z of [-.19,.19]){
    ring(rotor,radius,[0,0,z],cream,.055);
    ring(rotor,radius-.13,[0,0,z],gold,.022);
    ring(rotor,.45,[0,0,z],red,.07);
    bulbs(rotor,circlePoints(radius,0,160,'xy',z),warm,1.55);
    for(let i=0;i<32;i++){
      const a=i*TAU/32,x=radius*Math.cos(a),yy=radius*Math.sin(a);
      tube(rotor,[0,0,z],[x,yy,z],.015,steel);
      if(i%2===0)tube(rotor,[.48*Math.cos(a+.6),.48*Math.sin(a+.6),z],[x,yy,z],.009,cream);
    }
  }
  for(let i=0;i<24;i++){
    const a=i*TAU/24,x=radius*Math.cos(a),yy=radius*Math.sin(a);
    tube(rotor,[x,yy,-.26],[x,yy,.26],.028,steel);
    const pivot=cabin(rotor,i);pivot.position.set(x,yy,0);cabins.push(pivot);
  }
  const hub=cylinder(root,.29,.29,.8,[0,y,0],red);hub.rotation.x=Math.PI/2;
  ring(root,.21,[0,y,.43],warm,.025);
  return {root,target:4.4,extent:5.7,update(t){rotor.rotation.z=t*.075;cabins.forEach(c=>c.rotation.z=-rotor.rotation.z)}};
}
function carousel(){
  const root=new THREE.Group(),rotor=new THREE.Group();
  cylinder(root,.5,.72,.35,[0,.17,0],darkSteel);
  cylinder(root,.24,.4,6.2,[0,3.3,0],gold);
  for(let i=0;i<8;i++){
    const a=i*TAU/8;
    tube(root,[.28*Math.cos(a),.45,.28*Math.sin(a)],[.28*Math.cos(a),6.3,.28*Math.sin(a)],.018,i%2?warm:cream);
  }
  const platform=cylinder(root,1.2,1.35,.16,[0,.2,0],red);
  bulbs(root,circlePoints(1.24,.3,72,'xz'),warm);
  rotor.position.y=6.25;root.add(rotor);
  for(let i=0;i<16;i++){
    const segment=new THREE.Mesh(new THREE.ConeGeometry(2.94,1.2,8,1,false,i*TAU/16,TAU/16),i%2?cream:red);
    segment.position.y=.65;rotor.add(segment);
    const a=i*TAU/16;
    tube(rotor,[0,1.25,0],[2.94*Math.cos(a),.04,2.94*Math.sin(a)],.025,gold);
  }
  cylinder(rotor,3,3.04,.2,[0,0,0],red);
  const rim=ring(rotor,3.04,[0,0,0],gold,.07);rim.rotation.x=Math.PI/2;
  const rim2=ring(rotor,2.95,[0,-.12,0],warm,.025);rim2.rotation.x=Math.PI/2;
  bulbs(rotor,circlePoints(3.05,.035,128,'xz'),warm,1.6);
  cylinder(rotor,.1,.2,.25,[0,1.4,0],gold);
  const chainLengths=[];
  for(let i=0;i<16;i++){
    const a=i*TAU/16, pose=suspension(a);
    for(const side of [-1,1]){
      const offset=pose.tangent.map(v=>v*.14*side);
      const start=pose.anchor.map((v,j)=>v+offset[j]);
      const end=pose.end.map((v,j)=>v+offset[j]);
      tube(rotor,start,end,.012,steel);
      chainLengths.push(new THREE.Vector3(...start).distanceTo(new THREE.Vector3(...end)));
    }
    const seat=new THREE.Group();seat.position.set(...pose.end);seat.rotation.y=Math.PI/2-a;rotor.add(seat);
    box(seat,[.37,.09,.36],[0,-.04,0],i%2?red:blue);
    const back=box(seat,[.37,.34,.07],[0,.12,-.15],i%2?red:blue);back.rotation.x=-.1;
    for(const x of [-.19,.19]){
      tube(seat,[x,-.05,-.17],[x,.34,-.17],.018,steel);
      tube(seat,[x,.16,-.16],[x,.16,.17],.02,steel);
    }
    tube(seat,[-.18,.2,.16],[.18,.2,.16],.02,cream);
  }
  return {root,target:3.5,extent:5,chainLengths,update(t){rotor.rotation.y=t*.48}};
}
function tower(){
  const root=new THREE.Group(),car=new THREE.Group();
  cylinder(root,1.55,1.85,.25,[0,.1,0],darkSteel,8);
  const height=10.8;
  for(const x of [-.32,.32])for(const z of [-.32,.32]){
    tube(root,[x,.2,z],[x,height,z],.05,steel);
    tube(root,[x*1.08,.2,z*1.08],[x*1.08,height,z*1.08],.014,z>0?ice:neon);
  }
  for(let y=.3;y<height;y+=.55){
    for(const z of [-.32,.32]){
      tube(root,[-.32,y,z],[.32,y+.55,z],.018,cream);
      tube(root,[.32,y,z],[-.32,y+.55,z],.018,steel);
    }
    for(const x of [-.32,.32])tube(root,[x,y,-.32],[x,y+.55,.32],.02,steel);
  }
  box(root,[1.1,.2,1.1],[0,height,0],pink);
  cylinder(root,.08,.12,.7,[0,height+.45,0],gold);
  const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;
  const ctx=signCanvas.getContext('2d');ctx.fillStyle='#111b35';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#ff9fcd';ctx.lineWidth=8;ctx.strokeRect(4,4,504,120);ctx.fillStyle='#ffecd0';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.fillText('ВІЛЬНЕ ПАДІННЯ',256,80);
  const sign=new THREE.CanvasTexture(signCanvas);sign.colorSpace=THREE.SRGBColorSpace;
  box(root,[1.75,.45,.12],[0,9.9,.42],new THREE.MeshStandardMaterial({map:sign,emissiveMap:sign,emissive:'#ffffff',emissiveIntensity:.6}));
  root.add(car);
  cylinder(car,1.22,1.3,.23,[0,0,0],pink,16);
  const carRim=ring(car,1.3,[0,-.05,0],ice,.03);carRim.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){
    const a=i*TAU/12,seat=new THREE.Group();seat.position.set(.99*Math.cos(a),.12,.99*Math.sin(a));seat.rotation.y=Math.PI/2-a;car.add(seat);
    box(seat,[.38,.1,.38],[0,0,0],pink);
    box(seat,[.38,.48,.08],[0,.24,-.12],darkSteel);
    for(const x of [-.12,.12])tube(seat,[x,.43,-.06],[x,.12,.2],.04,gold);
  }
  function elevation(t){const p=(t%13)/13;if(p<.14)return .6;if(p<.66){const u=(p-.14)/.52;return .6+8.2*(u*u*(3-2*u))}if(p<.76)return 8.8;if(p<.85){const u=(p-.76)/.09;return 8.8-8.2*u*u}if(p<.91)return .6+.25*Math.sin((p-.85)/.06*Math.PI);return .6;}
  return {root,target:5.1,extent:6.6,update(t){car.position.y=elevation(t)}};
}

function reflectionMap(renderer){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,'#8aa8cc');gradient.addColorStop(.45,'#253653');gradient.addColorStop(.5,'#11192d');gradient.addColorStop(1,'#03050d');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#fff0ce';ctx.fillRect(50,35,30,100);ctx.fillStyle='#669dff';ctx.fillRect(270,50,60,70);ctx.fillStyle='#e65c88';ctx.fillRect(420,70,25,65);
  const tex=new THREE.CanvasTexture(canvas);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromEquirectangular(tex);tex.dispose();pmrem.dispose();return env;
}
const mounted=[];
// Bake static subassemblies by material, retaining the rotating pivots.
// This avoids hundreds of individual draw calls on mobile GPUs.
function batchStatic(group){
  for(const child of [...group.children])if(child.isGroup)batchStatic(child);
  const batches=new Map();
  for(const child of [...group.children]){
    if(!child.isMesh||child.isInstancedMesh||Array.isArray(child.material))continue;
    child.updateMatrix();
    const geometry=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);
    if(!batches.has(child.material))batches.set(child.material,[]);
    batches.get(child.material).push(geometry);group.remove(child);
  }
  for(const [material,geometries] of batches){
    const merged=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']){
      if(!geometries.every(g=>g.attributes[name]))continue;
      const attributes=geometries.map(g=>g.attributes[name]);
      const data=new Float32Array(attributes.reduce((n,a)=>n+a.array.length,0));
      let offset=0;for(const attribute of attributes){data.set(attribute.array,offset);offset+=attribute.array.length;}
      merged.setAttribute(name,new THREE.BufferAttribute(data,attributes[0].itemSize));
    }
    group.add(new THREE.Mesh(merged,material));geometries.forEach(g=>g.dispose());
  }
}
function mount(id,build,hero=false){
  const host=document.getElementById(id);if(!host)return;
  try{
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:devicePixelRatio<2,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    renderer.domElement.setAttribute('aria-hidden','true');host.replaceChildren(renderer.domElement);
    const scene=new THREE.Scene();scene.environment=reflectionMap(renderer).texture;
    scene.add(new THREE.HemisphereLight('#9bbaff','#1c1325',2));
    const key=new THREE.DirectionalLight('#ffead5',4);key.position.set(-4,10,8);scene.add(key);
    const cool=new THREE.DirectionalLight('#618dff',3);cool.position.set(6,5,-4);scene.add(cool);
    const fill=new THREE.PointLight('#ff4a6d',35,20,2);fill.position.set(-5,4,4);scene.add(fill);
    const model=build();batchStatic(model.root);scene.add(model.root);
    if(model.chainLengths){host.dataset.chainLengthMin=Math.min(...model.chainLengths).toFixed(9);host.dataset.chainLengthMax=Math.max(...model.chainLengths).toFixed(9);}
    // Include the entire motion, not just the platform/cabins' initial position.
    const bounds=new THREE.Box3();
    const period=id==='swing-scene'?Math.PI*2/.48:id==='tower-scene'?13:Math.PI*2/.075;
    for(let sample=0;sample<32;sample++){
      model.update(period*sample/32);model.root.updateMatrixWorld(true);
      bounds.union(new THREE.Box3().setFromObject(model.root,true));
    }
    model.update(0);
    const camera=new THREE.PerspectiveCamera(36,1,.1,200);
    // Emphasize only the opening wheel; the gallery keeps its existing scale.
    camera.zoom=hero?1.28:1;
    const viewDirection=new THREE.Vector3(hero?8:9,2.4,hero?18:20);
    function resize(){
      const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
      renderer.setSize(width,height,false);camera.aspect=width/height;
      const framing=fitCamera(bounds,camera.aspect,viewDirection,camera.fov,hero?1.06:1.14);
      camera.position.copy(framing.position);camera.lookAt(framing.target);camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(host);resize();model.update(0);renderer.render(scene,camera);
    const state={host,renderer,scene,camera,model,visible:false};mounted.push(state);
    const observer=new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting},{rootMargin:'150px'});observer.observe(host);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();state.visible=false;});
    renderer.domElement.addEventListener('webglcontextrestored',()=>{state.visible=true;resize()});
  }catch(error){console.warn('3D preview unavailable',error);host.innerHTML='<p class="scene-fallback">Вогні ярмарку чекають. Атракціон можна побачити на місці.</p>';}
}
mount('hero-wheel',wheel,true);mount('second-wheel',wheel);mount('swing-scene',carousel);mount('tower-scene',tower);
let last=null,elapsed=0,lastRender=0;
function frame(now){
  const delta=last===null?0:Math.min((now-last)/1000,.06);last=now;
  if(!document.hidden){
    if(!document.body.classList.contains('paused'))elapsed+=delta;
    if(now-lastRender>=1000/30){
      for(const state of mounted)if(state.visible){state.model.update(elapsed);state.renderer.render(state.scene,state.camera);}
      lastRender=now;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
