"use client";

import { createContext, Suspense, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { BodyRegion, SceneKind } from "@/lib/types";

const ACCENT = "#3fb4a6";
const WARM = "#f4b183";

/* ───────────── The patient: a realistic, clothed 3D person, relaxed and gently breathing ───────────── */

const MODEL_URL = "/models/patient.glb"; // realistic full-body avatar in everyday clothes (Ready Player Me, from the three.js examples)
const HEIGHT = 1.72;
const OUTFIT: Record<string, string> = {
  Wolf3D_Outfit_Top: "#b9d3ea", // soft blue top
  Wolf3D_Outfit_Bottom: "#6f7f96", // slate trousers
  Wolf3D_Outfit_Footwear: "#e9e4df", // light slippers
};

/** Where each body area sits: a bone, plus an offset toward the body's surface (facing the camera). */
const ANCHORS: Record<BodyRegion, [bone: string, offset: [number, number, number]]> = {
  head: ["Head", [0, 0.1, 0.1]],
  chest: ["Spine2", [0, 0.02, 0.13]],
  heart: ["Spine2", [0.05, 0.02, 0.13]],
  "upper-abdomen": ["Spine1", [0.04, -0.02, 0.14]],
  "lower-abdomen": ["Spine", [0, -0.04, 0.15]],
  pelvis: ["Hips", [0, -0.04, 0.13]],
  back: ["Spine1", [0, 0, -0.15]],
  arm: ["LeftForeArm", [0, 0, 0.05]],
  leg: ["LeftLeg", [0, 0, 0.08]],
  "whole-body": ["Spine1", [0, 0, 0.15]],
};

/** Live positions of each body area (in the figure's space), updated every frame from the skeleton. */
type AnchorMap = Partial<Record<BodyRegion, THREE.Vector3>>;
const Anchors = createContext<AnchorMap>({});

/** Turns a bone (in world space) so that the direction to its child points along `want`. */
function aimBone(bone: THREE.Object3D, child: THREE.Object3D, want: THREE.Vector3) {
  const from = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const turn = new THREE.Quaternion().setFromUnitVectors(from, want.clone().normalize());
  const world = turn.multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
  const parent = bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(parent.multiply(world));
  bone.updateMatrixWorld(true);
}

function Human() {
  const { scene } = useGLTF(MODEL_URL);
  const anchors = useContext(Anchors);
  const root = useRef<THREE.Group>(null);

  // Each canvas gets its own copy (a skinned mesh can only live in one scene).
  // Dressed as a calm patient: hat removed, outfit replaced with soft plain clothing.
  const model = useMemo(() => {
    const m = cloneSkinned(scene);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.name ?? "";
      if (/Headwear/i.test(name)) mesh.visible = false;
      const outfit = OUTFIT[name];
      if (outfit) mesh.material = new THREE.MeshStandardMaterial({ color: outfit, roughness: 0.9 });
    });
    return m;
  }, [scene]);
  const bones = useMemo(() => {
    const map: Record<string, THREE.Object3D> = {};
    model.traverse((o) => {
      if ((o as THREE.Bone).isBone) map[o.name.replace(/^mixamorig:?/, "")] = o;
    });
    return map;
  }, [model]);

  // Relaxed standing pose: the avatar ships in a T-pose, so lower the arms to the sides.
  const rest = useMemo(() => {
    model.updateMatrixWorld(true);
    for (const [side, sign] of [["Left", 1], ["Right", -1]] as const) {
      const arm = bones[`${side}Arm`], fore = bones[`${side}ForeArm`], hand = bones[`${side}Hand`];
      if (arm && fore) aimBone(arm, fore, new THREE.Vector3(sign * 0.16, -1, 0.04));
      if (fore && hand) aimBone(fore, hand, new THREE.Vector3(sign * 0.06, -1, 0.18));
    }
    const pick = (n: string) => bones[n]?.quaternion.clone();
    return { spine: pick("Spine2"), neck: pick("Neck"), head: pick("Head") };
  }, [model, bones]);

  // Size the person from the skeleton (top of head to feet) — a skinned mesh's bounding box isn't reliable.
  const fit = useMemo(() => {
    model.updateMatrixWorld(true);
    const ys = (names: string[]) => names.map((n) => bones[n]?.getWorldPosition(new THREE.Vector3()).y).filter((v): v is number => v !== undefined);
    const top = Math.max(...ys(["HeadTop_End", "Head"]));
    const floor = Math.min(...ys(["LeftToe_End", "LeftToeBase", "LeftFoot", "RightToe_End", "RightToeBase", "RightFoot"]));
    const s = Number.isFinite(top - floor) && top > floor ? HEIGHT / (top - floor) : 1;
    return { s, y: -floor * s };
  }, [model, bones, rest]); // eslint-disable-line react-hooks/exhaustive-deps -- measure after posing

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Gentle breathing and a calm, slow head movement.
    const apply = (bone: THREE.Object3D | undefined, base: THREE.Quaternion | undefined, x: number, y: number) => {
      if (!bone || !base) return;
      bone.quaternion.copy(base).multiply(q.setFromEuler(e.set(x, y, 0)));
    };
    apply(bones.Spine2, rest.spine, Math.sin(t * 1.3) * 0.02, 0);
    apply(bones.Neck, rest.neck, Math.sin(t * 0.6) * 0.02, 0);
    apply(bones.Head, rest.head, Math.sin(t * 0.45) * 0.03, Math.sin(t * 0.3) * 0.05);

    const group = root.current;
    const parent = group?.parent;
    if (!group || !parent) return;
    group.updateWorldMatrix(true, true);
    for (const [region, [bone, [dx, dy, dz]]] of Object.entries(ANCHORS) as [BodyRegion, (typeof ANCHORS)[BodyRegion]][]) {
      const b = bones[bone];
      if (!b) continue;
      b.getWorldPosition(tmp);
      parent.worldToLocal(tmp);
      (anchors[region] ??= new THREE.Vector3()).set(tmp.x + dx, tmp.y + dy, tmp.z + dz);
    }
  });

  return (
    <group ref={root} scale={fit.s} position={[0, fit.y, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Keeps its children pinned to a body area as the person breathes and sways. */
function Follow({ region, children }: { region: BodyRegion; children: ReactNode }) {
  const anchors = useContext(Anchors);
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const v = anchors[region];
    if (ref.current && v) ref.current.position.copy(v);
  });
  return <group ref={ref}>{children}</group>;
}

/* ───────────── Calm, non-graphic effects, drawn at the body area ───────────── */

function Glow({ color = ACCENT, size = 0.06 }: { color?: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.18);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(clock.elapsedTime * 2) * 0.12;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

function Balloon() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.8) + 1) / 2;
    ref.current.scale.setScalar(0.6 + t * 0.55);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.15, 48, 48]} />
      <meshPhysicalMaterial color="#9fe3da" transmission={0.6} roughness={0.1} transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

function Scope() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.7;
    ref.current.position.set(Math.sin(t) * 0.1, Math.cos(t * 1.3) * 0.05, 0.26);
    ref.current.lookAt(ref.current.parent!.localToWorld(new THREE.Vector3(0, 0, 0)));
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.02, 0.1, 8, 16]} />
        <meshStandardMaterial color="#cfd8dc" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.2, 32, 1, true]} />
        <meshBasicMaterial color="#fff6c9" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Rings({ closing }: { closing: boolean }) {
  const offsets = useMemo(() => [[-0.06, 0.05], [0.06, 0.05], [0, -0.04], [0.08, -0.07]], []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = (clock.elapsedTime * 0.5 + i * 0.15) % 2;
      m.scale.setScalar(closing ? Math.max(0.05, 1 - Math.min(t, 1)) : Math.min(1, t * 1.5));
    });
  });
  return (
    <group>
      {offsets.map(([x, y], i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[x, y, 0.02]}>
          <torusGeometry args={[0.02, 0.006, 12, 32]} />
          <meshBasicMaterial color={closing ? "#7bd88f" : ACCENT} />
        </mesh>
      ))}
    </group>
  );
}

function Lift() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.35) % 1;
    ref.current.position.set(t * 0.3, t * 0.5, t * 0.4);
    (ref.current.material as THREE.MeshStandardMaterial).opacity = 1 - t;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 32, 32]} />
      <meshStandardMaterial color="#a8d8c8" transparent roughness={0.4} />
    </mesh>
  );
}

function Pulse() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.9) % 1;
    ref.current.scale.setScalar(0.2 + t * 1.6);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.6;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.12, 0.006, 12, 64]} />
      <meshBasicMaterial color={ACCENT} transparent />
    </mesh>
  );
}

function Zzz() {
  return (
    <group position={[0.18, 0.22, 0]}>
      {[0, 1, 2].map((i) => (
        <Float key={i} speed={1.5 + i * 0.4} floatIntensity={0.6}>
          <mesh position={[i * 0.1, i * 0.12, 0]}>
            <sphereGeometry args={[0.03 + i * 0.012, 24, 24]} />
            <meshBasicMaterial color="#b9c6f5" transparent opacity={0.85} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function House() {
  return (
    <group position={[0.8, 0, -0.4]} scale={0.8}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.5]} />
        <meshStandardMaterial color="#f6efe6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.78, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.5, 0.36, 4]} />
        <meshStandardMaterial color={WARM} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.16, 0.251]}>
        <planeGeometry args={[0.14, 0.32]} />
        <meshStandardMaterial color="#8fcfc4" />
      </mesh>
    </group>
  );
}

/* ───────────── Camera: frames the body area being explained ───────────── */

const SHOTS: Record<"face" | "torso" | "legs" | "full", { pos: [number, number, number]; look: [number, number, number] }> = {
  face: { pos: [0, 1.58, 0.95], look: [0, 1.56, 0] },
  torso: { pos: [0, 1.22, 1.9], look: [0, 1.12, 0] },
  legs: { pos: [0, 0.75, 1.9], look: [0, 0.62, 0] },
  full: { pos: [0, 0.98, 3.3], look: [0, 0.88, 0] },
};

function shotFor(scene: SceneKind, region: BodyRegion) {
  if (["welcome", "home", "recovery"].includes(scene) || region === "whole-body") return SHOTS.full;
  if (region === "head") return SHOTS.face;
  if (region === "leg") return SHOTS.legs;
  return SHOTS.torso;
}

function CameraRig({ scene, region }: { scene: SceneKind; region: BodyRegion }) {
  const camera = useThree((s) => s.camera);
  const shot = shotFor(scene, region);
  const look = useMemo(() => new THREE.Vector3(...shot.look), [shot]);
  const target = useMemo(() => new THREE.Vector3(...shot.pos), [shot]);
  const current = useRef<THREE.Vector3 | null>(null);
  useFrame((_, delta) => {
    if (!current.current) {
      // First frame: jump straight there (so still images are framed immediately).
      camera.position.copy(target);
      current.current = look.clone();
    }
    const k = 1 - Math.exp(-delta * 2.5);
    camera.position.lerp(target, k);
    current.current.lerp(look, k);
    camera.lookAt(current.current);
  });
  return null;
}

/* ───────────── Scene ───────────── */

function SceneContent({ scene, region }: { scene: SceneKind; region: BodyRegion }) {
  const anchors = useMemo<AnchorMap>(() => ({}), []);
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.3;
  });

  return (
    <Anchors value={anchors}>
      <group ref={spin}>
        <Human />
        {scene !== "home" && scene !== "sleep" && (
          <Follow region={region}>
            <Glow />
          </Follow>
        )}
        {scene === "welcome" && <Sparkles count={30} scale={[1.2, 2, 1]} position={[0, 1, 0]} size={2} color={ACCENT} speed={0.3} />}
        {scene === "sleep" && (
          <Follow region="head">
            <Zzz />
          </Follow>
        )}
        {scene === "inflate" && (
          <Follow region={region}>
            <Balloon />
          </Follow>
        )}
        {scene === "camera" && (
          <Follow region={region}>
            <Scope />
          </Follow>
        )}
        {(scene === "entry" || scene === "close") && (
          <Follow region={region}>
            <Rings closing={scene === "close"} />
          </Follow>
        )}
        {scene === "repair" && (
          <Follow region={region}>
            <Sparkles count={40} scale={0.3} size={3} color="#7bd88f" speed={0.6} />
          </Follow>
        )}
        {scene === "remove" && (
          <Follow region={region}>
            <Lift />
          </Follow>
        )}
        {scene === "monitor" && (
          <Follow region="heart">
            <Pulse />
          </Follow>
        )}
        {scene === "recovery" && <Sparkles count={50} scale={[1.4, 2.2, 1]} position={[0, 1, 0]} size={2.5} color={WARM} speed={0.25} />}
      </group>
      {scene === "home" && <House />}
    </Anchors>
  );
}

function Stage({ scene, region }: { scene: SceneKind; region: BodyRegion }) {
  const night = scene === "sleep";
  return (
    <>
      <CameraRig scene={scene} region={region} />
      <hemisphereLight args={[night ? "#c9d4ff" : "#fff6ee", "#d8c7c0", night ? 0.55 : 0.9]} />
      <directionalLight position={[2, 3, 2.5]} intensity={night ? 0.7 : 1.6} color={night ? "#c9d4ff" : "#fff4e8"} />
      <directionalLight position={[-2, 1.5, -1]} intensity={0.5} color="#bfe9e3" />
      <SceneContent scene={scene} region={region} />
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={3} blur={2.5} far={1.5} />
    </>
  );
}

useGLTF.preload(MODEL_URL);

const CAMERA = { position: SHOTS.full.pos, fov: 36 };

export default function Scene3D({ scene, region }: { scene: SceneKind; region: BodyRegion }) {
  return (
    <Canvas camera={CAMERA} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <Suspense fallback={null}>
        <Stage scene={scene} region={region} />
      </Suspense>
    </Canvas>
  );
}

/** Waits a few frames for the scene to settle, then reports it as a JPEG. */
function Capture({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(({ gl }) => {
    if (done.current || ++frames.current < 20) return;
    done.current = true;
    onCapture(gl.domElement.toDataURL("image/jpeg", 0.86));
  });
  return null;
}

/**
 * Renders one still illustration per step (the "Images" output), reusing a single WebGL
 * context for the whole sequence. Pictures come from the same safe scene library, so they
 * can never be graphic.
 */
export function SceneSnapshots({
  items,
  onShot,
}: {
  items: { scene: SceneKind; region: BodyRegion }[];
  onShot: (index: number, dataUrl: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  if (!item) return null;
  return (
    <Canvas
      camera={CAMERA}
      dpr={1}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: 720, height: 540 }}
    >
      <color attach="background" args={[item.scene === "sleep" ? "#dfe3f5" : "#eaf3ef"]} />
      {/* Capture sits inside the same Suspense, so it only starts counting once the person has loaded. */}
      <Suspense fallback={null}>
        <Stage key={`stage-${index}`} scene={item.scene} region={item.region} />
        <Capture
          key={`capture-${index}`}
          onCapture={(url) => {
            onShot(index, url);
            setIndex((i) => i + 1);
          }}
        />
      </Suspense>
    </Canvas>
  );
}
