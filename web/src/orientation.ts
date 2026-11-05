// Coordinates use the patient's left as +X. Camera-right X determines which
// patient side points toward the right edge, including oblique/rolled views.
export type BodyOrientation = "front" | "back" | "left" | "right" | "top" | "bottom";
export function bodyOrientation(rightX: number, offset: { x: number; y: number; z: number }): BodyOrientation {
  const horizontal = Math.hypot(offset.x, offset.z);
  if (horizontal < Math.abs(offset.y) * 0.2) return offset.y >= 0 ? "top" : "bottom";
  if (Math.abs(rightX) < 0.3) return offset.x >= 0 ? "left" : "right";
  return rightX > 0 ? "front" : "back";
}
