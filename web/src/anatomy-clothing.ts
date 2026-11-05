import { BufferAttribute, type BufferGeometry } from "three";
import type { MeshStandardMaterial, Color } from "three";
// Surface material only: leaves source geometry, raycasts and saved anchors unchanged.
export function addAnatomyClothing(material: MeshStandardMaterial, male: boolean, color: Color, trim: Color) {
  material.onBeforeCompile = shader => {
    shader.uniforms.garmentColor = {value:color};
    shader.uniforms.garmentTrim = {value:trim};
    shader.vertexShader = `${male ? "" : "attribute vec3 fabricNormal; attribute vec3 fabricPosition;"} varying vec3 garmentPosition; varying vec3 garmentSoftNormal;\n` + shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\ngarmentPosition = position;\ngarmentSoftNormal = normalMatrix * \nGARMENT_NORMAL;");
    shader.vertexShader = shader.vertexShader.replace("GARMENT_NORMAL", male ? "normal" : "fabricNormal");
    if(!male) shader.vertexShader=shader.vertexShader.replace("garmentPosition = position;", "garmentPosition = position; transformed = fabricPosition;");
    shader.fragmentShader = "varying vec3 garmentPosition; varying vec3 garmentSoftNormal; uniform vec3 garmentColor; uniform vec3 garmentTrim;\n" + shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
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
        float sideEdge = mix(0.106, 0.074, smoothstep(0.735, 0.795, gy));
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
    `);
    if (!male) shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      // Smooth lighting across the fabric-covered chest rather than reproducing
      // small underlying skin details. Geometry and picking remain untouched.
      normal = normalize(mix(normal, normalize(garmentSoftNormal), cloth));
    `);
  };
  material.customProgramCacheKey = () => male ? "modest-shorts-v1" : "modest-bodysuit-v4";
}

// A smooth fabric surface fitted to the surrounding breast envelope, excluding
// nipple geometry. Only render attributes change; raycast and source vertices do not.
export function prepareFabricNormals(geometry: BufferGeometry) {
 const p=geometry.getAttribute("position"),n=geometry.getAttribute("normal");
 const positions=Float32Array.from(p.array),normals=Float32Array.from(n.array);
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
     const nx=-(a[1]+2*a[3]*x+a[4]*y)/scale,ny=-(a[2]+a[4]*x+2*a[5]*y)/scale,len=Math.hypot(nx,ny,1);
     normals[i*3]=n.getX(i)*(1-weight)+nx/len*weight;normals[i*3+1]=n.getY(i)*(1-weight)+ny/len*weight;normals[i*3+2]=n.getZ(i)*(1-weight)+1/len*weight;
   }
 }
 geometry.setAttribute("fabricPosition",new BufferAttribute(positions,3));geometry.setAttribute("fabricNormal",new BufferAttribute(normals,3));
}
