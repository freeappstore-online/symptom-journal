import { GestureGuide } from "./GestureGuide";
import { addAnatomyClothing, prepareFabricNormals } from "./anatomy-clothing";
import { BodyOrientation } from "./BodyOrientation";
import { bodyOrientation, type BodyOrientation as Orientation } from "./orientation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  MODEL_ID,
  MALE_MODEL_ID,
  type SurfaceModel,
  type Anchor,
  type Surface3D,
  type Vec3,
} from "./anatomy";
import { Modal } from "@freeappstore/sdk/ui";
import { buttonSecondary } from "./ui";
const modelCache = new Map<string, Promise<THREE.Group>>();
function model(url: string) {
  let pending = modelCache.get(url);
  if (!pending) {
    pending = new GLTFLoader()
      .loadAsync(url)
      .then((g) => g.scene)
      .catch((e) => {
        modelCache.delete(url);
        throw e;
      });
    modelCache.set(url, pending);
  }
  return pending;
}
type Props = {
  heatMetric?: "density" | "intensity";
  historyMarks?: {anchor: Anchor; score: number}[];
  model?: SurfaceModel;
  surface?: Surface3D;
  onPick?: (anchor: Anchor) => void;
  focus?: Anchor;
  readOnly?: boolean;
  reference?: boolean;
};
function CanvasSurface(props: Props) {
  const modelId = props.surface?.model ?? props.model ?? MODEL_ID;
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    view: (v: string) => void;
    zoom: (factor: number) => void;
    pan: (direction: number) => void;
    paint: () => void;
  } | null>(null);
  const current = useRef(props);
  current.current = props;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [help,setHelp] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>("front");
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      setStatus("error");
      return;
    }
    let disposed = false;
    renderer.localClippingEnabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "block h-full w-full touch-none";
    renderer.domElement.setAttribute(
      "aria-label",
      props.reference
        ? "Rotatable right-knee bone reference"
        : `Rotatable adult ${modelId === MALE_MODEL_ID ? "male" : "female"} body. Use the region list if you cannot use the model.`,
    );
    renderer.domElement.setAttribute("role", "img");
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.002, 10);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.touches.ONE = THREE.TOUCH.PAN;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    renderer.domElement.style.touchAction = "none";
    controls.rotateSpeed = 0.65;
    controls.minDistance = 0.045;
    controls.maxDistance = 2.8;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI - 0.12;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x667780, 2.4));
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(0.6, 1, 1.5);
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xffffff, 1.2);
    fill.position.set(-1, 0.5, -1);
    scene.add(fill);
    const content = new THREE.Group();
    scene.add(content);
    const overlay = new THREE.Group();
    scene.add(overlay);
    const targets: THREE.Mesh[] = [];
    const draw = () => {
      if (!disposed) {
        renderer.render(scene, camera);
        if (!props.reference) setOrientation(bodyOrientation(
          camera.matrixWorld.elements[0], camera.position.clone().sub(controls.target),
        ));
      }
    };
    const vec = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);
    const cameraReset = () => {
      const f = current.current.focus;
      const target = f ? vec(f.position) : new THREE.Vector3(0, 0.5, 0);
      controls.target.copy(target);
      const n = f ? vec(f.normal) : new THREE.Vector3(0, 0, 1);
      n.y = Math.max(-0.4, Math.min(0.4, n.y));
      n.normalize();
      camera.position
        .copy(target)
        .addScaledVector(n, f?.position ? 0.34 : 1.98);
      controls.update();
      draw();
    };
    function clearOverlay() {
      for (const c of [...overlay.children]) {
        overlay.remove(c);
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      }
    }
    function paint() {
      clearOverlay();
      const s = current.current.surface;
      if (current.current.historyMarks?.length && !props.reference) {
        // Bin nearby observations to bound CPU work while preserving count and mean score.
        const bins=new Map<string,{position:THREE.Vector3;normal:THREE.Vector3;count:number;sum:number}>();
        for(const mark of current.current.historyMarks) {
          const p=mark.anchor.position,n=mark.anchor.normal;
          const key=[p.x,p.y,p.z,n.x,n.y,n.z].map((v,i)=>Math.round(v*(i<3?80:2))).join(":");
          const bin=bins.get(key);
          if(bin){bin.count++;bin.sum+=mark.score;}else bins.set(key,{position:vec(p),normal:vec(n),count:1,sum:mark.score});
        }
        const samples=[...bins.values()].sort((a,b)=>b.count-a.count).slice(0,512);
        const peakCount=Math.max(1,...samples.map(b=>b.count));
        for(const mesh of targets) {
          const geometry=mesh.geometry.clone();
          const positions=geometry.getAttribute("fabricPosition")??geometry.getAttribute("position");
          const normals=geometry.getAttribute("fabricNormal")??geometry.getAttribute("normal");
          const colors=new Float32Array(positions.count*3), strength=new Float32Array(positions.count);
          const p=new THREE.Vector3(),n=new THREE.Vector3(),color=new THREE.Color();
          for(let i=0;i<positions.count;i++) {
            p.fromBufferAttribute(positions,i);n.fromBufferAttribute(normals,i);
            let weight=0,weightedScore=0;
            for(const sample of samples) {
              if(n.dot(sample.normal)<0.2)continue;
              const d=p.distanceToSquared(sample.position), radius=0.035;
              if(d>radius*radius*4)continue;
              const w=Math.exp(-d/(2*radius*radius))*sample.count;
              weight+=w;weightedScore+=w*sample.sum/sample.count;
            }
            const value=current.current.heatMetric==="density"?Math.min(1,weight/peakCount):weight?weightedScore/weight/10:0;
            color.setHSL((1-value)*0.65,0.9,0.5);
            colors.set([color.r,color.g,color.b],i*3);strength[i]=Math.min(0.85,weight*0.8);
          }
          geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
          geometry.setAttribute("heatAlpha",new THREE.BufferAttribute(strength,1));
          const material=new THREE.ShaderMaterial({vertexShader:`attribute vec3 color; attribute float heatAlpha; varying vec3 heatColor; varying float heatOpacity;
            void main(){heatColor=color;heatOpacity=heatAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*0.0015,1.0);}`,
            fragmentShader:`varying vec3 heatColor; varying float heatOpacity; void main(){if(heatOpacity<0.025)discard;gl_FragColor=vec4(heatColor,heatOpacity);#include <colorspace_fragment>\n}`.replace(";#include",";\n#include"),transparent:true,depthWrite:false});
          overlay.add(new THREE.Mesh(geometry,material));
        }
        draw();return;
      }
      if (!s || props.reference) {
        draw();
        return;
      }
      const css = getComputedStyle(el!);
      for (const mesh of targets)
        (mesh.material as THREE.MeshStandardMaterial).color.set(
          css
            .getPropertyValue(props.reference ? "--anatomy-line" : "--anatomy")
            .trim(),
        );
      if (s.area) {
        for (const mesh of targets) {
          const material = new THREE.ShaderMaterial({
            uniforms: {
              origin: { value: vec(s.area.position) },
              direction: { value: vec(s.area.normal) },
              radius: { value: s.radius },
              tint: {
                value: new THREE.Color(css.getPropertyValue("--sky").trim()),
              },
            },
            vertexShader: `varying vec3 surfacePosition; varying vec3 surfaceNormal;
            void main() { surfacePosition = position; surfaceNormal = normal;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * 0.0006, 1.0); }`,
            fragmentShader: `uniform vec3 origin; uniform vec3 direction; uniform float radius; uniform vec3 tint;
            varying vec3 surfacePosition; varying vec3 surfaceNormal;
            void main() { float d = distance(surfacePosition, origin);
              if (d > radius || dot(normalize(surfaceNormal), direction) < 0.05) discard;
              gl_FragColor = vec4(tint, 0.65 * (1.0 - smoothstep(radius * 0.82, radius, d)));
              #include <colorspace_fragment>
            }`,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          overlay.add(new THREE.Mesh(mesh.geometry.clone(), material));
        }
      }
      const anchor = s.point ?? (!s.area ? s.focus : undefined);
      if (anchor) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(s.point ? 0.0035 : 0.003, 16, 12),
          new THREE.MeshBasicMaterial({
            color: css.getPropertyValue(s.point ? "--pain" : "--accent").trim(),
          }),
        );
        dot.position
          .copy(vec(anchor.position))
          .addScaledVector(vec(anchor.normal), 0.002);
        overlay.add(dot);
      }
      draw();
    }
    api.current = {
      view: (v) => {
        if (v === "reset") {
          cameraReset();
          return;
        }
        const dir =
          v === "front"
            ? new THREE.Vector3(0, 0, 1)
            : v === "back"
              ? new THREE.Vector3(0, 0, -1)
              : v === "left"
                ? new THREE.Vector3(1, 0, 0)
                : new THREE.Vector3(-1, 0, 0);
        const distance = camera.position.distanceTo(controls.target);
        camera.position.copy(controls.target).addScaledVector(dir, distance);
        controls.update();
        draw();
      },
      zoom: (f) => {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(
          THREE.MathUtils.clamp(
            offset.length() * f,
            controls.minDistance,
            controls.maxDistance,
          ),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
        draw();
      },
      pan: (direction) => {
        const distance = camera.position.distanceTo(controls.target);
        const next = THREE.MathUtils.clamp(controls.target.y + direction * distance * 0.16, 0.02, 0.98);
        camera.position.y += next - controls.target.y;
        controls.target.y = next;
        controls.update(); draw();
      },
      paint,
    };
    const resize = new ResizeObserver(() => {
      if (disposed) return;
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    });
    resize.observe(el);
    const theme = new MutationObserver(() => paint());
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const ray = new THREE.Raycaster();
    let start = { x: 0, y: 0 };
    let pointers = 0;
    let multiple = false;
    const down = (e: PointerEvent) => {
      pointers++;
      if (pointers > 1) multiple = true;
      else {
        start = { x: e.clientX, y: e.clientY };
        multiple = false;
      }
      controls.enabled = true;
    };
    const up = (e: PointerEvent) => {
      pointers = Math.max(0, pointers - 1);
      if (
        multiple ||
        current.current.readOnly ||
        props.reference ||
        Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7
      )
        return;
      const b = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - b.left) / b.width) * 2 - 1,
          (-(e.clientY - b.top) / b.height) * 2 + 1,
        ),
        camera,
      );
      const hit = ray.intersectObjects(targets, false)[0];
      if (!hit?.face) return;
      const normal = hit.face.normal
        .clone()
        .transformDirection(hit.object.matrixWorld);
      current.current.onPick?.({
        position: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
        normal: { x: normal.x, y: normal.y, z: normal.z },
      });
    };
    const cancel = () => {
      pointers = 0;
      multiple = true;
    };
    renderer.domElement.addEventListener("pointerdown", down, true);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    controls.addEventListener("change", draw);
    const url = props.reference
      ? "/anatomy/right-knee-bones-v1.glb"
      : modelId === MALE_MODEL_ID
        ? "/anatomy/adult-male-v1.glb"
        : "/anatomy/adult-female-v1.glb";
    model(url)
      .then((source) => {
        if (disposed) return;
        const object = source.clone(true);
        object.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            c.geometry = c.geometry.clone();
            c.geometry.computeVertexNormals();
            if (!props.reference && modelId !== MALE_MODEL_ID) prepareFabricNormals(c.geometry);
            const css = getComputedStyle(el);
            c.material = new THREE.MeshStandardMaterial({
              color: css
                .getPropertyValue(
                  props.reference ? "--anatomy-line" : "--anatomy",
                )
                .trim(),
              roughness: 0.78,
              metalness: 0,
              side: THREE.DoubleSide,
              ...(props.reference
                ? {
                    clippingPlanes: [
                      new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.12),
                      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.88),
                    ],
                  }
                : {}),
            });
            if (!props.reference) addAnatomyClothing(
              c.material as THREE.MeshStandardMaterial,
              modelId === MALE_MODEL_ID,
              new THREE.Color(css.getPropertyValue("--garment").trim()),
              new THREE.Color(css.getPropertyValue("--garment-trim").trim()),
            );
            targets.push(c);
          }
        });
        content.add(object);
        cameraReset();
        paint();
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    cameraReset();
    return () => {
      disposed = true;
      api.current = null;
      resize.disconnect();
      theme.disconnect();
      controls.dispose();
      clearOverlay();
      content.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.removeEventListener("pointerdown", down, true);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.remove();
    };
  }, [attempt, props.reference, modelId]);
  useEffect(() => { api.current?.paint(); }, [props.surface, props.historyMarks, props.heatMetric]);
  useEffect(() => { api.current?.view("reset"); }, [props.focus]);
  return (
    <div className="space-y-3">
      <Modal open={help} onClose={()=>setHelp(false)} title="Explore the body map" maxWidth={420}><GestureGuide/><button type="button" className={`${buttonSecondary} mt-4 w-full`} onClick={()=>setHelp(false)}>Got it</button></Modal>
      <div className="relative overflow-hidden rounded-3xl bg-sky-soft">
        <div
          ref={host}
          className={`${props.historyMarks ? "h-[65dvh] min-h-96" : props.readOnly ? "h-64" : props.focus ? "h-[72dvh] min-h-96" : "h-[76dvh] min-h-96"} w-full`}
        />
        {status === "ready" && !props.reference && <BodyOrientation view={orientation} />}
        <button type="button" aria-label="Open body map gesture guide" title="Gesture guide" className="absolute bottom-3 left-3 z-10 flex size-11 items-center justify-center rounded-full bg-panel text-lg font-bold text-accent shadow-sm print:hidden" onClick={()=>setHelp(true)}>?</button>
        {status === "ready" && <div role="group" aria-label="Move and zoom body map" className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3 print:hidden">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-panel shadow-sm">
            <button type="button" title="Move view up" aria-label="Move view up" className="flex size-11 items-center justify-center text-xl font-bold text-accent hover:bg-accent-soft" onClick={()=>api.current?.pan(1)}>↑</button>
            <button type="button" title="Move view down" aria-label="Move view down" className="flex size-11 items-center justify-center text-xl font-bold text-accent hover:bg-accent-soft" onClick={()=>api.current?.pan(-1)}>↓</button>
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-panel shadow-sm">
            <button type="button" title="Zoom in" aria-label="Zoom in" className="flex size-11 items-center justify-center text-2xl font-semibold text-accent hover:bg-accent-soft" onClick={()=>api.current?.zoom(0.8)}>+</button>
            <button type="button" title="Zoom out" aria-label="Zoom out" className="flex size-11 items-center justify-center text-2xl font-semibold text-accent hover:bg-accent-soft" onClick={()=>api.current?.zoom(1.25)}>−</button>
          </div>
        </div>}

        {status !== "ready" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sky-soft p-4 text-center text-sm"
            role="status"
          >
            {status === "loading"
              ? "Loading body…"
              : "3D is unavailable. You can keep a region without a mark."}
            {status === "error" && (
              <button
                className={buttonSecondary}
                onClick={() => {
                  setStatus("loading");
                  setAttempt((a) => a + 1);
                }}
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2 print:hidden" aria-label="Body view controls">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">View
            <select aria-label="Body view" className="min-h-11 rounded-xl bg-panel px-3" value={orientation === "front" || orientation === "back" ? orientation : ""} onChange={e=>api.current?.view(e.target.value)}>
              <option value="" disabled>Angled view</option><option value="front">Front</option><option value="back">Back</option><option value="left">Left side</option><option value="right">Right side</option>
            </select>
          </label>
          <button type="button" className="min-h-11 px-3 text-sm font-semibold text-accent" onClick={()=>api.current?.view("reset")}>Reset view</button>
        </div>
      </div>
    </div>
  );
}

export default function AnatomyCanvas(props: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <button
        type="button"
        className="min-h-11 px-1 text-sm font-semibold text-accent underline underline-offset-4 print:hidden"
        onClick={() => setExpanded(true)}
      >
        Expand view
      </button>
      {expanded ? (
        <Modal
          open
          onClose={() => setExpanded(false)}
          title={props.reference ? "Right knee bones" : "Body map"}
          maxWidth={680}
        >
          <>
            {props.reference && (
              <p className="mb-3 text-xs text-muted">
                Adult male reference · Not aligned to the surface model
              </p>
            )}
            <CanvasSurface {...props} />
          </>
        </Modal>
      ) : (
        <CanvasSurface {...props} />
      )}
    </>
  );
}
