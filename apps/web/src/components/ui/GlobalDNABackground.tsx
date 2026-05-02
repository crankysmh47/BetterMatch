'use client';

import { useRef, useMemo, useLayoutEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

const NUM_PAIRS = 52;
const RADIUS = 1.82;
const HEIGHT_SCALE = 0.37;
const ROTATION_STEP = 0.38;
const SPAWN_DELAY = 0.42;
const ASSEMBLY_DURATION = 3.9;
const STREAM_STAGGER = 0.7;

const AMBIENT_COUNT = 340;
const AMBIENT_RADIUS_X = 34;
const AMBIENT_RADIUS_Y = 19;
const AMBIENT_RADIUS_Z = 27;

/** Extra vivid hues beyond A/T/G/C for floating debris */
const AMBIENT_PALETTE_HEX = [
  '#4ade80',
  '#22d3ee',
  '#f472b6',
  '#facc15',
  '#c084fc',
  '#fb7185',
  '#38bdf8',
  '#a3e635',
  '#f97316',
  '#e879f9',
  '#2dd4bf',
  '#fbbf24',
  '#34d399',
  '#818cf8',
  '#f87171',
  '#fcd34d',
  '#86efac',
  '#ec4899',
] as const;

/** Repeats along the helix — Watson–Crick pairs unless `isMut` */
const HELIX_PATTERN = 'ATGCTAGCATCGATCGATGCTAGCATCGAT' as const;
type Base = 'A' | 'T' | 'G' | 'C';

/** Canonical base colors (match `globals.css` --base-*) — not lime-washed */
const NUCLEOTIDE_HEX: Record<Base, string> = {
  A: '#86efac',
  T: '#fbbf24',
  G: '#4ade80',
  C: '#f87171',
};

function complement(b: Base): Base {
  switch (b) {
    case 'A':
      return 'T';
    case 'T':
      return 'A';
    case 'G':
      return 'C';
    case 'C':
      return 'G';
  }
}

function helixBase0(pairIndex: number): Base {
  const ch = HELIX_PATTERN[pairIndex % HELIX_PATTERN.length];
  if (ch === 'A' || ch === 'T' || ch === 'G' || ch === 'C') return ch;
  return 'A';
}

/** Strand-1 base that cannot pair with b0 (for mismatch illustration). */
function nonWatsonCrickPartner(b0: Base, pairIndex: number): Base {
  const c = complement(b0);
  const choices = (['A', 'T', 'G', 'C'] as const).filter((x) => x !== b0 && x !== c);
  return choices[pairIndex % choices.length] ?? 'G';
}

function helixBaseStrand(pairIndex: number, strand: 0 | 1): Base {
  const b0 = helixBase0(pairIndex);
  if (strand === 0) return b0;
  const isMut = pairIndex % 14 === 6;
  return isMut ? nonWatsonCrickPartner(b0, pairIndex) : complement(b0);
}

function dimColor(out: THREE.Color, hex: string, factor: number) {
  out.set(hex).multiplyScalar(factor);
}

/** Line colors boosted past 1 so additive blending + bloom read as luminous. */
function luminousLineColor(out: THREE.Color, hex: string, gain: number) {
  out.set(hex);
  out.r *= gain;
  out.g *= gain;
  out.b *= gain;
}

function smoothstep01(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

function pairAssemblyT(pairIndex: number, globalT: number): number {
  const span = 1 - STREAM_STAGGER + 1e-6;
  const start = (pairIndex / Math.max(NUM_PAIRS - 1, 1)) * STREAM_STAGGER;
  return smoothstep01((globalT - start) / span);
}

function AmbientNucleotideCloud({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const driftAmp = reducedMotion ? 0.35 : 1;

  const { anchor, phase, freq, baseScale, colors } = useMemo(() => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const a = new Float32Array(AMBIENT_COUNT * 3);
    const ph = new Float32Array(AMBIENT_COUNT * 3);
    const fr = new Float32Array(AMBIENT_COUNT * 3);
    const sc = new Float32Array(AMBIENT_COUNT);
    const col = new Float32Array(AMBIENT_COUNT * 3);
    const pick = new THREE.Color();
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const t = i / Math.max(AMBIENT_COUNT - 1, 1);
      const y = 1 - t * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const layer = i % 3;
      const rf = layer === 0 ? 1 : layer === 1 ? 0.64 : 0.38;
      const spread = 0.88 + (i % 17) * 0.012;
      a[i * 3 + 0] = Math.cos(theta) * rr * AMBIENT_RADIUS_X * rf * spread;
      a[i * 3 + 1] = y * AMBIENT_RADIUS_Y * rf + Math.sin(i * 2.17) * 2.4;
      a[i * 3 + 2] = Math.sin(theta) * rr * AMBIENT_RADIUS_Z * rf * spread;
      const s = i * 4.729;
      ph[i * 3 + 0] = Math.sin(s) * 5;
      ph[i * 3 + 1] = Math.cos(s * 1.3) * 5;
      ph[i * 3 + 2] = Math.sin(s * 0.7) * 5;
      fr[i * 3 + 0] = 0.11 + (i % 5) * 0.022;
      fr[i * 3 + 1] = 0.085 + (i % 7) * 0.02;
      fr[i * 3 + 2] = 0.1 + (i % 4) * 0.024;
      sc[i] = 0.52 + (i % 13) * 0.065;
      const hex = AMBIENT_PALETTE_HEX[(i * 17 + (i >> 3)) % AMBIENT_PALETTE_HEX.length];
      pick.set(hex);
      pick.multiplyScalar(0.92 + (i % 5) * 0.028);
      col[i * 3 + 0] = pick.r;
      col[i * 3 + 1] = pick.g;
      col[i * 3 + 2] = pick.b;
    }
    return { anchor: a, phase: ph, freq: fr, baseScale: sc, colors: col };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime * driftAmp;
    if (!meshRef.current) return;
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const ix = i * 3;
      const x =
        anchor[ix] +
        Math.sin(time * freq[ix] + phase[ix]) * 1.8 * driftAmp +
        Math.sin(time * 0.31 + i) * 0.35;
      const y =
        anchor[ix + 1] +
        Math.cos(time * freq[ix + 1] + phase[ix + 1]) * 1.4 * driftAmp +
        Math.cos(time * 0.27 + i * 0.5) * 0.28;
      const z =
        anchor[ix + 2] +
        Math.sin(time * freq[ix + 2] + phase[ix + 2]) * 1.6 * driftAmp +
        Math.sin(time * 0.23 + i * 0.3) * 0.32;
      dummy.position.set(x, y, z);
      const pulse = 0.92 + Math.sin(time * 0.8 + i * 0.6) * 0.08;
      dummy.scale.setScalar((baseScale[i] * 0.1) * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.setRGB(colors[ix], colors[ix + 1], colors[ix + 2]);
      meshRef.current.setColorAt(i, colorObj);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, AMBIENT_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 9, 9]} />
      <meshStandardMaterial
        toneMapped={false}
        roughness={0.38}
        metalness={0.18}
        emissive="#ff8a8a"
        emissiveIntensity={0.38}
        vertexColors
      />
    </instancedMesh>
  );
}

function HelixStrand({ reducedMotion }: { reducedMotion: boolean }) {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const centerLightRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const bondMatRef = useRef<THREE.LineBasicMaterial>(null);
  const backboneMatRef = useRef<THREE.LineBasicMaterial>(null);
  const elapsedRef = useRef(0);
  const formedAtRef = useRef<number | null>(null);

  const count = NUM_PAIRS * 2;
  const spawnDelay = reducedMotion ? 0.05 : SPAWN_DELAY;
  const assemblyDuration = reducedMotion ? 0.85 : ASSEMBLY_DURATION;

  const { initPos, finalPos, colors, bondGeo, backboneGeo } = useMemo(() => {
    const ip = new Float32Array(count * 3);
    const fp = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const tmp = new THREE.Color();

    const bondPos = new Float32Array(NUM_PAIRS * 2 * 3);
    const bondCol = new Float32Array(NUM_PAIRS * 2 * 3);
    const nBack = Math.max(NUM_PAIRS - 1, 0) * 2;
    const bbPos = new Float32Array(nBack * 2 * 3);
    const bbCol = new Float32Array(nBack * 2 * 3);

    for (let p = 0; p < NUM_PAIRS; p++) {
      const isMut = p % 14 === 6;
      const y = (p - NUM_PAIRS / 2) * HEIGHT_SCALE;
      const angle = p * ROTATION_STEP;

      fp[p * 6 + 0] = Math.cos(angle) * RADIUS;
      fp[p * 6 + 1] = y;
      fp[p * 6 + 2] = Math.sin(angle) * RADIUS;
      fp[p * 6 + 3] = Math.cos(angle + Math.PI) * RADIUS;
      fp[p * 6 + 4] = y;
      fp[p * 6 + 5] = Math.sin(angle + Math.PI) * RADIUS;

      const seed = p * 8.311;
      const spawnAngle = seed + p * 0.61;
      const shell = 9 + (p % 5) * 0.4;
      for (const strand of [0, 1]) {
        const i = p * 2 + strand;
        const ix = i * 3;
        const jitter = strand === 0 ? 0 : 1.7;
        ip[ix + 0] = Math.cos(spawnAngle + jitter) * shell + Math.sin(seed * 1.1) * 3;
        ip[ix + 1] = y * 0.4 + Math.sin(seed * 1.4) * 6;
        ip[ix + 2] = 14 + Math.sin(spawnAngle) * shell * 0.85 + Math.cos(seed) * 4;
      }

      const b0 = helixBase0(p);
      const b1: Base = isMut ? nonWatsonCrickPartner(b0, p) : complement(b0);
      tmp.set(NUCLEOTIDE_HEX[b0]);
      col[p * 6 + 0] = tmp.r;
      col[p * 6 + 1] = tmp.g;
      col[p * 6 + 2] = tmp.b;
      tmp.set(NUCLEOTIDE_HEX[b1]);
      col[p * 6 + 3] = tmp.r;
      col[p * 6 + 4] = tmp.g;
      col[p * 6 + 5] = tmp.b;

      const jb = p * 6;
      bondPos[jb + 0] = fp[p * 6 + 0];
      bondPos[jb + 1] = fp[p * 6 + 1];
      bondPos[jb + 2] = fp[p * 6 + 2];
      bondPos[jb + 3] = fp[p * 6 + 3];
      bondPos[jb + 4] = fp[p * 6 + 4];
      bondPos[jb + 5] = fp[p * 6 + 5];
      luminousLineColor(tmp, NUCLEOTIDE_HEX[b0], 1.58);
      bondCol[jb + 0] = tmp.r;
      bondCol[jb + 1] = tmp.g;
      bondCol[jb + 2] = tmp.b;
      luminousLineColor(tmp, NUCLEOTIDE_HEX[b1], 1.58);
      bondCol[jb + 3] = tmp.r;
      bondCol[jb + 4] = tmp.g;
      bondCol[jb + 5] = tmp.b;
    }

    let bi = 0;
    const cEnd = new THREE.Color();
    for (let strand = 0; strand < 2; strand++) {
      const sd = strand as 0 | 1;
      for (let p = 0; p < NUM_PAIRS - 1; p++) {
        const i0 = p * 2 + strand;
        const i1 = (p + 1) * 2 + strand;
        const j = bi * 6;
        bbPos[j + 0] = fp[i0 * 3 + 0];
        bbPos[j + 1] = fp[i0 * 3 + 1];
        bbPos[j + 2] = fp[i0 * 3 + 2];
        bbPos[j + 3] = fp[i1 * 3 + 0];
        bbPos[j + 4] = fp[i1 * 3 + 1];
        bbPos[j + 5] = fp[i1 * 3 + 2];
        luminousLineColor(tmp, NUCLEOTIDE_HEX[helixBaseStrand(p, sd)], 1.32);
        luminousLineColor(cEnd, NUCLEOTIDE_HEX[helixBaseStrand(p + 1, sd)], 1.32);
        bbCol[j + 0] = tmp.r;
        bbCol[j + 1] = tmp.g;
        bbCol[j + 2] = tmp.b;
        bbCol[j + 3] = cEnd.r;
        bbCol[j + 4] = cEnd.g;
        bbCol[j + 5] = cEnd.b;
        bi += 1;
      }
    }

    const bondGeometry = new THREE.BufferGeometry();
    bondGeometry.setAttribute('position', new THREE.BufferAttribute(bondPos, 3));
    bondGeometry.setAttribute('color', new THREE.BufferAttribute(bondCol, 3));

    const backboneGeometry = new THREE.BufferGeometry();
    backboneGeometry.setAttribute('position', new THREE.BufferAttribute(bbPos, 3));
    backboneGeometry.setAttribute('color', new THREE.BufferAttribute(bbCol, 3));

    return { initPos: ip, finalPos: fp, colors: col, bondGeo: bondGeometry, backboneGeo: backboneGeometry };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const spot = spotRef.current;
    if (!spot) return;
    scene.add(spot.target);
    return () => {
      scene.remove(spot.target);
    };
  }, [scene]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const motion = reducedMotion ? 0.35 : 1;
    elapsedRef.current += delta;
    const helixClock = Math.max(0, elapsedRef.current - spawnDelay);
    const rawT = Math.min(helixClock / assemblyDuration, 1);
    const t = smoothstep01(rawT);
    const formed = rawT >= 1;

    if (formed && formedAtRef.current === null) {
      formedAtRef.current = time;
    }

    if (meshRef.current) {
      for (let p = 0; p < NUM_PAIRS; p++) {
        const pairT = pairAssemblyT(p, t);
        const pop = easeOutBack(THREE.MathUtils.clamp(pairT, 0, 1));
        const ballScale = (0.04 + 0.96 * pop) * 0.22;
        for (const strand of [0, 1]) {
          const i = p * 2 + strand;
          const ix = i * 3;
          const x = THREE.MathUtils.lerp(initPos[ix], finalPos[ix], pairT);
          const y = THREE.MathUtils.lerp(initPos[ix + 1], finalPos[ix + 1], pairT);
          const z = THREE.MathUtils.lerp(initPos[ix + 2], finalPos[ix + 2], pairT);
          dummy.position.set(x, y, z);
          dummy.position.y += Math.sin(time * 1.5 + i * 0.4) * 0.05 * (1 - pairT) * motion;
          dummy.scale.setScalar(ballScale);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          colorObj.setRGB(colors[ix], colors[ix + 1], colors[ix + 2]);
          meshRef.current.setColorAt(i, colorObj);
        }
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }

    if (formedAtRef.current !== null) {
      const since = time - formedAtRef.current;
      const bondEase = smoothstep01(since / (reducedMotion ? 0.35 : 1.4));
      const backboneEase = smoothstep01(Math.max(0, since - (reducedMotion ? 0.05 : 0.4)) / (reducedMotion ? 0.35 : 1.55));
      const breathe = 0.88 + 0.12 * Math.sin(time * 1.05);
      if (bondMatRef.current) {
        bondMatRef.current.opacity = bondEase * 0.88 * breathe * motion;
      }
      if (backboneMatRef.current) {
        backboneMatRef.current.opacity = backboneEase * 0.48 * breathe * motion;
      }
    }

    const pulse = 0.55 + Math.sin(time * 1.4) * 0.12;
    if (centerLightRef.current) {
      const burst = t * t * 32 * (1 - t * 0.62);
      centerLightRef.current.intensity = formed ? 4.5 + pulse * 2.2 : burst;
      centerLightRef.current.color.setStyle(t > 0.8 ? '#f8fafc' : '#bae6fd');
    }
    if (rimRef.current) {
      rimRef.current.intensity = formed ? 2.8 + Math.sin(time * 0.9) * 0.7 : t * 10;
      const wobble = Math.sin(time * 0.35) * 2.2;
      rimRef.current.position.set(-5.5 - wobble * 0.15, 3 + wobble * 0.2, 6);
    }
    if (spotRef.current) {
      spotRef.current.intensity = (0.3 + t * 2.1 + (formed ? Math.sin(time * 0.7) * 0.4 : 0)) * motion;
      spotRef.current.position.set(10 + Math.sin(time * 0.25) * 3, 9, 9);
      spotRef.current.target.position.set(Math.sin(time * 0.18) * 0.8, 0, 0);
      spotRef.current.target.updateMatrixWorld();
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = time * (formed ? 0.15 : 0.055) * motion;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          toneMapped={false}
          roughness={0.28}
          metalness={0.34}
          emissive="#0a0f0a"
          emissiveIntensity={0.04}
          vertexColors
        />
      </instancedMesh>

      <lineSegments geometry={bondGeo} raycast={() => null}>
        <lineBasicMaterial
          ref={bondMatRef}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <lineSegments geometry={backboneGeo} raycast={() => null}>
        <lineBasicMaterial
          ref={backboneMatRef}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <pointLight ref={centerLightRef} position={[0, 0, 1.5]} color="#f1f5f9" intensity={0} distance={28} decay={2} />
      <pointLight ref={rimRef} position={[-5.5, 3, 6]} color="#2dd4bf" intensity={0} distance={24} decay={2} />

      <spotLight
        ref={spotRef}
        position={[12, 9, 9]}
        angle={0.42}
        penumbra={0.85}
        intensity={0.35}
        color="#fefce8"
      />
    </group>
  );
}

function PostEffects({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.22}
        luminanceSmoothing={0.028}
        intensity={0.64}
        radius={0.5}
        mipmapBlur
      />
    </EffectComposer>
  );
}

function SceneContents({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <hemisphereLight args={['#fef9c3', '#1e2a18', 0.34]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[8, 10, 4]} intensity={0.78} color="#f8fafc" />
      <directionalLight position={[-8, -8, -4]} intensity={0.45} color="#2dd4bf" />
      <directionalLight position={[-14, 6, -4]} intensity={0.38} color="#fca5a5" />

      <AmbientNucleotideCloud reducedMotion={reducedMotion} />
      <HelixStrand reducedMotion={reducedMotion} />

      <PostEffects enabled={!reducedMotion} />
    </>
  );
}

export default function GlobalDNABackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 13], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <SceneContents reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
