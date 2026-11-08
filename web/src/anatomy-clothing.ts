import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import type { Color, Group } from "three";
// Render-only fabric adjustments leave source geometry and saved anchors intact.
export function addAnatomyClothing(material: MeshStandardMaterial, male: boolean, color: Color, trim: Color) {
  // Keep the hairline on the existing surface so scalp markings stay visible.
  const hairShape = male ? `
    float hairlineDistance(vec3 p) {
      float angle = atan(p.x, p.z - 0.028);
      float front = smoothstep(0.10, 0.95, cos(angle));
      float temple = exp(-pow(abs(abs(angle) - 0.92) / 0.28, 2.0));
      float line = mix(0.935, 0.968, front) + 0.008 * temple;
      line += front * 0.005 * sin(2.0 * angle + 0.6);
      return p.y - line;
    }
  ` : `
    float hairlineDistance(vec3 p) {
      float angle = atan(p.x, p.z - 0.023);
      float front = smoothstep(0.20, 0.90, cos(angle));
      float atEar = exp(-pow(abs(abs(angle) - 1.50) / 0.36, 2.0));
      float part = exp(-pow(abs(angle + 0.18) / 0.17, 2.0));
      float line = mix(0.910, 0.963, front) + 0.028 * atEar + 0.005 * part;
      return p.y - line;
    }
  `;
  material.onBeforeCompile = shader => {
    shader.uniforms.garmentColor = {value:color};
    shader.uniforms.garmentTrim = {value:trim};
    shader.vertexShader = `${male ? "" : "attribute vec3 fabricNormal; attribute vec3 fabricPosition;"} varying vec3 garmentPosition; varying vec3 garmentSoftNormal;\n` + shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\ngarmentPosition = position;\ngarmentSoftNormal = normalMatrix * \nGARMENT_NORMAL;");
    shader.vertexShader = shader.vertexShader.replace("GARMENT_NORMAL", male ? "normal" : "fabricNormal");
    if(!male) shader.vertexShader=shader.vertexShader.replace("garmentPosition = position;", "garmentPosition = position; transformed = fabricPosition;");
    shader.fragmentShader = hairShape + "varying vec3 garmentPosition; varying vec3 garmentSoftNormal; uniform vec3 garmentColor; uniform vec3 garmentTrim;\n" + shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float ax = abs(garmentPosition.x);
      float gy = garmentPosition.y;
      float cloth = 0.0;
      float edging = 0.0;
      ${male ? `
        cloth = step(0.41, gy) * step(gy, 0.605) * step(ax, 0.15);
        edging = step(0.594, gy) * cloth;
      ` : `
        float aa = max(0.00035, max(fwidth(gy), fwidth(ax)));
        float neckline = 0.765 + 0.043 * pow(clamp(ax / 0.079, 0.0, 1.0), 2.0);
        // The shorts wrap the full hip before narrowing at the waist and armhole.
        float sideEdge = mix(0.132, 0.106, smoothstep(0.50, 0.65, gy));
        sideEdge = mix(sideEdge, 0.074, smoothstep(0.735, 0.795, gy));
        float torso = smoothstep(0.455 - aa, 0.455 + aa, gy)
          * (1.0 - smoothstep(neckline - aa, neckline + aa, gy))
          * (1.0 - smoothstep(sideEdge - aa, sideEdge + aa, ax));
        float straps = smoothstep(0.765 - aa, 0.765 + aa, gy)
          * (1.0 - smoothstep(0.852 - aa, 0.852 + aa, gy))
          * smoothstep(0.060 - aa, 0.060 + aa, ax)
          * (1.0 - smoothstep(0.079 - aa, 0.079 + aa, ax));
        float armhole = length(vec2((ax - 0.112) / 0.052, (gy - 0.795) / 0.072));
        cloth = max(torso, straps) * smoothstep(0.96, 1.02, armhole);
        edging = torso * smoothstep(neckline - 0.0015, neckline, gy);

      `}
      diffuseColor.rgb = mix(diffuseColor.rgb, mix(garmentColor, garmentTrim, edging * 0.25), cloth);
      ${male ? `
        // Follow the existing nipple detail on the uncovered chest.
        float nippleDistance = length(vec2((ax - 0.059) / 0.0048, (gy - 0.732) / 0.004));
        float nipple = (1.0 - smoothstep(0.35, 1.0, nippleDistance)) * smoothstep(0.055, 0.07, garmentPosition.z);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.70, 0.74, 0.78), nipple);
      ` : ""}
      if (gy > 0.90) {
        float distanceToHairline = hairlineDistance(garmentPosition);
        float fade = ${male ? "0.0045" : "0.0018"};
        float edge = max(fwidth(distanceToHairline), fade);
        float coverage = smoothstep(-edge, edge, distanceToHairline);
        float angle = atan(garmentPosition.x, garmentPosition.z - 0.025);
        float flow = ${male ? "angle + 4.0 * gy" : "angle + 10.0 * (gy - 0.95) * sin(angle + 0.25)"};
        float grain = 0.5 + 0.21 * sin(19.0 * flow) + 0.12 * sin(31.0 * flow + 1.2);
        grain = mix(grain, 0.5, smoothstep(0.08, 0.33, fwidth(flow) * 19.0));
        float tone = mix(grain, smoothstep(0.94, 1.008, gy), 0.55);
        vec3 hair = mix(vec3(0.038, 0.052, 0.063), vec3(0.058, 0.075, 0.087), tone);
        diffuseColor.rgb = mix(diffuseColor.rgb, hair, coverage);
      }

    `);
    if (!male) shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      // Smooth lighting across the fabric-covered chest rather than reproducing
      // small underlying skin details. Geometry and picking remain untouched.
      normal = normalize(mix(normal, normalize(garmentSoftNormal), cloth));
    `);
  };
  material.customProgramCacheKey = () => male ? "male-anatomy-details-v2" : "female-anatomy-details-v2";
}

// Sit the tied hair against the female model's crown, behind the face and ears.
export function addFemaleHairKnot(parent: Group): Mesh {
  const knot = new Mesh(
    new SphereGeometry(1, 32, 20),
    new MeshStandardMaterial({ color: 0x3d4a53, roughness: 0.85 }),
  );
  knot.scale.set(0.020, 0.016, 0.015);
  knot.position.set(0, 0.947, -0.032);
  parent.add(knot);
  return knot;
}

// A smooth fabric surface fitted to the surrounding breast envelope, excluding
// nipple geometry. Only render attributes change; raycast and source vertices do not.
export function prepareFabricNormals(geometry: BufferGeometry) {
 const p=geometry.getAttribute("position");
 const positions=Float32Array.from(p.array);
 for(const side of [-1,1]) {
   let center=-1;
   for(let i=0;i<p.count;i++)if(p.getX(i)*side>.03&&p.getX(i)*side<.085&&p.getY(i)>.715&&p.getY(i)<.77&&(center<0||p.getZ(i)>p.getZ(center)))center=i;
   if(center<0)continue;
   const cx=p.getX(center),cy=p.getY(center),scale=.035;
   const matrix=Array.from({length:6},()=>Array(7).fill(0));
   for(let i=0;i<p.count;i++) {
     const dx=p.getX(i)-cx,dy=p.getY(i)-cy,d=Math.hypot(dx,dy);
     if(d<.018||d>.044||p.getZ(i)<.045)continue;
     const x=dx/scale,y=dy/scale,b=[1,x,y,x*x,x*y,y*y];
     for(let r=0;r<6;r++){for(let c=0;c<6;c++)matrix[r][c]+=b[r]*b[c];matrix[r][6]+=b[r]*p.getZ(i);}
   }
   // Small regularizer keeps the least-squares fit stable near mesh seams.
   for(let i=0;i<6;i++)matrix[i][i]+=.00001;
   for(let c=0;c<6;c++) {
     let pivot=c;for(let r=c+1;r<6;r++)if(Math.abs(matrix[r][c])>Math.abs(matrix[pivot][c]))pivot=r;
     [matrix[c],matrix[pivot]]=[matrix[pivot],matrix[c]];
     const divisor=matrix[c][c];if(Math.abs(divisor)<1e-12)continue;
     for(let j=c;j<7;j++)matrix[c][j]/=divisor;
     for(let r=0;r<6;r++)if(r!==c){const factor=matrix[r][c];for(let j=c;j<7;j++)matrix[r][j]-=factor*matrix[c][j];}
   }
   const a=matrix.map(row=>row[6]);
   for(let i=0;i<p.count;i++) {
     const dx=p.getX(i)-cx,dy=p.getY(i)-cy,d=Math.hypot(dx,dy);if(d>.033||p.getZ(i)<.045)continue;
     const t=Math.max(0,Math.min(1,(d-.015)/.018)),weight=1-t*t*(3-2*t),x=dx/scale,y=dy/scale;
     const z=a[0]+a[1]*x+a[2]*y+a[3]*x*x+a[4]*x*y+a[5]*y*y;
     positions[i*3+2]=p.getZ(i)*(1-weight)+z*weight;

   }
 }
 // Soften the broader chest contour without changing shoulders, back or torso width.
 for (let i = 0; i < p.count; i++) {
   const x = (Math.abs(p.getX(i)) - 0.055) / 0.047;
   const y = (p.getY(i) - 0.744) / 0.055;
   const distance = Math.min(1, x * x + y * y);
   const front = Math.max(0, Math.min(1, (p.getZ(i) - 0.038) / 0.050));
   const weight = (1 - distance) ** 2 * front ** 2 * (3 - 2 * front);
   positions[i * 3 + 1] -= 0.004 * weight;
   positions[i * 3 + 2] -= 0.007 * weight;
 }
 const fabric = new BufferGeometry();
 fabric.setIndex(geometry.index);
 fabric.setAttribute("position", new BufferAttribute(positions, 3));
 fabric.computeVertexNormals();
 geometry.setAttribute("fabricPosition", fabric.getAttribute("position"));
 geometry.setAttribute("fabricNormal", fabric.getAttribute("normal"));
 fabric.dispose();
}
