import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { types } from '@theatre/core'
import * as THREE from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { OverlayEffect } from '../overlay.js'
import { useTheatre, clean } from './theatre.js'

const BASIS = 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/libs/basis/'
const DRACO = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'
const REDUCE = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const xyz = (x = 0, y = 0, z = 0) => ({ x, y, z })
let ktx
const ktx2 = gl => ktx || (ktx = new KTX2Loader().setTranscoderPath(BASIS).detectSupport(gl))

/** Port of the original camera rig: position+target (or a camera node from a GLB), pointer pan/tilt, gaze 0.5. */
function Rig({ sheet, cameraName }) {
  const { camera, scene } = useThree()
  const pos = useRef(new THREE.Vector3(0, 0, 4)), tgt = useRef(new THREE.Vector3(0, 0, 1))
  const rot = useRef(new THREE.Euler()), gaze = useRef(0.5), ptr = useRef({ x: 0, y: 0 }), st = useRef({ pan: 0, tilt: 0 })
  const dir = useMemo(() => new THREE.Vector3(), []), q = useMemo(() => new THREE.Quaternion(), [])
  useTheatre(sheet, 'camera', {
    fov: types.number(30, { range: [10, 120] }), gaze: types.number(0.5, { range: [0, 1] }),
    rotation: xyz(), position: xyz(0, 0, 4), target: xyz(0, 0, 1),
  }, v => {
    pos.current.set(v.position.x, v.position.y, v.position.z); tgt.current.set(v.target.x, v.target.y, v.target.z)
    rot.current.set(v.rotation.x, v.rotation.y, v.rotation.z); gaze.current = v.gaze
    camera.fov = v.fov; camera.near = 0.1; camera.far = 300; camera.updateProjectionMatrix()
  })
  useEffect(() => {
    const m = e => { ptr.current.x = (e.clientX / innerWidth) * 2 - 1; ptr.current.y = -((e.clientY / innerHeight) * 2 - 1) }
    addEventListener('pointermove', m); return () => removeEventListener('pointermove', m)
  }, [])
  useFrame(() => {
    const lim = REDUCE ? 0 : 0.1 * gaze.current   // no pointer parallax for reduced motion
    const tp = -lim + (ptr.current.x * 0.5 + 0.5) * 2 * lim, tt = -lim + (ptr.current.y * 0.5 + 0.5) * 2 * lim
    st.current.pan += (tp - st.current.pan) * 0.1; st.current.tilt += (tt - st.current.tilt) * 0.1
    const { pan, tilt } = st.current
    const node = cameraName && scene.getObjectByName(cameraName)
    if (node) {
      node.getWorldPosition(camera.position); node.getWorldQuaternion(camera.quaternion)
      dir.set(pan, tilt, 0).applyQuaternion(camera.quaternion); camera.position.add(dir)
      q.setFromEuler(new THREE.Euler(-tilt + rot.current.x, pan + rot.current.y, rot.current.z)); camera.quaternion.multiply(q)
      return
    }
    dir.subVectors(pos.current, tgt.current); const dist = dir.length(); dir.normalize()
    const hx = dir.x * Math.cos(-pan) + dir.z * Math.sin(-pan), hz = -dir.x * Math.sin(-pan) + dir.z * Math.cos(-pan)
    const c = Math.cos(-tilt), s = Math.sin(-tilt)
    dir.set(hx * c, dir.y * c - s, hz * c).normalize()
    camera.position.copy(tgt.current).addScaledVector(dir, dist); camera.lookAt(tgt.current)
    camera.rotateX(rot.current.x); camera.rotateY(rot.current.y); camera.rotateZ(rot.current.z)
  })
  return null
}

function Glb({ sheet, index, src }) {
  const gl = useThree(s => s.gl)
  const gltf = useGLTF(src, DRACO, true, l => l.setKTX2Loader(ktx2(gl)))
  const root = useMemo(() => cloneSkinned(gltf.scene), [gltf])
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root])
  const clips = useMemo(() => gltf.animations.map(c => ({ name: c.name, key: clean(c.name), action: mixer.clipAction(c), dur: c.duration })), [gltf, mixer])
  const group = useRef(), live = useRef({})
  useEffect(() => { clips.forEach(c => { c.action.play(); c.action.paused = true }); return () => mixer.stopAllAction() }, [clips, mixer])
  const anim = useMemo(() => Object.fromEntries(clips.map(c => [c.key, {
    progress: types.number(0), base: types.number(0), autoplay: types.number(0), loop: types.boolean(false), mode: types.string('auto'),
  }])), [clips])
  useTheatre(sheet, `asset-${index}`, {
    visibility: types.number(1), position: xyz(), rotation: xyz(), scale: xyz(1, 1, 1), animations: anim,
  }, v => {
    live.current = v.animations || {}
    const g = group.current; if (!g) return
    g.visible = v.visibility > 0.001
    g.position.set(v.position.x, v.position.y, v.position.z); g.rotation.set(v.rotation.x, v.rotation.y, v.rotation.z); g.scale.set(v.scale.x, v.scale.y, v.scale.z)
    g.traverse(o => { if (o.material) { const m = o.material; m.transparent = v.visibility < 0.999 || m.userData.t; m.opacity = v.visibility; m.userData.t ??= m.transparent && v.visibility >= 0.999 } })
  })
  useFrame((_, dt) => {
    for (const c of clips) {
      const v = live.current[c.key] || {}
      if (v.loop && v.mode !== 'theatre' && !(v.progress > 0)) c.action.time = (c.action.time + dt * (v.autoplay || 1)) % c.dur
      else { const t = (v.base || 0) + (v.progress || 0); c.action.time = (v.loop ? t % 1 : Math.min(1, Math.max(0, t))) * c.dur }
    }
    mixer.update(0)
  })
  return <group ref={group}><primitive object={root} /></group>
}

/** KTX2 background plane ("responsive: cover" in the exported state). */
function Backdrop({ sheet, index, src, onLoaded }) {
  const gl = useThree(s => s.gl), camera = useThree(s => s.camera), size = useThree(s => s.size)
  const mesh = useRef(), aspect = useRef(1.4), loaded = useRef(false), vis = useRef(1)
  useEffect(() => {
    let alive = true
    // The plane stays hidden until its texture is ready: an unmapped MeshBasicMaterial renders as a solid white plane.
    ktx2(gl).load(src, t => {
      if (!alive || !mesh.current) return
      const im = t.mipmaps?.[0] || t.image; aspect.current = im.width / im.height
      t.colorSpace = THREE.SRGBColorSpace; mesh.current.material.map = t; mesh.current.material.needsUpdate = true
      loaded.current = true; mesh.current.visible = vis.current > 0.001; onLoaded?.()
    }, undefined, err => console.error('[Backdrop] KTX2 load failed', src, err))
    return () => { alive = false }
    // eslint-disable-next-line
  }, [gl, src])
  useTheatre(sheet, `asset-${index}`, { visibility: types.number(1), position: xyz(0, 0, -18.84), rotation: xyz(Math.PI, 0, 0) }, v => {
    const m = mesh.current; if (!m) return
    vis.current = v.visibility; m.visible = loaded.current && v.visibility > 0.001; m.material.opacity = v.visibility
    m.position.set(v.position.x, v.position.y, v.position.z); m.rotation.set(v.rotation.x, v.rotation.y, v.rotation.z)
  })
  useFrame(() => {
    const m = mesh.current; if (!m) return
    const dist = Math.abs(camera.position.z - m.position.z) || 1
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist, w = h * (size.width / size.height)
    const [sw, sh] = w / h > aspect.current ? [w, w / aspect.current] : [h * aspect.current, h]
    m.scale.set(sw * 1.15, sh * 1.15, 1)
  })
  return <mesh ref={mesh} visible={false} position={[0, 0, -18.84]} rotation={[Math.PI, 0, 0]}><planeGeometry />
    <meshBasicMaterial transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} /></mesh>
}

function Particles({ sheet }) {
  const pts = useRef(), mat = useRef(), speed = useRef(0.5)
  const positions = useMemo(() => Float32Array.from({ length: 600 }, () => (Math.random() - 0.5) * 2), [])
  useTheatre(sheet, 'particles', {
    size: 0.2, opacity: 0.9, speed: 0.5, scale: xyz(4, 4, 5), rotation: xyz(), position: xyz(),
    color: types.rgba({ r: 1, g: 0.78, b: 0.52, a: 1 }),
  }, v => {
    if (!pts.current) return
    pts.current.scale.set(v.scale.x, v.scale.y, v.scale.z); pts.current.rotation.set(v.rotation.x, v.rotation.y, v.rotation.z)
    pts.current.position.set(v.position.x, v.position.y, v.position.z)
    mat.current.size = v.size * 0.06; mat.current.opacity = v.opacity; mat.current.color.setRGB(v.color.r, v.color.g, v.color.b); speed.current = v.speed
  })
  return <points ref={pts}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial ref={mat} transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
  </points>
}

function Post({ sheet }) {
  const overlay = useMemo(() => new OverlayEffect(), []), bloom = useRef()
  useTheatre(sheet, 'effects', {
    overlay: { position: types.number(-1), mobilePosition: types.number(-1), color: types.rgba({ r: 0.86, g: 0.86, b: 0.82, a: 1 }) },
    bloom: { intensity: types.number(8) },
  }, v => {
    const u = overlay.uniforms
    u.get('uPosition').value = innerWidth <= 768 ? v.overlay.mobilePosition : v.overlay.position
    u.get('uColor').value.setRGB(v.overlay.color.r, v.overlay.color.g, v.overlay.color.b)
    if (bloom.current) bloom.current.intensity = v.bloom.intensity
  })
  return <EffectComposer multisampling={4}><primitive object={overlay} /><Bloom ref={bloom} intensity={0.2} luminanceThreshold={1} mipmapBlur /></EffectComposer>
}

export function Scene({ section, sheet, onReady }) {
  const items = [...section.assets, ...(section.custom || [])]
  const need = items.filter(a => a.kind === 'ktx2').length, got = useRef(0)
  const loaded = () => { if (++got.current >= need) onReady?.() }   // fallback image stays up until every backdrop texture is on screen
  useEffect(() => { if (!need) onReady?.() }, [])   // eslint-disable-line
  return <>
    <Rig sheet={sheet} cameraName={section.camera} />
    <ambientLight intensity={0.9} /><directionalLight position={[2, 3, 4]} intensity={1.6} color="#ffe2b8" />
    {items.map((a, i) => a.kind === 'glb' ? <Glb key={a.src + i} sheet={sheet} index={i + 1} src={a.src} />
      : a.kind === 'ktx2' ? <Backdrop key={a.src} sheet={sheet} index={i + 1} src={a.src} onLoaded={loaded} /> : null)}
    {section.hasParticles && <Particles sheet={sheet} />}
    <Post sheet={sheet} />
  </>
}
