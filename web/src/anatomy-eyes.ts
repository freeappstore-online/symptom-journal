import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { digitLandmarks } from "./digit-landmarks";

// The MakeHuman surface has eyelids and empty sockets. The rig supplies the
// centres, and the existing lids occlude the globes to form the eye openings.
export function addAnatomyEyes(parent: Group, male: boolean): Mesh[] {
  const rig = digitLandmarks[male ? "male" : "female"];
  const radius = male ? 0.0106 : 0.0104;
  const eyes: Mesh[] = [];
  for (const side of ["l", "r"] as const) {
    const [x, y, z] = rig[`${side}-eye`];
    // Colour the globe itself. The lids define the opening from every angle.
    const material = new MeshStandardMaterial({ roughness: 0.64 });
    material.onBeforeCompile = shader => {
      shader.vertexShader = "varying vec3 globeDirection;\n" + shader.vertexShader.replace(
        "#include <begin_vertex>", "#include <begin_vertex>\nglobeDirection = position;",
      );
      shader.fragmentShader = "varying vec3 globeDirection;\n" + shader.fragmentShader.replace(
        "#include <color_fragment>", `
          #include <color_fragment>
          vec3 gaze = normalize(vec3(0.0, -0.035, 1.0));
          float distanceToGaze = length(normalize(globeDirection) - gaze);
          float edge = max(fwidth(distanceToGaze), 0.009);
          float iris = 1.0 - smoothstep(0.327 - edge, 0.327 + edge, distanceToGaze);
          float pupil = 1.0 - smoothstep(0.177 - edge, 0.177 + edge, distanceToGaze);
          vec3 irisColor = mix(vec3(0.094, 0.132, 0.152), vec3(0.136, 0.188, 0.214),
            1.0 - smoothstep(0.23, 0.327, distanceToGaze));
          diffuseColor.rgb *= mix(vec3(0.35, 0.46, 0.52), mix(irisColor, vec3(0.048, 0.066, 0.079), pupil), iris);
        `,
      );
    };
    const globe = new Mesh(new SphereGeometry(radius, 40, 28), material);
    if (male) globe.scale.y = 0.81;
    globe.position.set(x, y + (male ? 0.0003 : -0.0005), z - (male ? 0.0021 : 0.00065));
    parent.add(globe);
    eyes.push(globe);
  }
  return eyes;
}
