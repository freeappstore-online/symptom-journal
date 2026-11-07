import { Color, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from "three";
import { digitLandmarks } from "./digit-landmarks";

// The MakeHuman surface has eyelids and empty sockets. The rig supplies the
// centres, and the existing lids occlude the globes to form the eye openings.
export function addAnatomyEyes(parent: Group, male: boolean): Mesh[] {
  const rig = digitLandmarks[male ? "male" : "female"];
  const radius = 0.0108;
  const eyes: Mesh[] = [];
  for (const side of ["l", "r"] as const) {
    const [x, y, z] = rig[`${side}-eye`];
    const eye = new Group();
    eye.position.set(x, y - (male ? 0.001 : 0.0005), z);
    const globe = new Mesh(
      new SphereGeometry(radius, 32, 24),
      new MeshStandardMaterial({ color: new Color(0xd7e3e7), roughness: 0.43 }),
    );
    eye.add(globe);
    const look = new Vector3(Math.sign(x) * 0.1, 0, 1).normalize();
    for (const [angle, offset, color] of [
      [0.36, 0.00006, 0x334853],
      [0.31, 0.00009, 0x617c85],
      [0.16, 0.00012, 0x19272d],
    ]) {
      const cap = new Mesh(
        new SphereGeometry(radius + offset, 32, 10, 0, Math.PI * 2, 0, angle),
        new MeshStandardMaterial({ color: new Color(color), roughness: 0.48 }),
      );
      cap.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), look);
      eye.add(cap);
    }
    parent.add(eye);
    eyes.push(globe);
  }
  return eyes;
}
