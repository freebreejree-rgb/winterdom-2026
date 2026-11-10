import * as THREE from './three.module.js';

// Fit every corner of the animation envelope, accounting for perspective
// depth and the viewport's narrower dimension. Padding stays inside the canvas.
export function fitCamera(bounds, aspect, direction, fov=36, padding=1.14) {
  const target=bounds.getCenter(new THREE.Vector3());
  const forward=direction.clone().normalize();
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),forward).normalize();
  const up=new THREE.Vector3().crossVectors(forward,right).normalize();
  const tanY=Math.tan(THREE.MathUtils.degToRad(fov/2)),tanX=tanY*aspect;
  let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const offset=new THREE.Vector3(x,y,z).sub(target);
    distance=Math.max(distance,offset.dot(forward)+padding*Math.max(Math.abs(offset.dot(right))/tanX,Math.abs(offset.dot(up))/tanY));
  }
  return {target,position:target.clone().addScaledVector(forward,distance+.1)};
}
