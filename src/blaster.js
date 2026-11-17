// Blue ZURU X-Shot Insanity Nerf Blaster Viewmodel, Foam Darts & WebAudio SFX
window.APP = window.APP || {};

APP.createBlasterSystem = function(scene, camera, arch) {
  // ==================== WEBAUDIO SYNTHESIZED SFX ====================
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (_) {}
    }
    return audioCtx;
  }

  function playNoise(dur, freq, q, gainVal, hp = false) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.38));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = hp ? 'highpass' : 'bandpass';
    flt.frequency.value = freq;
    flt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(flt); flt.connect(g); g.connect(ctx.destination);
    src.start();
  }

  function playTone(type, f0, f1, dur, gainVal) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur);
  }

  const sfx = {
    unlock: ensureAudio,
    shoot() {
      // Crisp Nerf flywheel pop + foam air-thwip
      playTone('triangle', 290, 88, 0.09, 0.22);
      playNoise(0.08, 1300, 1.4, 0.18);
    },
    reload() {
      playTone('square', 220, 140, 0.06, 0.08);
      setTimeout(() => playTone('square', 340, 520, 0.08, 0.09), 260);
    },
    empty() {
      playTone('square', 160, 120, 0.04, 0.07);
    },
    hit(isHead) {
      playTone('sine', isHead ? 780 : 380, isHead ? 1150 : 210, 0.09, 0.18);
      playNoise(0.05, 900, 1.0, 0.10);
    },
    glass() {
      playNoise(0.28, 3200, 0.8, 0.22, true);
      playTone('sine', 1900, 950, 0.14, 0.09);
    },
    door() {
      playTone('triangle', 120, 48, 0.18, 0.22);
      playNoise(0.14, 340, 1.2, 0.16);
    },
    groan() {
      playTone('sawtooth', 145 + Math.random() * 25, 86, 0.36, 0.075);
    },
    hurt() {
      playTone('sawtooth', 160, 62, 0.22, 0.20);
      playNoise(0.16, 480, 1.0, 0.16);
    },
    wave() {
      playTone('triangle', 440, 660, 0.14, 0.14);
      setTimeout(() => playTone('triangle', 554, 880, 0.22, 0.16), 140);
    },
    catBite() {
      // Sharp cat hiss/meow + snappy bite chomp
      playTone('triangle', 860, 520, 0.11, 0.14);
      playNoise(0.08, 2200, 1.5, 0.14, true);
    },
    eat() {
      // Cozy warm noodle slurp + chime
      playNoise(0.14, 700, 1.2, 0.12);
      playTone('triangle', 480, 720, 0.11, 0.14);
      setTimeout(() => playTone('triangle', 720, 960, 0.15, 0.13), 100);
    },
    kick() {
      // Heavy melee kick swoosh & thud
      playTone('triangle', 155, 52, 0.16, 0.28);
      playNoise(0.11, 520, 0.9, 0.20);
    },
    explode() {
      // Deep grenade detonation boom + crackle
      playTone('sawtooth', 140, 34, 0.42, 0.34);
      playNoise(0.45, 280, 0.7, 0.32);
    },
    chip() {
      playNoise(0.06, 1600, 1.4, 0.10, true);
      playTone('triangle', 260, 110, 0.05, 0.09);
    },
    crumble() {
      playNoise(0.22, 420, 0.9, 0.22);
      playTone('sawtooth', 130, 48, 0.18, 0.16);
    },
    bark() {
      // Heroic big white shepherd double bark!
      playTone('sawtooth', 290, 130, 0.11, 0.24);
      setTimeout(() => playTone('sawtooth', 340, 150, 0.14, 0.22), 130);
    }
  };

  // ==================== BLASTER TEXTURES (X-SHOT INSANITY & M-15-L) ====================
  function makeSideDecalTex() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#176fd6';
    ctx.fillRect(0, 0, 512, 160);
    // White & cyan racing stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 56, 360, 18);
    ctx.fillStyle = '#60d3ff';
    ctx.fillRect(18, 78, 300, 10);
    // Dark slanted badge backing
    ctx.fillStyle = '#11161d';
    ctx.beginPath();
    ctx.moveTo(130, 26); ctx.lineTo(368, 26); ctx.lineTo(350, 118); ctx.lineTo(112, 118);
    ctx.closePath(); ctx.fill();
    // Red ZURU pill
    ctx.fillStyle = '#e52521';
    ctx.fillRect(142, 32, 62, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ZURU', 151, 47);
    // X-SHOT INSANITY text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 italic 34px sans-serif';
    ctx.fillText('X-SHOT', 132, 86);
    ctx.fillStyle = '#73d4ff';
    ctx.font = 'bold italic 19px sans-serif';
    ctx.fillText('INSANITY', 175, 110);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeMagTex() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 384;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff6d1c';
    ctx.fillRect(0, 0, 128, 384);
    // Visible stacked blue/orange darts inside translucent clip
    for (let i = 0; i < 11; i++) {
      const y = 32 + i * 28;
      ctx.fillStyle = '#1462c9';
      ctx.fillRect(16, y, 74, 15);
      ctx.fillStyle = '#ff4b12';
      ctx.fillRect(90, y + 1, 20, 13);
      ctx.fillStyle = '#ffa040';
      ctx.fillRect(83, y, 4, 15);
    }
    // Molded clip ribs
    ctx.strokeStyle = 'rgba(255, 150, 60, 0.85)';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 116, 372);
    ctx.beginPath();
    ctx.moveTo(10, 115); ctx.lineTo(118, 170);
    ctx.moveTo(10, 225); ctx.lineTo(118, 280);
    ctx.stroke();
    // Molded M-15-L label
    ctx.save();
    ctx.translate(64, 108);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(195, 65, 10, 0.9)';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M-15-L', 0, 9);
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  const mBlue = new THREE.MeshStandardMaterial({ color: 0x176fd6, roughness: 0.34, metalness: 0.08 });
  const mBlueSide = new THREE.MeshStandardMaterial({ map: makeSideDecalTex(), roughness: 0.35, metalness: 0.08 });
  const mOrange = new THREE.MeshStandardMaterial({ color: 0xff621a, roughness: 0.35, metalness: 0.06 });
  const mMag = new THREE.MeshStandardMaterial({
    map: makeMagTex(), color: 0xff7b29, roughness: 0.22, metalness: 0.05,
    transparent: true, opacity: 0.86
  });
  const mBlack = new THREE.MeshStandardMaterial({ color: 0x1e2228, roughness: 0.62, metalness: 0.12 });
  const mDartFoam = new THREE.MeshStandardMaterial({ color: 0x1565d8, roughness: 0.55 });
  const mDartTip = new THREE.MeshStandardMaterial({ color: 0xff5a18, roughness: 0.42 });

  // Helper: single blue dart with orange tip (+ dual orange rings)
  function makeDartMesh(scale = 1) {
    const dg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0068 * scale, 0.0068 * scale, 0.056 * scale, 8), mDartFoam);
    body.rotation.x = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0072 * scale, 8, 6), mDartTip);
    tip.scale.z = 1.25;
    tip.position.z = -0.030 * scale;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0070 * scale, 0.0070 * scale, 0.005 * scale, 8), mDartTip);
    band.rotation.x = Math.PI / 2;
    band.position.z = -0.019 * scale;
    dg.add(body, tip, band);
    return dg;
  }

  // ==================== BUILD 3D FIRST-PERSON X-SHOT INSANITY VIEWMODEL ====================
  const vmRoot = new THREE.Group();
  const blaster = new THREE.Group();

  // Main blue receiver (-Z points forward into screen!)
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.105, 0.33), [
    mBlueSide, mBlueSide, mBlue, mBlue, mBlue, mBlue
  ]);
  receiver.position.set(0, 0.015, -0.02);
  blaster.add(receiver);

  // Angled upper front shroud
  const upperShroud = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.044, 0.22), mBlue);
  upperShroud.position.set(0, 0.072, -0.07);
  blaster.add(upperShroud);

  // Diagonal dark cooling vents on upper nose
  for (let i = 0; i < 5; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.061, 0.007, 0.018), mBlack);
    vent.position.set(0, 0.075, -0.06 - i * 0.024);
    vent.rotation.x = 0.45;
    blaster.add(vent);
  }

  // Lower blue underbarrel rail
  const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.036, 0.17), mBlue);
  lowerRail.position.set(0, -0.046, -0.14);
  blaster.add(lowerRail);

  // Thick orange octagonal perforated barrel extending forward
  const muzzleOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.029, 0.145, 8), mOrange);
  muzzleOuter.rotation.x = Math.PI / 2;
  muzzleOuter.position.set(0, 0.012, -0.245);
  blaster.add(muzzleOuter);
  const muzzleBore = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 12), mBlack);
  muzzleBore.rotation.x = Math.PI / 2;
  muzzleBore.position.set(0, 0.012, -0.312);
  blaster.add(muzzleBore);

  // Orange barrel side cooling holes
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.058, 6), mBlack);
      hole.rotation.z = Math.PI / 2;
      hole.position.set(0, 0.006 + row * 0.012, -0.195 - col * 0.018);
      blaster.add(hole);
    }
  }

  // Orange triangular front iron sight
  const sightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.028), mBlue);
  sightFrame.position.set(0, 0.098, -0.165);
  const sightOrange = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.022), mOrange);
  sightOrange.position.set(0, 0.102, -0.166);
  blaster.add(sightFrame, sightOrange);

  // Top black dart storage rack + 2x5 stack of horizontal blue darts w/ orange tips!
  const topRack = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.018, 0.13), mBlack);
  topRack.position.set(0, 0.100, 0.025);
  blaster.add(topRack);
  for (let row = 0; row < 3; row++) {
    for (let side of [-0.014, 0.014]) {
      const rackDart = makeDartMesh(1.35);
      rackDart.position.set(side, 0.115 + row * 0.018, 0.025);
      blaster.add(rackDart);
    }
  }

  // Black tactical rear stock + orange release button
  const stockBar = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.068, 0.16), mBlack);
  stockBar.position.set(0, 0.018, 0.21);
  const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.135, 0.036), mBlack);
  buttPad.position.set(0, -0.008, 0.285);
  const stockLatch = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.022, 0.020), mOrange);
  stockLatch.position.set(0, 0.025, 0.155);
  blaster.add(stockBar, buttPad, stockLatch);

  // Black angled pistol grip & orange trigger
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.115, 0.046), mBlack);
  grip.position.set(0, -0.088, 0.11);
  grip.rotation.x = 0.24;
  const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.048, 0.060), mBlack);
  triggerGuard.position.set(0, -0.056, 0.060);
  const triggerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.028, 0.018), mOrange);
  triggerMesh.position.set(0, -0.048, 0.062);
  blaster.add(grip, triggerGuard, triggerMesh);

  // Helper to build a single M-15-L orange translucent magazine
  function makeMagGroup() {
    const mg = new THREE.Group();
    const clipBox = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.205, 0.072), mMag);
    clipBox.position.y = -0.105;
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.034, 0.080), mBlack);
    clamp.position.y = -0.005;
    const baseTip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.018, 0.074), mOrange);
    baseTip.position.y = -0.212;
    mg.add(clipBox, clamp, baseTip);
    return mg;
  }

  // Center active M-15-L clip + Left & Right flanking spare M-15-L clips (exact photo layout!)
  const activeMag = makeMagGroup();
  activeMag.position.set(0, -0.035, -0.035);
  activeMag.rotation.x = -0.14;
  blaster.add(activeMag);

  const leftSpareMag = makeMagGroup();
  leftSpareMag.position.set(-0.048, -0.010, -0.085);
  leftSpareMag.rotation.set(-0.14, 0, -0.08);
  const leftBracket = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.040, 0.085), mBlack);
  leftBracket.position.set(-0.042, 0.005, -0.085);
  blaster.add(leftSpareMag, leftBracket);

  const rightSpareMag = makeMagGroup();
  rightSpareMag.position.set(0.048, -0.010, -0.065);
  rightSpareMag.rotation.set(-0.14, 0, 0.08);
  const rightBracket = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.040, 0.085), mBlack);
  rightBracket.position.set(0.042, 0.005, -0.065);
  blaster.add(rightSpareMag, rightBracket);

  // Subtle blaster muzzle flash mesh
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xff9b33, transparent: true, opacity: 0, depthWrite: false });
  const flashMesh = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), flashMat);
  flashMesh.position.set(0, 0.012, -0.34);
  blaster.add(flashMesh);

  // Position viewmodel ergonomically in lower-right foreground so barrel, top rack & clips are clearly visible
  vmRoot.position.set(0.24, -0.17, -0.45);
  vmRoot.rotation.set(0.04, -0.18, 0.03);
  vmRoot.add(blaster);
  camera.add(vmRoot);

  // Warm flashlight spotlight mounted under muzzle (especially atmospheric in Kveld mode!)
  const flashSpot = new THREE.SpotLight(0xfff5e0, 0.0, 14, Math.PI * 0.24, 0.55, 1.4);
  flashSpot.position.set(0, -0.02, -0.30);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, -5);
  vmRoot.add(flashSpot, spotTarget);
  flashSpot.target = spotTarget;

  // Collect all solid opaque world meshes right now (architecture, furniture, floors, ceilings, yard)
  // so darts fly laser-straight to the exact crosshair target and bounce realistically off ANY object.
  const bounceMeshes = [];
  const destructibles = [];
  const tmpBox = new THREE.Box3();
  const tmpSize = new THREE.Vector3();
  const tmpCenter = new THREE.Vector3();
  function isDescendant(obj, ancestor) {
    for (let c = obj; c; c = c.parent) if (c === ancestor) return true;
    return false;
  }
  scene.traverse(obj => {
    if (!obj.isMesh || obj === flashMesh || isDescendant(obj, vmRoot)) return;
    if (obj.material && obj.material.side === THREE.BackSide) return;
    if (obj.material && obj.material.transparent && obj.material.opacity < 0.7) return;
    bounceMeshes.push(obj);

    if (obj.userData.noDestroy || (arch && isDescendant(obj, arch.ceilingGroup))) return;
    tmpBox.setFromObject(obj);
    tmpBox.getSize(tmpSize);
    const isFlatGround = (tmpSize.y < 0.24 && tmpBox.max.y <= 0.14 && (tmpSize.x > 1.8 || tmpSize.z > 1.8));
    if (isFlatGround) {
      obj.userData.noDestroy = true;
      return;
    }
    if (!obj.userData.destructible) {
      obj.userData.destructible = 'interior';
      obj.userData.maxHp = 3;
      obj.userData.hp = 3;
    }
    destructibles.push(obj);
  });

  // ==================== DESTRUCTIBLE WALLS & FURNITURE DEBRIS ====================
  const debris = [];
  const chipMarks = [];
  const chipGeo = new THREE.BoxGeometry(0.10, 0.10, 0.014);
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x26211c, roughness: 0.95 });
  const fallbackDebrisMat = new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.85 });
  const chunkGeo = new THREE.BoxGeometry(1, 1, 1);

  function getDebrisMat(mesh, faceIndex) {
    let m = mesh.material;
    if (Array.isArray(m)) {
      const matIdx = (faceIndex !== undefined && faceIndex !== null) ? Math.floor(faceIndex / 2) : 0;
      m = m[matIdx] || m[0];
    }
    if (!m || !m.color) return fallbackDebrisMat;
    if (!m.userData._chunkMat) {
      m.userData._chunkMat = new THREE.MeshStandardMaterial({
        color: m.color.clone(),
        map: m.map || null,
        roughness: 0.85
      });
    }
    return m.userData._chunkMat;
  }

  function spawnDebris(mesh, pt, normal, faceIndex, count, speedScale = 1) {
    const mat = getDebrisMat(mesh, faceIndex);
    for (let i = 0; i < count; i++) {
      if (debris.length >= 180) {
        const old = debris.shift();
        scene.remove(old.mesh);
      }
      const cm = new THREE.Mesh(chunkGeo, mat);
      const sx = 0.045 + Math.random() * 0.065;
      const sy = 0.035 + Math.random() * 0.055;
      const sz = 0.030 + Math.random() * 0.050;
      cm.scale.set(sx, sy, sz);
      cm.position.set(
        pt.x + (Math.random() - 0.5) * 0.16,
        pt.y + (Math.random() - 0.5) * 0.16,
        pt.z + (Math.random() - 0.5) * 0.16
      );
      cm.castShadow = true;
      scene.add(cm);
      debris.push({
        mesh: cm,
        vx: (normal.x * (1.2 + Math.random() * 1.8) + (Math.random() - 0.5) * 2.4) * speedScale,
        vy: (1.2 + Math.random() * 2.4) * speedScale,
        vz: (normal.z * (1.2 + Math.random() * 1.8) + (Math.random() - 0.5) * 2.4) * speedScale,
        rx: (Math.random() - 0.5) * 12,
        ry: (Math.random() - 0.5) * 12,
        life: 9.0,
        resting: false
      });
    }
  }

  function removeChipMarksFor(mesh) {
    for (let i = chipMarks.length - 1; i >= 0; i--) {
      if (chipMarks[i].owner === mesh) {
        scene.remove(chipMarks[i].mesh);
        chipMarks.splice(i, 1);
      }
    }
  }

  function damageMesh(mesh, pt, normal, faceIndex, dmg = 1) {
    spawnDebris(mesh, pt, normal, faceIndex, dmg >= 2 ? 8 : 5, dmg >= 2 ? 1.25 : 1.0);
    if (!mesh.userData.destructible || mesh.userData.noDestroy) return;
    mesh.userData.hp -= dmg;
    if (mesh.userData.hp > 0) {
      sfx.chip();
      if (chipMarks.length >= 120) {
        const oldMark = chipMarks.shift();
        scene.remove(oldMark.mesh);
      }
      const mark = new THREE.Mesh(chipGeo, chipMat);
      mark.position.copy(pt).addScaledVector(normal, 0.008);
      mark.lookAt(pt.clone().add(normal));
      mark.rotateZ(Math.random() * Math.PI);
      scene.add(mark);
      chipMarks.push({ mesh: mark, owner: mesh });
    } else {
      // Break open completely -> real hole in wall / shattered furniture piece!
      sfx.crumble();
      tmpBox.setFromObject(mesh);
      tmpBox.getCenter(tmpCenter);
      spawnDebris(mesh, tmpCenter, normal, faceIndex, 10, 1.35);
      mesh.visible = false;
      const bi = bounceMeshes.indexOf(mesh);
      if (bi >= 0) bounceMeshes.splice(bi, 1);
      removeChipMarksFor(mesh);
    }
  }

  function damageDestructiblesInRadius(pt, radius, dmg = 4) {
    for (const mesh of destructibles) {
      if (!mesh.visible || mesh.userData.noDestroy) continue;
      tmpBox.setFromObject(mesh);
      tmpBox.getCenter(tmpCenter);
      const dist = tmpCenter.distanceTo(pt);
      if (dist <= radius + 0.35) {
        const n = tmpCenter.clone().sub(pt);
        if (n.lengthSq() < 1e-4) n.set(0, 1, 0);
        else n.normalize();
        damageMesh(mesh, tmpCenter, n, 0, dmg);
      }
    }
  }

  function resetWorldDamage() {
    for (const mesh of destructibles) {
      mesh.userData.hp = mesh.userData.maxHp || 3;
      mesh.visible = true;
      if (bounceMeshes.indexOf(mesh) < 0) bounceMeshes.push(mesh);
    }
    while (chipMarks.length) scene.remove(chipMarks.pop().mesh);
    while (debris.length) scene.remove(debris.pop().mesh);
  }

  // ==================== PROJECTILE DARTS & STATE ====================
  const darts = [];
  const MAX_MAG = 15;
  const state = {
    enabled: true,
    ammo: MAX_MAG,
    reserve: 72,
    reloading: false,
    reloadT: 0,
    cooldown: 0,
    recoil: 0,
    flashT: 0,
    walkTime: 0
  };

  function setVisible(vis) {
    state.enabled = vis;
    vmRoot.visible = vis;
  }

  function resetAmmo() {
    state.ammo = MAX_MAG;
    state.reserve = 72;
    state.reloading = false;
    state.reloadT = 0;
    state.cooldown = 0;
  }

  function addAmmo(count) {
    state.reserve = Math.min(120, state.reserve + count);
  }

  function startReload() {
    if (!state.enabled || state.reloading || state.ammo >= MAX_MAG || state.reserve <= 0) return false;
    state.reloading = true;
    state.reloadT = 0.85;
    sfx.reload();
    return true;
  }

  const aimRaycaster = new THREE.Raycaster();
  const stepRaycaster = new THREE.Raycaster();
  const muzzleWorld = new THREE.Vector3();
  const normMatrix = new THREE.Matrix3();

  function getFloorY(x, z) {
    if (x > 10.02 || z < -0.78 || z > 10.60 || x < -0.15) return -0.165;
    if (x > 8.05 || (x > 5.85 && z < 2.85 && z > -0.75)) return -0.005;
    return 0.015;
  }

  function fire(zombiesApi) {
    if (!state.enabled || state.reloading || state.cooldown > 0) return false;
    if (state.ammo <= 0) {
      if (state.reserve > 0) startReload();
      else sfx.empty();
      return false;
    }
    state.ammo--;
    state.cooldown = 0.18;
    state.recoil = 1.0;
    state.flashT = 0.055;
    sfx.shoot();

    // Always converge directly onto the EXACT 3D point behind screen crosshair center (0, 0)
    aimRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
    aimRaycaster.near = 0.02;
    aimRaycaster.far = 55;

    let targetDist = 40;
    const zHit = zombiesApi ? zombiesApi.raycastZombie(aimRaycaster.ray) : null;
    if (zHit && zHit.dist < targetDist) targetDist = zHit.dist;

    const wHits = aimRaycaster.intersectObjects(bounceMeshes, false);
    if (wHits.length && wHits[0].distance < targetDist) targetDist = wHits[0].distance;

    // Sic the immortal black cat onto whatever visible zombie the player shoots at
    if (zHit && zHit.zombie && zombiesApi && zombiesApi.setCatTarget) {
      if (!wHits.length || zHit.dist <= wHits[0].distance + 0.15) {
        zombiesApi.setCatTarget(zHit.zombie);
      }
    }

    const aimTarget = aimRaycaster.ray.origin.clone().addScaledVector(aimRaycaster.ray.direction, targetDist);
    muzzleBore.getWorldPosition(muzzleWorld);
    // At close range (< 1.85m), muzzleWorld (~0.77m forward of camera) can be beside or past the target!
    // Spawn along the camera crosshair line just ahead of the eye so point-blank zombies always get hit cleanly.
    const spawnPos = targetDist < 1.85
      ? aimRaycaster.ray.origin.clone().addScaledVector(aimRaycaster.ray.direction, Math.max(0.02, Math.min(0.14, targetDist * 0.25)))
      : muzzleWorld.clone();
    const velDir = aimTarget.sub(spawnPos);
    if (velDir.lengthSq() < 1e-6) velDir.copy(aimRaycaster.ray.direction);
    else velDir.normalize();

    const dart = makeDartMesh(1.6);
    dart.position.copy(spawnPos);
    dart.lookAt(spawnPos.clone().add(velDir));
    scene.add(dart);
    darts.push({
      mesh: dart,
      pos: spawnPos,
      vel: velDir.multiplyScalar(36),
      life: 4.0,
      phase: 'fly', // 'fly' -> 'bounce' -> 'rest'
      pierced: new Set(),
      spinX: (Math.random() - 0.5) * 14,
      spinY: (Math.random() - 0.5) * 14
    });

    if (state.ammo === 0 && state.reserve > 0) {
      setTimeout(() => { if (state.ammo === 0) startReload(); }, 180);
    }
    return true;
  }

  function update(dt, isMoving, zombiesApi, lightMood) {
    flashSpot.intensity = (state.enabled && lightMood === 'evening') ? 2.4 : 0.0;

    if (state.cooldown > 0) state.cooldown = Math.max(0, state.cooldown - dt);

    // Reload animation (drop active orange clip & pop back up)
    if (state.reloading) {
      state.reloadT -= dt;
      const p = 1 - Math.max(0, state.reloadT) / 0.85;
      const dip = Math.sin(p * Math.PI);
      blaster.rotation.x = -0.38 * dip;
      blaster.rotation.z = 0.42 * dip;
      activeMag.position.y = -0.035 - 0.18 * Math.pow(dip, 1.5);
      if (state.reloadT <= 0) {
        const need = MAX_MAG - state.ammo;
        const take = Math.min(need, state.reserve);
        state.ammo += take;
        state.reserve -= take;
        state.reloading = false;
        activeMag.position.y = -0.035;
        blaster.rotation.set(0, 0, 0);
      }
    } else {
      // Idle breath + walk sway + kickback recoil
      state.walkTime += dt * (isMoving ? 9.5 : 2.2);
      const sw = isMoving ? 0.011 : 0.0022;
      state.recoil = Math.max(0, state.recoil - dt * 8.5);
      triggerMesh.position.z = 0.062 + state.recoil * 0.008;
      blaster.position.set(
        Math.cos(state.walkTime * 0.5) * sw,
        Math.abs(Math.sin(state.walkTime)) * sw - state.recoil * 0.012,
        state.recoil * 0.048
      );
      blaster.rotation.set(state.recoil * 0.14, 0, 0);
    }

    if (state.flashT > 0) {
      state.flashT -= dt;
      flashMat.opacity = Math.max(0, state.flashT / 0.055) * 0.85;
      flashMesh.scale.setScalar(0.8 + Math.random() * 0.6);
    } else {
      flashMat.opacity = 0;
    }

    // Update Nerf darts: straight flight -> bounce off object/zombie -> fall & settle onto floor
    for (let i = darts.length - 1; i >= 0; i--) {
      const d = darts[i];
      d.life -= dt;
      if (d.life <= 0) {
        scene.remove(d.mesh);
        darts.splice(i, 1);
        continue;
      }
      if (d.phase === 'rest') continue;

      if (d.phase === 'fly') {
        const subSteps = 4;
        const subDt = dt / subSteps;
        for (let s = 0; s < subSteps; s++) {
          const prev = d.pos.clone();
          const stepVec = d.vel.clone().multiplyScalar(subDt);
          const stepLen = stepVec.length();
          const next = prev.clone().add(stepVec);

          // 1) Check zombie impact along straight flight segment (passes straight through if Gjennomskudd active!)
          let bouncedOnZombie = false;
          let zGuard = 0;
          while (zGuard++ < 4) {
            const zRes = zombiesApi ? zombiesApi.checkDartHit(prev, next, sfx, d.pierced) : null;
            if (!zRes) break;
            if (zRes.pierced) {
              continue;
            }
            d.pos.copy(zRes.point);
            d.vel.reflect(zRes.normal).multiplyScalar(0.14);
            d.vel.y = Math.max(1.2, d.vel.y + 1.1);
            d.vel.x += (Math.random() - 0.5) * 1.4;
            d.vel.z += (Math.random() - 0.5) * 1.4;
            d.phase = 'bounce';
            d.life = Math.min(d.life, 3.0);
            bouncedOnZombie = true;
            break;
          }
          if (bouncedOnZombie) break;

          // 2) Check ANY 3D surface hit (wall, furniture, TV, table, floor, ceiling) -> bounce away!
          if (stepLen > 1e-5) {
            const dir = stepVec.clone().divideScalar(stepLen);
            stepRaycaster.set(prev, dir);
            stepRaycaster.near = 0;
            stepRaycaster.far = stepLen + 0.02;
            const hits = stepRaycaster.intersectObjects(bounceMeshes, false);
            if (hits.length) {
              const h = hits[0];
              normMatrix.getNormalMatrix(h.object.matrixWorld);
              const n = h.face.normal.clone().applyMatrix3(normMatrix).normalize();
              if (n.dot(dir) > 0) n.negate();

              d.pos.copy(h.point).addScaledVector(n, 0.03);
              d.vel.reflect(n).multiplyScalar(0.16);
              d.vel.addScaledVector(n, 1.35);
              d.vel.x += (Math.random() - 0.5) * 0.9;
              d.vel.z += (Math.random() - 0.5) * 0.9;
              d.phase = 'bounce';
              d.life = Math.min(d.life, 3.0);
              damageMesh(h.object, h.point, n, h.faceIndex, 1);
              break;
            }
          }
          d.pos.copy(next);
        }
        d.mesh.position.copy(d.pos);
        if (d.phase === 'fly' && d.vel.lengthSq() > 0.1) {
          d.mesh.lookAt(d.pos.clone().add(d.vel));
        }
      } else if (d.phase === 'bounce') {
        d.vel.y -= 11.5 * dt;
        d.pos.addScaledVector(d.vel, dt);
        d.mesh.rotation.x += d.spinX * dt;
        d.mesh.rotation.y += d.spinY * dt;

        const floorY = getFloorY(d.pos.x, d.pos.z);
        if (d.pos.y <= floorY) {
          d.pos.y = floorY;
          if (Math.abs(d.vel.y) > 0.85) {
            d.vel.y = -d.vel.y * 0.28;
            d.vel.x *= 0.55;
            d.vel.z *= 0.55;
          } else {
            d.vel.set(0, 0, 0);
            d.phase = 'rest';
            d.mesh.rotation.x = 0;
            d.mesh.rotation.z = 0;
            d.life = Math.min(d.life, 2.5);
          }
        }
        d.mesh.position.copy(d.pos);
      }
    }

    // Update flying grenade projectiles -> explode on impact or fuse expiry
    for (let i = grenades.length - 1; i >= 0; i--) {
      const g = grenades[i];
      g.fuse -= dt;
      const prev = g.pos.clone();
      g.vel.y -= 13.0 * dt;
      const stepVec = g.vel.clone().multiplyScalar(dt);
      const stepLen = stepVec.length();
      const next = prev.clone().add(stepVec);
      g.mesh.rotation.x += 9 * dt;
      g.mesh.rotation.y += 7 * dt;

      let hitPt = null;
      if (stepLen > 1e-5) {
        const dir = stepVec.clone().divideScalar(stepLen);
        stepRaycaster.set(prev, dir);
        stepRaycaster.near = 0;
        stepRaycaster.far = stepLen + 0.08;
        const zHit = zombiesApi && zombiesApi.raycastZombie ? zombiesApi.raycastZombie(stepRaycaster.ray) : null;
        if (zHit && zHit.dist <= stepLen + 0.14) {
          hitPt = zHit.point;
        } else {
          const hits = stepRaycaster.intersectObjects(bounceMeshes, false);
          if (hits.length) hitPt = hits[0].point;
        }
      }
      const floorY = getFloorY(next.x, next.z) + 0.04;
      if (!hitPt && next.y <= floorY) {
        next.y = floorY;
        hitPt = next;
      }
      if (hitPt || g.fuse <= 0) {
        const boomPt = hitPt || next;
        sfx.explode();
        damageDestructiblesInRadius(boomPt, 2.5, 4);
        if (zombiesApi && zombiesApi.explodeAt) zombiesApi.explodeAt(boomPt);
        scene.remove(g.mesh);
        grenades.splice(i, 1);
      } else {
        g.pos.copy(next);
        g.mesh.position.copy(next);
      }
    }

    // Update falling/bouncing wall & furniture debris chunks
    for (let i = debris.length - 1; i >= 0; i--) {
      const db = debris[i];
      db.life -= dt;
      if (db.life <= 0) {
        scene.remove(db.mesh);
        debris.splice(i, 1);
        continue;
      }
      if (db.resting) continue;
      db.vy -= 12.0 * dt;
      db.mesh.position.x += db.vx * dt;
      db.mesh.position.y += db.vy * dt;
      db.mesh.position.z += db.vz * dt;
      db.mesh.rotation.x += db.rx * dt;
      db.mesh.rotation.y += db.ry * dt;
      const floorY = getFloorY(db.mesh.position.x, db.mesh.position.z) + 0.025;
      if (db.mesh.position.y <= floorY) {
        db.mesh.position.y = floorY;
        if (Math.abs(db.vy) > 0.75) {
          db.vy = -db.vy * 0.28;
          db.vx *= 0.55;
          db.vz *= 0.55;
        } else {
          db.resting = true;
        }
      }
    }
  }

  const grenades = [];
  const matGrenade = new THREE.MeshStandardMaterial({ color: 0x3b6e28, emissive: 0x1e3814, roughness: 0.4 });
  const matGrenadeBand = new THREE.MeshStandardMaterial({ color: 0xff621a, emissive: 0x802a00, roughness: 0.3 });

  function fireGrenade() {
    if (!state.enabled) return false;
    state.recoil = 1.25;
    state.flashT = 0.08;
    sfx.shoot();
    sfx.door();

    aimRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
    aimRaycaster.near = 0.02;
    aimRaycaster.far = 45;
    muzzleBore.getWorldPosition(muzzleWorld);
    const spawnPos = aimRaycaster.ray.origin.clone().addScaledVector(aimRaycaster.ray.direction, 0.35);
    const vel = aimRaycaster.ray.direction.clone().multiplyScalar(19);
    vel.y += 2.2;

    const gg = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.11), matGrenade);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.12), matGrenadeBand);
    gg.add(shell, band);
    gg.position.copy(spawnPos);
    scene.add(gg);

    grenades.push({ mesh: gg, pos: spawnPos, vel, fuse: 1.45 });
    return true;
  }

  return { state, sfx, setVisible, resetAmmo, resetWorldDamage, addAmmo, startReload, fire, fireGrenade, update };
};
