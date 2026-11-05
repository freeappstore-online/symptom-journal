import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyOrientation } from "../web/src/orientation.ts";
test("patient orientation swaps front/back labels and identifies side and pole views", () => {
  assert.equal(bodyOrientation(1, { x: 0, y: 0, z: 2 }), "front");
  assert.equal(bodyOrientation(-1, { x: 0, y: 0, z: -2 }), "back");
  assert.equal(bodyOrientation(0, { x: 2, y: 0, z: 0 }), "left");
  assert.equal(bodyOrientation(0, { x: -2, y: 0, z: 0 }), "right");
  assert.equal(bodyOrientation(1, { x: 0, y: 2, z: 0 }), "top");
  assert.equal(bodyOrientation(1, { x: 0, y: -2, z: 0 }), "bottom");
  assert.equal(bodyOrientation(0.7, { x: 1, y: 0, z: 1 }), "front");
  assert.equal(bodyOrientation(-0.7, { x: 1, y: 0, z: -1 }), "back");
});
