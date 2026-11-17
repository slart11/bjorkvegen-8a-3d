// Main 3D Walkthrough Controller, Lighting Rig, Collision, Presets & Minimap
window.APP = window.APP || {};

(function() {
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const mats = APP.createMaterialLibrary(renderer);
  scene.environment = mats.envMap;
  scene.fog = new THREE.FogExp2(0xcde2f2, 0.0055);

  const S = APP.XZ || 1;
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 320);
  scene.add(camera);

  // Sky Dome
  const skyGeo = new THREE.SphereGeometry(180, 32, 20);
  const skyUniforms = {
    uTop: { value: new THREE.Color(0x3a7bc8) },
    uHorizon: { value: new THREE.Color(0xd2e7f7) },
    uSunDir: { value: new THREE.Vector3(0.65, 0.52, -0.35).normalize() },
    uSunCol: { value: new THREE.Color(0xfff6dd) }
  };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyUniforms,
    vertexShader: `varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `
      varying vec3 vW;
      uniform vec3 uTop, uHorizon, uSunDir, uSunCol;
      void main(){
        vec3 d = normalize(vW);
        float h = clamp(d.y * 0.9 + 0.1, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(h, 0.65));
        float sunAmt = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunCol * (pow(sunAmt, 42.0) * 0.35 + pow(sunAmt, 360.0) * 0.9);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // ==================== BUILD ARCHITECTURE & FURNISHINGS ====================
  const arch = APP.buildArchitecture(scene, mats);
  APP.furnishLivingAndKitchen(scene, mats, arch);
  const ext = APP.furnishOtherRoomsAndExterior(scene, mats, arch);
  const blaster = APP.createBlasterSystem(scene, camera, arch);
  const zombies = APP.createZombieSystem(scene, arch, blaster, camera);
  let curLightMood = 'sun';

  // ==================== LIGHTING RIG ====================
  const hemi = new THREE.HemisphereLight(0xeef6ff, 0xd8c3a5, 0.46);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xfff4df, 2.25);
  sunLight.position.set(14 * S, 9.5, 1.5 * S); // Shining from East/North-East/South-East into terrace & living windows
  sunLight.target.position.set(4.5 * S, 0.5, 4.5 * S);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 36;
  sunLight.shadow.camera.left = -9 * S;
  sunLight.shadow.camera.right = 9 * S;
  sunLight.shadow.camera.top = 9 * S;
  sunLight.shadow.camera.bottom = -9 * S;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.015;
  scene.add(sunLight, sunLight.target);

  // Interior fill & fixture lights
  const interiorLights = [];
  function addPoint(x, y, z, color, intDay, intNight, dist = 7) {
    const l = new THREE.PointLight(color, intDay, dist * S, 1.6);
    l.position.set(x * S, y, z * S);
    l.userData = { intDay, intNight };
    scene.add(l);
    interiorLights.push(l);
    return l;
  }
  addPoint(5.9, 2.15, 4.9, 0xfff3de, 0.24, 1.35, 9.0);  // Living room
  addPoint(4.48, 1.32, 0.38, 0xffeacc, 0.16, 1.15, 5.5); // Dining pendant
  addPoint(1.65, 2.20, 1.35, 0xfff4e0, 0.24, 1.25, 6.0); // Kitchen
  addPoint(3.92, 2.25, 8.20, 0xffe8c8, 0.20, 1.05, 5.5); // Entre
  addPoint(1.60, 2.18, 7.15, 0xf6f9ff, 0.20, 1.15, 5.0); // Bad
  addPoint(1.75, 2.18, 4.35, 0xffe6c8, 0.20, 1.05, 5.5); // Master Bed
  addPoint(1.55, 2.18, 9.25, 0xffe8cc, 0.20, 1.00, 5.0); // SW Bed
  addPoint(6.15, 2.18, 7.80, 0xffe8cc, 0.20, 1.00, 5.0); // East Bed
  addPoint(6.15, 2.20, 4.65, 0xfff4de, 0.16, 0.85, 5.5); // Living ceiling track light

  function setLightMood(mode) {
    curLightMood = mode;
    document.querySelectorAll('[data-light]').forEach(b => b.classList.toggle('active', b.dataset.light === mode));
    if (mode === 'sun') {
      scene.environment = mats.envMap;
      sunLight.intensity = 2.25; sunLight.color.setHex(0xfff4df);
      hemi.intensity = 0.46; hemi.color.setHex(0xeef6ff);
      skyUniforms.uTop.value.setHex(0x3a7bc8);
      skyUniforms.uHorizon.value.setHex(0xd2e7f7);
      scene.fog.color.setHex(0xcde2f2);
      renderer.toneMappingExposure = 0.96;
      interiorLights.forEach(l => l.intensity = l.userData.intDay);
      if (APP.lampGlobeMat) APP.lampGlobeMat.emissiveIntensity = 1.4;
    } else if (mode === 'soft') {
      scene.environment = mats.envMap;
      sunLight.intensity = 0.75; sunLight.color.setHex(0xf2f6fa);
      hemi.intensity = 0.95; hemi.color.setHex(0xe2ebf5);
      skyUniforms.uTop.value.setHex(0x7c93aa);
      skyUniforms.uHorizon.value.setHex(0xd5dde6);
      scene.fog.color.setHex(0xd0d8e0);
      renderer.toneMappingExposure = 1.05;
      interiorLights.forEach(l => l.intensity = l.userData.intDay * 1.4);
      if (APP.lampGlobeMat) APP.lampGlobeMat.emissiveIntensity = 1.6;
    } else {
      scene.environment = null;
      sunLight.intensity = 0.16; sunLight.color.setHex(0x6b88b8);
      hemi.intensity = 0.24; hemi.color.setHex(0x3b4d70);
      skyUniforms.uTop.value.setHex(0x0b1528);
      skyUniforms.uHorizon.value.setHex(0x1f2d47);
      scene.fog.color.setHex(0x141d30);
      renderer.toneMappingExposure = 1.18;
      interiorLights.forEach(l => l.intensity = l.userData.intNight);
      if (APP.lampGlobeMat) APP.lampGlobeMat.emissiveIntensity = 3.2;
    }
  }
  document.querySelectorAll('[data-light]').forEach(btn => {
    btn.addEventListener('click', () => setLightMood(btn.dataset.light));
  });

  // ==================== ROOM PRESETS (EXACT PROSPECTUS ANGLES) ====================
  const PRESETS = [
    { id: 'living1', label: 'Stue (Sofa & TV)', pos: [4.62 * S, 1.46, 2.25 * S], look: [6.15 * S, 1.12, 6.10 * S] },
    { id: 'living2', label: 'Stue (Bokhylle & Sofa)', pos: [5.25 * S, 1.46, 5.55 * S], look: [6.80 * S, 1.12, 3.05 * S] },
    { id: 'living3', label: 'Stue (mot Kjøkken)', pos: [6.30 * S, 1.44, 5.35 * S], look: [2.20 * S, 1.18, 1.95 * S] },
    { id: 'kitchen', label: 'Kjøkken', pos: [3.85 * S, 1.44, 1.88 * S], look: [1.05 * S, 1.14, 0.85 * S] },
    { id: 'dining', label: 'Spiseplass', pos: [3.75 * S, 1.42, 1.98 * S], look: [4.80 * S, 1.08, 0.25 * S] },
    { id: 'entre', label: 'Entre / Gang', pos: [3.92 * S, 1.46, 9.75 * S], look: [3.92 * S, 1.32, 3.00 * S] },
    { id: 'bad', label: 'Bad (5,5 m²)', pos: [2.85 * S, 1.42, 7.58 * S], look: [0.85 * S, 1.12, 6.60 * S] },
    { id: 'sov1', label: 'Soverom 1 (10,5 m²)', pos: [2.78 * S, 1.40, 5.45 * S], look: [1.35 * S, 1.08, 3.40 * S] },
    { id: 'sov2', label: 'Soverom 2 (6,5 SV)', pos: [2.82 * S, 1.36, 8.65 * S], look: [0.95 * S, 1.05, 9.75 * S] },
    { id: 'sov3', label: 'Soverom 3 & Bod', pos: [5.02 * S, 1.36, 8.28 * S], look: [6.80 * S, 1.05, 7.45 * S] },
    { id: 'terrace', label: 'Terrasse (21 m²)', pos: [8.92 * S, 1.48, 1.55 * S], look: [9.15 * S, 1.05, 5.45 * S] },
    { id: 'garden', label: 'Plen (foran huset)', pos: [12.15 * S, 1.34, 6.80 * S], look: [8.40 * S, 0.92, 4.30 * S] }
  ];

  // ==================== CAMERA & WALK STATE ====================
  let mode = 'walk'; // 'walk' | 'dollhouse'
  const player = {
    pos: new THREE.Vector3(...PRESETS[0].pos),
    yaw: 0,
    pitch: 0,
    velY: 0,
    grounded: true,
    bobPhase: 0
  };
  let glide = null; // { fromPos, toPos, fromYaw, toYaw, fromPitch, toPitch, t, dur }

  // Orbit state for Dollhouse mode
  const orbit = { target: new THREE.Vector3(4.5 * S, 0.8, 4.8 * S), yaw: 0.72, pitch: 0.82, dist: 15.5 * S };

  function lookAtAngles(from, to) {
    const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
    const horiz = Math.hypot(dx, dz);
    return {
      yaw: Math.atan2(-dx, -dz),
      pitch: Math.atan2(dy, horiz)
    };
  }
  function shortAngleDiff(a, b) {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function setActivePresetBtn(id) {
    document.querySelectorAll('.room-btn').forEach(b => b.classList.toggle('active', b.dataset.id === id));
  }

  function goToPreset(p, instant = false) {
    if (mode === 'dollhouse') setMode('walk');
    setActivePresetBtn(p.id);
    const toPos = new THREE.Vector3(...p.pos);
    const ang = lookAtAngles(p.pos, p.look);
    const targetPitch = (controlMode === 'nomouse') ? 0 : ang.pitch;
    if (instant) {
      player.pos.copy(toPos);
      player.yaw = ang.yaw;
      player.pitch = targetPitch;
      glide = null;
    } else {
      glide = {
        fromPos: player.pos.clone(), toPos,
        fromYaw: player.yaw, dYaw: shortAngleDiff(player.yaw, ang.yaw),
        fromPitch: player.pitch, dPitch: targetPitch - player.pitch,
        t: 0, dur: 0.55
      };
    }
  }

  let controlMode = 'mouse';
  function setControlMode(next) {
    controlMode = (next === 'nomouse') ? 'nomouse' : 'mouse';
    const noMouse = (controlMode === 'nomouse');
    const btnMouse = document.getElementById('btn-ctrl-mouse');
    const btnNoMouse = document.getElementById('btn-ctrl-nomouse');
    btnMouse.classList.toggle('active', !noMouse);
    btnNoMouse.classList.toggle('active', noMouse);
    btnMouse.blur();
    btnNoMouse.blur();
    document.body.classList.toggle('no-mouse', noMouse);
    if (noMouse) {
      glide = null;
      player.pitch = 0;
      if (document.pointerLockElement === canvas) {
        try { document.exitPointerLock(); } catch (_) {}
      }
    }
  }
  document.getElementById('btn-ctrl-mouse').addEventListener('click', () => setControlMode('mouse'));
  document.getElementById('btn-ctrl-nomouse').addEventListener('click', () => setControlMode('nomouse'));

  goToPreset(PRESETS[0], true);

  function setMode(next) {
    mode = next;
    const isDoll = (mode === 'dollhouse');
    document.getElementById('btn-walk')?.classList.toggle('active', !isDoll);
    document.getElementById('btn-dollhouse')?.classList.toggle('active', isDoll);
    arch.ceilingGroup.visible = !isDoll;
    ext.upperGroup.visible = !isDoll;
    blaster.setVisible(!isDoll && zombies.game.active);
    if (isDoll && document.pointerLockElement === canvas) document.exitPointerLock();
  }
  document.getElementById('btn-walk')?.addEventListener('click', () => setMode('walk'));
  document.getElementById('btn-dollhouse')?.addEventListener('click', () => setMode('dollhouse'));

  // Zombie game toggles & restart buttons
  const btnZombie = document.getElementById('btn-zombie');
  btnZombie.addEventListener('click', () => {
    blaster.sfx.unlock();
    const next = !zombies.game.active;
    zombies.setGameActive(next);
    blaster.setVisible(next && mode === 'walk');
    btnZombie.classList.toggle('active', next);
    document.body.classList.toggle('zombie-mode', next);
  });
  function handleRestart() {
    blaster.sfx.unlock();
    if (!zombies.game.active) {
      zombies.setGameActive(true);
      btnZombie.classList.add('active');
      document.body.classList.add('zombie-mode');
    }
    if (mode !== 'walk') setMode('walk');
    zombies.resetGame();
    canvas.focus();
    if (controlMode === 'mouse') {
      try { canvas.requestPointerLock(); } catch (_) {}
    }
  }
  document.getElementById('btn-restart')?.addEventListener('click', handleRestart);
  document.getElementById('btn-gameover-restart').addEventListener('click', handleRestart);
  document.getElementById('btn-reload').addEventListener('click', () => {
    blaster.sfx.unlock();
    blaster.startReload();
  });

  // ==================== INPUT (POINTER LOCK + DRAG + KEYS + DOORS + BLASTER) ====================
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (mode === 'walk' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (mode === 'walk' && !zombies.game.gameOver && !zombies.game.talentOpen && player.grounded) {
        player.velY = 5.5;
        player.grounded = false;
        glide = null;
      }
    }
    if (zombies.game.talentOpen) return;
    if (e.code === 'KeyE') {
      const hws = (zombies.game.active && !zombies.game.gameOver && zombies.getHomeworkState) ? zombies.getHomeworkState() : null;
      if (hws && hws.active && Math.hypot(player.pos.x - hws.x, player.pos.z - hws.z) < 2.15) return;
      if (zombies.tryEatNoodles && zombies.tryEatNoodles(player.pos)) return;
      if (zombies.tryRefillAmmo) zombies.tryRefillAmmo(player.pos);
    }
    if (e.code === 'KeyQ' && mode === 'walk' && zombies.kickZombies) {
      blaster.sfx.unlock();
      zombies.kickZombies(player.pos, -Math.sin(player.yaw), -Math.cos(player.yaw));
    }
    if (e.code === 'KeyG' && mode === 'walk' && zombies.tryFireGrenade) {
      blaster.sfx.unlock();
      zombies.tryFireGrenade();
    }
    if (e.code === 'KeyC' && mode === 'walk' && zombies.tryCallIsa) {
      blaster.sfx.unlock();
      zombies.tryCallIsa(player.pos);
    }
    if (e.code === 'KeyH') document.body.classList.toggle('hud-hidden');
    if (e.code === 'KeyR') { blaster.sfx.unlock(); blaster.startReload(); }
    if ((e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyF' || (e.code === 'Enter' && (!e.target || e.target.tagName !== 'BUTTON'))) && mode === 'walk' && zombies.game.active && !zombies.game.gameOver) {
      if (e.code === 'Enter') e.preventDefault();
      blaster.sfx.unlock();
      blaster.fire(zombies);
    }
    if (e.code === 'Digit1' || e.code === 'Numpad1') setControlMode('mouse');
    if (e.code === 'Digit2' || e.code === 'Numpad2') setControlMode('nomouse');
    if (e.code === 'Digit3') setLightMood('evening');
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  let isDragging = false, mouseDown = false, lastX = 0, lastY = 0;
  let hoverLastX = null, hoverLastY = null;

  function lockGamePointer() {
    if (document.activeElement && document.activeElement !== canvas && document.activeElement.blur) {
      try { document.activeElement.blur(); } catch (_) {}
    }
    try { canvas.focus({ preventScroll: true }); } catch (_) {}
    if (controlMode === 'mouse' && mode === 'walk' && document.pointerLockElement !== canvas) {
      try { canvas.requestPointerLock(); } catch (_) {}
    }
  }

  // Never leave focus stuck on HUD buttons so WASD / Space / shooting never break
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest && e.target.closest('button');
    if (btn) {
      try { btn.blur(); } catch (_) {}
      if (!zombies.game.talentOpen && !zombies.game.gameOver) {
        try { canvas.focus({ preventScroll: true }); } catch (_) {}
      }
    }
  });

  canvas.addEventListener('mousedown', e => {
    if (zombies.game.talentOpen) return;
    if (e.button === 2 && mode === 'walk' && zombies.tryFireGrenade) {
      blaster.sfx.unlock();
      lockGamePointer();
      zombies.tryFireGrenade();
      return;
    }
    if (e.button !== 0) return;
    blaster.sfx.unlock();
    if (mode === 'walk') {
      mouseDown = true;
      lockGamePointer();
      if (zombies.game.active && !zombies.game.gameOver) {
        blaster.fire(zombies);
      }
      return;
    }
    isDragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.classList.add('dragging');
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 0) mouseDown = false;
    if (!isDragging) return;
    isDragging = false;
    canvas.classList.remove('dragging');
  });
  window.addEventListener('blur', () => {
    mouseDown = false;
    isDragging = false;
    hoverLastX = null;
    hoverLastY = null;
  });
  canvas.addEventListener('mouseleave', () => {
    hoverLastX = null;
    hoverLastY = null;
  });
  window.addEventListener('mousemove', e => {
    if (mode === 'walk' && controlMode === 'nomouse') return;
    if (mode === 'walk' && !zombies.game.talentOpen && !zombies.game.gameOver) {
      if (document.pointerLockElement === canvas) {
        glide = null;
        player.yaw -= e.movementX * 0.0022;
        player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - e.movementY * 0.0022));
      } else if (controlMode === 'mouse' && e.target === canvas) {
        const dx = (hoverLastX !== null) ? (e.clientX - hoverLastX) : 0;
        const dy = (hoverLastY !== null) ? (e.clientY - hoverLastY) : 0;
        hoverLastX = e.clientX;
        hoverLastY = e.clientY;
        if (Math.abs(dx) < 90 && Math.abs(dy) < 90 && (dx !== 0 || dy !== 0)) {
          glide = null;
          player.yaw -= dx * 0.0032;
          player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.0028));
        }
      }
    } else if (isDragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (mode === 'walk') {
        glide = null;
        player.yaw -= dx * 0.0035;
        player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.0035));
      } else {
        orbit.yaw -= dx * 0.005;
        orbit.pitch = Math.max(0.25, Math.min(1.48, orbit.pitch + dy * 0.005));
      }
    }
  });
  canvas.addEventListener('wheel', e => {
    if (mode === 'dollhouse') {
      orbit.dist = Math.max(6.5, Math.min(30, orbit.dist + e.deltaY * 0.012));
    }
  }, { passive: true });

  document.addEventListener('pointerlockchange', () => {
    const locked = (document.pointerLockElement === canvas);
    document.body.classList.toggle('pointer-locked', locked);
    canvas.classList.toggle('locked', locked);
  });

  // Touch support (1-finger look / 2-finger pinch or move)
  let touchPrev = null;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && touchPrev) {
      const dx = e.touches[0].clientX - touchPrev.x, dy = e.touches[0].clientY - touchPrev.y;
      touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (mode === 'walk') {
        player.yaw -= dx * 0.004;
        player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.004));
      } else {
        orbit.yaw -= dx * 0.005;
        orbit.pitch = Math.max(0.25, Math.min(1.48, orbit.pitch + dy * 0.005));
      }
    }
  }, { passive: true });

  // ==================== DOOR INTERACTION ====================
  const raycaster = new THREE.Raycaster();
  const doorTargets = [];
  arch.doors.forEach(d => {
    if (d.type === 'sliding') doorTargets.push(d.mesh);
    else d.pivot.traverse(c => { if (c.isMesh) doorTargets.push(c); });
  });

  function raycastDoorFromCenterOrMouse(e) {
    const ndc = new THREE.Vector2(0, 0);
    if (document.pointerLockElement !== canvas && e) {
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(doorTargets, false);
    if (hits.length && hits[0].distance < 2.8) return hits[0].object.userData.doorRef || null;
    return null;
  }

  function toggleDoor(d) {
    if (!d) return;
    d.isOpen = !d.isOpen;
    arch.colliders[d.colliderIdx].enabled = !d.isOpen;
  }

  function toggleNearestDoor() {
    const hit = raycastDoorFromCenterOrMouse(null);
    if (hit) { toggleDoor(hit); return; }
    // Fallback: closest door within 2.2m
    let best = null, bestD = 2.2;
    const tmp = new THREE.Vector3();
    for (const d of arch.doors) {
      (d.pivot || d.mesh).getWorldPosition(tmp);
      const dist = Math.hypot(tmp.x - player.pos.x, tmp.z - player.pos.z);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    if (best) toggleDoor(best);
  }

  // Doors are fixed and cannot be opened/closed manually by the player
  document.getElementById('btn-doors')?.remove();

  // Help card toggle (optional if removed from HUD)
  const helpCard = document.getElementById('help-card');
  if (helpCard) {
    document.getElementById('help-close')?.addEventListener('click', () => helpCard.style.display = 'none');
    document.getElementById('btn-help')?.addEventListener('click', () => {
      helpCard.style.display = helpCard.style.display === 'none' ? 'block' : 'none';
    });
  }

  // ==================== COLLISION RESOLUTION ====================
  function isOnLawn(x, z) {
    x /= S; z /= S;
    if (x > 10.02) return true;
    if (x > 7.72 && z > 6.68) return true;
    if (z < -0.78 || z > 10.60 || x < -0.15) return true;
    return false;
  }

  function resolveCollisions(pos) {
    const r = 0.16;
    // Outer playable perimeter clamp (includes front lawn up to hedge & courtyard)
    pos.x = Math.max(-1.2 * S, Math.min(12.25 * S, pos.x));
    pos.z = Math.max(-2.5 * S, Math.min(12.2 * S, pos.z));

    for (let iter = 0; iter < 2; iter++) {
      for (const c of arch.colliders) {
        if (!c.enabled) continue;
        if (c.kind === 'seg') {
          const vx = c.x2 - c.x1, vz = c.z2 - c.z1;
          const len2 = vx * vx + vz * vz;
          if (len2 < 1e-6) continue;
          let t = ((pos.x - c.x1) * vx + (pos.z - c.z1) * vz) / len2;
          t = Math.max(0, Math.min(1, t));
          const cx = c.x1 + t * vx, cz = c.z1 + t * vz;
          const dx = pos.x - cx, dz = pos.z - cz;
          const dist = Math.hypot(dx, dz);
          const minD = r + c.pad;
          if (dist < minD) {
            if (dist > 1e-5) {
              const push = minD - dist;
              pos.x += (dx / dist) * push;
              pos.z += (dz / dist) * push;
            }
          }
        } else if (c.kind === 'box') {
          if (c.topY !== undefined && (pos.y - 1.46) >= c.topY - 0.14) continue;
          const cx = Math.max(c.minX, Math.min(c.maxX, pos.x));
          const cz = Math.max(c.minZ, Math.min(c.maxZ, pos.z));
          const dx = pos.x - cx, dz = pos.z - cz;
          const dist = Math.hypot(dx, dz);
          if (dist < r) {
            if (dist > 1e-5) {
              const push = r - dist;
              pos.x += (dx / dist) * push;
              pos.z += (dz / dist) * push;
            } else {
              pos.z = c.minZ - r;
            }
          }
        }
      }
    }
  }

  // ==================== ROOM DETECTOR & MINIMAP ====================
  function detectRoom(x, z) {
    x /= S; z /= S;
    if (isOnLawn(x * S, z * S)) return 'Plen';
    if (x > 8.05 || (x > 5.85 && z < 2.85 && z > -0.75 && x + (z - 1.2) > 7.1)) return 'Terrasse';
    if (x < 3.16 && z >= 2.66 && z <= 6.18) return 'Soverom';
    if (x < 3.16 && z > 6.18 && z <= 8.10) return 'Bad';
    if (x < 3.16 && z > 8.10) return 'Soverom';
    if (x >= 4.69 && z >= 6.58 && z <= 9.00) return 'Soverom';
    if (x >= 5.26 && z > 9.00) return 'Bod';
    if (x >= 3.16 && x <= 4.69 && z >= 6.58) return 'Entre';
    if (x < 3.22 && z < 2.66) return 'Kjøkken';
    return 'Stue';
  }

  const mm = document.getElementById('minimap');
  const mctx = mm.getContext('2d');
  // Map world [-0.5..12.6, -1.0..12.0] -> [210 x 245]
  const MM_SCALE = 15.2, MM_OX = 12, MM_OZ = 22;
  function toMM(x, z) { return [MM_OX + x * MM_SCALE, MM_OZ + z * MM_SCALE]; }
  function toMMW(wx, wz) { return toMM(wx / S, wz / S); }
  function fromMM(px, py) { return [((px - MM_OX) / MM_SCALE) * S, ((py - MM_OZ) / MM_SCALE) * S]; }

  mm.addEventListener('click', e => {
    const rect = mm.getBoundingClientRect();
    const [wx, wz] = fromMM(e.clientX - rect.left, e.clientY - rect.top);
    const ux = wx / S, uz = wz / S;
    if (ux >= -0.8 && ux <= 12.1 && uz >= -1.8 && uz <= 11.8) {
      if (mode === 'dollhouse') setMode('walk');
      const eyeY = isOnLawn(wx, wz) ? 1.30 : 1.46;
      glide = {
        fromPos: player.pos.clone(), toPos: new THREE.Vector3(wx, eyeY, wz),
        fromYaw: player.yaw, dYaw: 0,
        fromPitch: player.pitch, dPitch: 0,
        t: 0, dur: 0.45
      };
    }
  });

  function drawMinimap() {
    mctx.clearRect(0, 0, mm.width, mm.height);
    // Front grass lawn strip
    mctx.fillStyle = 'rgba(92, 141, 64, 0.24)';
    const [gx0, gz0] = toMM(7.55, -0.8);
    mctx.fillRect(gx0, gz0, 4.9 * MM_SCALE, 12.8 * MM_SCALE);

    // Terrace
    mctx.fillStyle = 'rgba(182, 138, 92, 0.35)';
    mctx.beginPath();
    mctx.moveTo(...toMM(5.80, -0.68));
    mctx.lineTo(...toMM(9.45, -0.68));
    mctx.lineTo(...toMM(9.93, 2.20));
    mctx.lineTo(...toMM(9.93, 6.62));
    mctx.lineTo(...toMM(8.03, 6.62));
    mctx.lineTo(...toMM(8.03, 2.82));
    mctx.lineTo(...toMM(7.52, 2.82));
    mctx.lineTo(...toMM(5.80, 1.15));
    mctx.closePath();
    mctx.fill();

    // Terrace railing outline with opening to grass (Z = 4.35..5.45)
    mctx.strokeStyle = 'rgba(232, 207, 160, 0.72)';
    mctx.lineWidth = 1.5;
    mctx.beginPath();
    mctx.moveTo(...toMM(5.90, -0.68));
    mctx.lineTo(...toMM(9.45, -0.68));
    mctx.lineTo(...toMM(9.93, 2.20));
    mctx.lineTo(...toMM(9.93, 4.35));
    mctx.moveTo(...toMM(9.93, 5.45));
    mctx.lineTo(...toMM(9.93, 6.62));
    mctx.lineTo(...toMM(8.13, 6.62));
    mctx.stroke();

    // Apartment interior fill
    mctx.fillStyle = 'rgba(220, 206, 178, 0.22)';
    mctx.beginPath();
    mctx.moveTo(...toMM(0, 0));
    mctx.lineTo(...toMM(3.20, 0));
    mctx.lineTo(...toMM(3.20, -0.50));
    mctx.lineTo(...toMM(5.80, -0.50));
    mctx.lineTo(...toMM(5.80, 1.20));
    mctx.lineTo(...toMM(7.52, 2.92));
    mctx.lineTo(...toMM(8.03, 2.92));
    mctx.lineTo(...toMM(8.03, 6.58));
    mctx.lineTo(...toMM(7.55, 6.58));
    mctx.lineTo(...toMM(7.55, 10.36));
    mctx.lineTo(...toMM(0, 10.36));
    mctx.closePath();
    mctx.fill();

    // Bath blue tint
    mctx.fillStyle = 'rgba(110, 175, 225, 0.28)';
    const [bx0, bz0] = toMM(0, 6.24);
    mctx.fillRect(bx0, bz0, 3.10 * MM_SCALE, 1.80 * MM_SCALE);

    // Walls outline
    mctx.strokeStyle = 'rgba(245, 245, 244, 0.65)';
    mctx.lineWidth = 1.6;
    mctx.stroke();

    // Interior walls lines
    const lines = [
      [0, 2.66, 3.16, 2.66], [3.16, 2.66, 3.16, 10.36],
      [0, 6.18, 3.16, 6.18], [0, 8.10, 3.16, 8.10],
      [4.69, 6.58, 7.55, 6.58], [4.69, 6.58, 4.69, 9.00],
      [4.69, 9.00, 7.55, 9.00], [5.26, 9.00, 5.26, 10.36]
    ];
    mctx.beginPath();
    for (const [x1, z1, x2, z2] of lines) {
      mctx.moveTo(...toMM(x1, z1));
      mctx.lineTo(...toMM(x2, z2));
    }
    mctx.stroke();

    // Room labels
    mctx.fillStyle = 'rgba(240, 240, 240, 0.72)';
    mctx.font = '9px sans-serif';
    mctx.textAlign = 'center';
    const labels = [
      ['Kjøkken', 1.6, 1.3], ['Stue', 5.4, 3.6], ['Terrasse', 8.9, 1.6],
      ['Sov 10.5', 1.55, 4.4], ['Bad', 1.55, 7.2], ['Sov 6.5', 1.55, 9.3],
      ['Entre', 3.9, 8.5], ['Sov 6.5', 6.1, 7.8], ['Bod', 6.4, 9.7]
    ];
    for (const [txt, lx, lz] of labels) mctx.fillText(txt, ...toMM(lx, lz));

    // Player cone & dot
    const [px, py] = toMMW(player.pos.x, player.pos.z);
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    const ang = Math.atan2(fz, fx);
    mctx.fillStyle = 'rgba(232, 207, 160, 0.35)';
    mctx.beginPath();
    mctx.moveTo(px, py);
    mctx.arc(px, py, 24, ang - 0.45, ang + 0.45);
    mctx.closePath();
    mctx.fill();

    mctx.fillStyle = '#e8cfa0';
    mctx.beginPath();
    mctx.arc(px, py, 4.2, 0, Math.PI * 2);
    mctx.fill();

    // Live Minecraft Zombie dots + Immortal Black Cat companion on minimap
    if (zombies.game.active) {
      for (const zd of zombies.getMinimapDots()) {
        if (zd.dying) continue;
        const [zx, zy] = toMMW(zd.x, zd.z);
        mctx.fillStyle = '#5bd948';
        mctx.strokeStyle = '#ff2e2e';
        mctx.lineWidth = 1.3;
        mctx.beginPath();
        mctx.arc(zx, zy, 3.3, 0, Math.PI * 2);
        mctx.fill();
        mctx.stroke();
      }
      if (zombies.getCatDot) {
        const cd = zombies.getCatDot();
        if (cd) {
          const [cx, cy] = toMMW(cd.x, cd.z);
          mctx.fillStyle = '#050608';
          mctx.strokeStyle = cd.hunting ? '#ff9f1a' : '#7cff4d';
          mctx.lineWidth = 1.5;
          mctx.beginPath();
          mctx.arc(cx, cy, 3.0, 0, Math.PI * 2);
          mctx.fill();
          mctx.stroke();
        }
      }
      if (zombies.getIsaDot) {
        const idot = zombies.getIsaDot();
        if (idot) {
          const [ix, iy] = toMMW(idot.x, idot.z);
          mctx.fillStyle = '#ffffff';
          mctx.strokeStyle = '#ff3b30';
          mctx.lineWidth = 1.6;
          mctx.beginPath();
          mctx.arc(ix, iy, 3.8, 0, Math.PI * 2);
          mctx.fill();
          mctx.stroke();
        }
      }
      if (zombies.getNoodleState) {
        const ns = zombies.getNoodleState();
        if (ns.active) {
          const [nx, ny] = toMMW(ns.x, ns.z);
          mctx.fillStyle = '#ffbe2e';
          mctx.strokeStyle = '#ffffff';
          mctx.lineWidth = 1.0;
          mctx.fillRect(nx - 2.6, ny - 2.6, 5.2, 5.2);
          mctx.strokeRect(nx - 2.6, ny - 2.6, 5.2, 5.2);
        }
      }
      if (zombies.getHomeworkState) {
        const hs = zombies.getHomeworkState();
        if (hs.active) {
          const [hx, hy] = toMMW(hs.x, hs.z);
          mctx.fillStyle = '#59c8ff';
          mctx.strokeStyle = '#ffffff';
          mctx.lineWidth = 1.2;
          mctx.fillRect(hx - 3.0, hy - 3.0, 6.0, 6.0);
          mctx.strokeRect(hx - 3.0, hy - 3.0, 6.0, 6.0);
        }
      }
      if (zombies.getAmmoStates) {
        for (const am of zombies.getAmmoStates()) {
          if (!am.active) continue;
          const [ax, ay] = toMMW(am.x, am.z);
          mctx.fillStyle = '#176fd6';
          mctx.strokeStyle = '#ff621a';
          mctx.lineWidth = 1.4;
          mctx.fillRect(ax - 3.2, ay - 2.6, 6.4, 5.2);
          mctx.strokeRect(ax - 3.2, ay - 2.6, 6.4, 5.2);
        }
      }
    }
  }

  // ==================== MAIN ANIMATION LOOP ====================
  const clock = new THREE.Clock();
  const roomInd = document.getElementById('room-indicator');
  const promptEl = document.getElementById('interact-prompt');
  const hwProgressWrap = document.getElementById('hw-progress-wrap');
  const hwProgressFill = document.getElementById('hw-progress-fill');
  const hwWriteAnim = document.getElementById('hw-write-anim');
  const hwAnimCanvas = document.getElementById('hw-anim-canvas');

  // High-DPI 2D canvas renderer: open 3D hardcover notebook + live writing hexagonal pencil
  function renderHomeworkAnim(canvas, frac, t) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const p = Math.max(0, Math.min(1, frac));

    // Ambient warm study-lamp glow behind open textbook
    const aura = ctx.createRadialGradient(310, 225, 25, 310, 225, 275);
    aura.addColorStop(0, `rgba(56, 189, 248, ${0.22 + Math.sin(t * 3.5) * 0.05})`);
    aura.addColorStop(0.55, 'rgba(250, 204, 21, 0.14)');
    aura.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);

    // Book drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.52)';
    ctx.beginPath();
    ctx.roundRect(62, 108, 496, 250, 18);
    ctx.fill();
    ctx.restore();

    // Navy leather hardcover with brass corner protectors
    const coverGrad = ctx.createLinearGradient(64, 96, 556, 354);
    coverGrad.addColorStop(0, '#2563eb');
    coverGrad.addColorStop(0.5, '#1e3a8a');
    coverGrad.addColorStop(1, '#172554');
    ctx.fillStyle = coverGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(66, 98, 488, 248, 16);
    ctx.fill();
    ctx.stroke();

    // Brass corner guards
    ctx.fillStyle = '#fbbf24';
    for (const [cx, cy, sx, sy] of [[68, 100, 1, 1], [552, 100, -1, 1], [68, 344, 1, -1], [552, 344, -1, -1]]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sx * 26, cy);
      ctx.lineTo(cx, cy + sy * 26);
      ctx.closePath();
      ctx.fill();
    }

    // Stacked fanned page edges under spread
    for (let layer = 3; layer >= 1; layer--) {
      ctx.fillStyle = layer % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(78 + layer * 2, 104 + layer * 3.5, 464 - layer * 4, 234, 8);
      ctx.fill();
      ctx.stroke();
    }

    // Swaying red silk bookmark ribbon below spine
    const sway = Math.sin(t * 2.8) * 7;
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(304, 332);
    ctx.lineTo(316, 332);
    ctx.quadraticCurveTo(316 + sway * 0.5, 358, 318 + sway, 378);
    ctx.lineTo(310 + sway, 369);
    ctx.lineTo(302 + sway, 378);
    ctx.quadraticCurveTo(304 + sway * 0.5, 358, 304, 332);
    ctx.fill();
    ctx.stroke();

    // Left curved open page
    const leftGrad = ctx.createLinearGradient(82, 0, 310, 0);
    leftGrad.addColorStop(0, '#fefce8');
    leftGrad.addColorStop(0.82, '#fffbeb');
    leftGrad.addColorStop(1, '#d6d3d1');
    ctx.fillStyle = leftGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(84, 108);
    ctx.quadraticCurveTo(198, 92, 310, 114);
    ctx.lineTo(310, 334);
    ctx.quadraticCurveTo(198, 314, 84, 328);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right curved open page
    const rightGrad = ctx.createLinearGradient(310, 0, 538, 0);
    rightGrad.addColorStop(0, '#cbd5e1');
    rightGrad.addColorStop(0.14, '#fffbeb');
    rightGrad.addColorStop(1, '#fef9c3');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(310, 114);
    ctx.quadraticCurveTo(422, 92, 536, 108);
    ctx.lineTo(536, 328);
    ctx.quadraticCurveTo(422, 314, 310, 334);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ruled notebook lines & red margins on both pages
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.30)';
    ctx.lineWidth = 1.4;
    for (let r = 0; r < 6; r++) {
      const y = 148 + r * 30;
      ctx.beginPath();
      ctx.moveTo(96, y - 3);
      ctx.quadraticCurveTo(202, y - 12, 298, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(322, y);
      ctx.quadraticCurveTo(420, y - 12, 524, y - 3);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.42)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(122, 107); ctx.lineTo(122, 322); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(346, 110); ctx.lineTo(346, 325); ctx.stroke();

    // Left page geometry diagram & neat equations
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(144, 214); ctx.lineTo(246, 214); ctx.lineTo(144, 148); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeRect(144, 200, 14, 14);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('a² + b² = c²', 142, 246);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('2x + 5 = 17', 142, 276);
    ctx.fillStyle = '#15803d';
    ctx.fillText('x = 6  ✓', 142, 304);
    ctx.restore();

    // Center spine crease shadow
    const crease = ctx.createLinearGradient(294, 0, 326, 0);
    crease.addColorStop(0, 'rgba(15, 23, 42, 0)');
    crease.addColorStop(0.5, 'rgba(15, 23, 42, 0.28)');
    crease.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = crease;
    ctx.fillRect(294, 108, 32, 226);

    // Live progressive handwriting strokes on right page (4 cursive lines + green checkmark)
    const lines = [
      { y: 145, len: 146, col: '#0f172a', seed: 1.1 },
      { y: 175, len: 138, col: '#0f172a', seed: 2.7 },
      { y: 205, len: 152, col: '#1d4ed8', seed: 4.3 },
      { y: 235, len: 126, col: '#0f172a', seed: 5.9 },
      { y: 265, len: 110, col: '#15803d', seed: 7.4 }
    ];
    const writeSpan = Math.min(1, p / 0.88);
    const totalLen = lines.reduce((s, l) => s + l.len, 0);
    let drawnTarget = writeSpan * totalLen;
    let tipX = 358, tipY = 145;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let li = 0; li < lines.length; li++) {
      const ln = lines[li];
      const take = Math.max(0, Math.min(ln.len, drawnTarget));
      drawnTarget -= ln.len;
      if (take <= 0) break;

      ctx.strokeStyle = ln.col;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      const steps = Math.max(2, Math.floor(take / 3));
      for (let s = 0; s <= steps; s++) {
        const px = 356 + (take * s) / steps;
        const dx = px - 356;
        // Skip small word spaces cleanly while creating organic handwriting waves
        const wave = Math.sin(dx * 0.34 + ln.seed) * 4.5 + Math.cos(dx * 0.85 + ln.seed * 2) * 2.2;
        const arcY = ln.y - Math.sin(((px - 322) / 202) * Math.PI) * 5 + wave;
        if (s === 0) ctx.moveTo(px, arcY);
        else ctx.lineTo(px, arcY);
        if (s === steps) {
          tipX = px;
          tipY = arcY;
        }
      }
      ctx.stroke();
    }

    // Bold completion checkmark when finishing (> 88%)
    if (p > 0.88) {
      const cp = Math.min(1, (p - 0.88) / 0.12);
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(476, 282);
      if (cp < 0.45) {
        const k = cp / 0.45;
        tipX = 476 + 14 * k;
        tipY = 282 + 16 * k;
        ctx.lineTo(tipX, tipY);
      } else {
        const k = (cp - 0.45) / 0.55;
        ctx.lineTo(490, 298);
        tipX = 490 + 28 * k;
        tipY = 298 - 32 * k;
        ctx.lineTo(tipX, tipY);
      }
      ctx.stroke();
    }

    // Subtle fast pen-tip jitter while actively writing
    const jx = tipX + Math.sin(t * 28) * 1.4;
    const jy = tipY + Math.cos(t * 24) * 1.1;

    // Focus spark burst right at the graphite contact point
    const glow = ctx.createRadialGradient(jx, jy, 1, jx, jy, 24);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
    glow.addColorStop(0.45, 'rgba(250, 204, 21, 0.45)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(jx, jy, 24, 0, Math.PI * 2);
    ctx.fill();

    // Floating magic focus motes rising from pencil tip
    for (let m = 0; m < 6; m++) {
      const mp = (t * 1.9 + m * 0.17) % 1;
      const mx = jx + Math.sin(m * 2.3 + t * 5) * (10 + mp * 18);
      const my = jy - mp * 52;
      ctx.fillStyle = m % 2 === 0
        ? `rgba(125, 211, 252, ${(1 - mp) * 0.9})`
        : `rgba(253, 224, 71, ${(1 - mp) * 0.85})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2.2 + (1 - mp) * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pencil cast shadow on the cream notebook page
    ctx.save();
    ctx.translate(jx + 6, jy + 12);
    ctx.rotate(-0.42 + Math.sin(t * 16) * 0.03);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.20)';
    ctx.beginPath();
    ctx.ellipse(76, 4, 82, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3D Faceted Hexagonal Golden Pencil anchored cleanly at (jx, jy)
    ctx.save();
    ctx.translate(jx, jy);
    ctx.rotate(-0.66 + Math.sin(t * 18) * 0.045 + Math.cos(t * 11) * 0.025);

    // Turned cedar wood sharpening cone + dark graphite tip
    const woodGrad = ctx.createLinearGradient(0, -10, 0, 10);
    woodGrad.addColorStop(0, '#ffedd5');
    woodGrad.addColorStop(0.55, '#fdba74');
    woodGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(32, -10);
    ctx.lineTo(35, -4);
    ctx.lineTo(32, 0);
    ctx.lineTo(35, 5);
    ctx.lineTo(32, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metallic graphite lead core
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, -3.8);
    ctx.lineTo(12, 3.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(1, -0.3);
    ctx.lineTo(11, -3.2);
    ctx.lineTo(11, -1.2);
    ctx.closePath();
    ctx.fill();

    // 3-facet hexagonal yellow lacquer barrel
    ctx.fillStyle = '#fef08a'; // top highlight facet
    ctx.fillRect(33, -10, 114, 6);
    ctx.fillStyle = '#f59e0b'; // center amber facet
    ctx.fillRect(33, -4, 114, 8);
    ctx.fillStyle = '#b45309'; // bottom shaded facet
    ctx.fillRect(33, 4, 114, 6);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(33, -10, 114, 20);
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('HB', 122, 3.5);

    // Brushed aluminum ferrule with raised crimp rings
    const ferrGrad = ctx.createLinearGradient(0, -10, 0, 10);
    ferrGrad.addColorStop(0, '#f8fafc');
    ferrGrad.addColorStop(0.5, '#cbd5e1');
    ferrGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = ferrGrad;
    ctx.strokeStyle = '#475569';
    ctx.fillRect(147, -10.5, 22, 21);
    ctx.strokeRect(147, -10.5, 22, 21);
    ctx.beginPath();
    ctx.moveTo(153, -10); ctx.lineTo(153, 10);
    ctx.moveTo(162, -10); ctx.lineTo(162, 10);
    ctx.stroke();

    // Soft coral-pink rubber eraser with glossy highlight
    const erGrad = ctx.createLinearGradient(0, -10, 0, 10);
    erGrad.addColorStop(0, '#fda4af');
    erGrad.addColorStop(0.55, '#f43f5e');
    erGrad.addColorStop(1, '#be123c');
    ctx.fillStyle = erGrad;
    ctx.strokeStyle = '#881337';
    ctx.beginPath();
    ctx.roundRect(169, -10, 22, 20, [0, 7, 7, 0]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.roundRect(172, -7, 14, 3.5, 2);
    ctx.fill();

    ctx.restore();
  }
  const hwHudSep = document.getElementById('hw-hud-sep');
  const hwHud = document.getElementById('hw-hud');
  const hwTimerEl = document.getElementById('hw-timer');
  const hwBigBanner = document.getElementById('hw-big-banner');
  const hwBigSub = document.getElementById('hw-big-sub');
  const hwBigSec = document.getElementById('hw-big-sec');
  const hwBigFill = document.getElementById('hw-big-fill');
  const hpFill = document.getElementById('hp-fill');
  const hpText = document.getElementById('hp-text');
  const waveText = document.getElementById('wave-text');
  const zleftText = document.getElementById('zleft-text');
  const scoreText = document.getElementById('score-text');
  const ammoCur = document.getElementById('ammo-cur');
  const ammoRes = document.getElementById('ammo-res');
  const waveBanner = document.getElementById('wave-banner');
  const hurtVignette = document.getElementById('hurt-vignette');
  const noodleSpinEl = document.getElementById('noodle-spin-overlay');
  const hitMarker = document.getElementById('hit-marker');
  const gameOverOverlay = document.getElementById('gameover-overlay');
  const gameOverStats = document.getElementById('gameover-stats');
  const talentOverlay = document.getElementById('talent-overlay');
  const talentTitle = document.getElementById('talent-title');
  const talentGrid = document.getElementById('talent-grid');
  const skillsHud = document.getElementById('skills-hud');
  let lastTalentOpenState = false;

  function renderTalentTree() {
    if (!talentGrid || !zombies.TALENT_COLS || !zombies.TALENT_NODES) return;
    if (talentTitle) talentTitle.textContent = `Velg ferdighet — Nivå ${zombies.game.level || 1}`;
    talentGrid.innerHTML = '';
    for (const col of zombies.TALENT_COLS) {
      const colEl = document.createElement('div');
      colEl.className = 'talent-col';
      const headEl = document.createElement('div');
      headEl.className = 'talent-col-head';
      headEl.textContent = col.title;
      colEl.appendChild(headEl);

      const nodes = zombies.TALENT_NODES
        .filter(n => n.col === col.id)
        .sort((a, b) => a.row - b.row);

      nodes.forEach((node, idx) => {
        if (idx > 0) {
          const arr = document.createElement('div');
          arr.className = 'talent-arrow';
          arr.textContent = '↓';
          colEl.appendChild(arr);
        }
        const unlocked = zombies.isTalentUnlocked(node);
        const curLvl = zombies.talents[node.id] || 0;
        const isPlaceholder = node.maxLvl <= 0;
        const isMaxed = !isPlaceholder && curLvl >= node.maxLvl;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'talent-node ' + (
          !unlocked ? 'locked' : (isPlaceholder ? 'placeholder' : (isMaxed ? 'maxed' : 'available'))
        );

        const icons = window.TALENT_ICONS || {};
        if (icons[node.id]) {
          const img = document.createElement('img');
          img.className = 'talent-icon';
          img.src = icons[node.id];
          img.alt = node.title;
          btn.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'talent-icon-lock';
          ph.textContent = '?';
          btn.appendChild(ph);
        }

        const body = document.createElement('div');
        body.className = 'talent-body';

        const top = document.createElement('div');
        top.className = 'talent-node-top';
        const title = document.createElement('strong');
        title.textContent = node.title;
        const badge = document.createElement('span');
        badge.className = 'talent-lvl';
        if (!unlocked) badge.textContent = 'Låst';
        else if (isPlaceholder) badge.textContent = 'Opplåst';
        else badge.textContent = `${curLvl} / ${node.maxLvl}`;
        top.appendChild(title);
        top.appendChild(badge);

        const desc = document.createElement('div');
        desc.className = 'talent-desc';
        desc.textContent = node.desc;

        body.appendChild(top);
        body.appendChild(desc);
        btn.appendChild(body);

        if (unlocked && !isPlaceholder && !isMaxed) {
          btn.addEventListener('click', () => {
            if (zombies.chooseTalent(node.id)) {
              talentOverlay?.classList.remove('show');
              lastTalentOpenState = false;
              hoverLastX = null;
              hoverLastY = null;
              lockGamePointer();
            }
          });
        } else {
          btn.disabled = true;
        }
        colEl.appendChild(btn);
      });
      talentGrid.appendChild(colEl);
    }
    if (!zombies.hasSelectableTalent()) {
      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'room-btn active';
      skipBtn.textContent = 'Fortsett spill';
      skipBtn.addEventListener('click', () => {
        zombies.skipTalentIfFull();
        hoverLastX = null;
        hoverLastY = null;
        lockGamePointer();
      });
      talentGrid.appendChild(skipBtn);
    }
  }

  function syncSkillsHud(gState) {
    if (!skillsHud) return;
    const t = zombies.talents || {};
    const icons = window.TALENT_ICONS || {};
    const iconImg = (id) => icons[id] ? `<img class="skill-chip-icon" src="${icons[id]}" alt="">` : '';
    const chips = [];
    if (t.spark > 0) {
      const cd = gState.kickCooldown;
      chips.push(`<div class="skill-chip ${cd <= 0 ? 'ready' : 'cooling'}">${iconImg('spark')}<strong>[Q] Spark (${t.spark * 2}m)</strong><span>${cd <= 0 ? 'Klar' : cd.toFixed(1) + 's'}</span></div>`);
    }
    if (t.armor > 0) {
      chips.push(`<div class="skill-chip ready">${iconImg('armor')}<strong>Tykke klær</strong><span>30% mindre skade</span></div>`);
    }
    if (t.iq > 0) {
      const hwSec = Math.max(0.05, 3 - t.iq);
      chips.push(`<div class="skill-chip ready">${iconImg('iq')}<strong>Høyere IQ (${t.iq})</strong><span>${hwSec <= 0.1 ? 'Øyeblikkelig' : hwSec + 's lekser'}</span></div>`);
    }
    if (t.taurus > 0) {
      const tDmg = +(t.taurus * 0.5).toFixed(1);
      chips.push(`<div class="skill-chip ready">${iconImg('taurus')}<strong>Taurus</strong><span>Skade ${tDmg}</span></div>`);
    }
    if (t.isa > 0) {
      const act = gState.isaActiveT;
      const icd = gState.isaCooldown;
      const cls = (act > 0 || icd <= 0) ? 'ready' : 'cooling';
      const st = act > 0 ? `Aktiv ${act.toFixed(1)}s` : (icd <= 0 ? 'Klar' : `${Math.ceil(icd)}s`);
      chips.push(`<div class="skill-chip ${cls}">${iconImg('isa')}<strong>[C] Isa</strong><span>${st}</span></div>`);
    }
    if (t.pack > 0) {
      chips.push(`<div class="skill-chip ready">${iconImg('pack')}<strong>Lojal flokk (${t.pack})</strong><span>+${t.pack * 3} HP/kill</span></div>`);
    }
    if (t.grenade > 0) {
      const gcd = gState.grenadeCooldown;
      chips.push(`<div class="skill-chip ${gcd <= 0 ? 'ready' : 'cooling'}">${iconImg('grenade')}<strong>[G / H.klikk] Granat</strong><span>${gcd <= 0 ? 'Klar' : Math.ceil(gcd) + 's'}</span></div>`);
    }
    if (t.pierce > 0) {
      chips.push(`<div class="skill-chip ready">${iconImg('pierce')}<strong>Gjennomskudd</strong><span>Aktiv</span></div>`);
    }
    if (t.fire > 0) {
      const dmg = Math.min(5, 1 + t.fire);
      chips.push(`<div class="skill-chip ready">${iconImg('fire')}<strong>Ildkuler (${t.fire})</strong><span>${dmg} skade/skudd</span></div>`);
    }
    skillsHud.innerHTML = chips.join('');
    skillsHud.classList.toggle('has-skills', chips.length > 0);
  }

  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());

    // Smoothly animate doors
    for (const d of arch.doors) {
      if (d.type === 'hinged') {
        const target = d.isOpen ? d.openAngle : d.closedAngle;
        d.pivot.rotation.y += (target - d.pivot.rotation.y) * Math.min(1, dt * 10);
      } else {
        const target = d.isOpen ? d.openX : d.closedX;
        d.mesh.position.x += (target - d.mesh.position.x) * Math.min(1, dt * 10);
      }
    }

    let isMoving = false;
    if (mode === 'walk') {
      if (glide) {
        glide.t += dt / glide.dur;
        const u = Math.min(1, glide.t);
        const s = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        player.pos.lerpVectors(glide.fromPos, glide.toPos, s);
        player.yaw = glide.fromYaw + glide.dYaw * s;
        player.pitch = glide.fromPitch + glide.dPitch * s;
        if (u >= 1) glide = null;
      }

      // WASD / Arrow movement
      let fwd = 0, str = 0, turn = 0;
      if (!zombies.game.gameOver && !zombies.game.talentOpen) {
        if (keys['KeyW'] || keys['ArrowUp']) fwd += 1;
        if (keys['KeyS'] || keys['ArrowDown']) fwd -= 1;
        if (keys['KeyD']) str += 1;
        if (keys['KeyA']) str -= 1;
        if (controlMode === 'nomouse') {
          if (keys['ArrowLeft']) turn += 1;
          if (keys['ArrowRight']) turn -= 1;
        } else {
          if (keys['ArrowRight']) str += 1;
          if (keys['ArrowLeft']) str -= 1;
        }
      }
      if (controlMode === 'nomouse') {
        if (turn !== 0) {
          glide = null;
          player.yaw += turn * 2.25 * dt;
        }
        player.pitch = 0;
      }

      if (fwd !== 0 || str !== 0) {
        isMoving = true;
        glide = null;
        const len = Math.hypot(fwd, str);
        fwd /= len; str /= len;
        const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? 3.8 : 2.25;
        const sinY = Math.sin(player.yaw), cosY = Math.cos(player.yaw);
        // Forward = (-sinY, -cosY), Right = (cosY, -sinY)
        const mx = (-sinY * fwd + cosY * str) * speed * dt;
        const mz = (-cosY * fwd - sinY * str) * speed * dt;
        player.pos.x += mx;
        player.pos.z += mz;
        resolveCollisions(player.pos);
        player.bobPhase += dt * speed * 4.2;
      }

      // Vertical jump & gravity physics + smooth lawn/floor/tabletop surface height
      let floorSurfaceY = isOnLawn(player.pos.x, player.pos.z) ? -0.16 : 0;
      const feetY = player.pos.y - 1.46;
      for (const c of arch.colliders) {
        if (!c.enabled || c.kind !== 'box' || c.topY === undefined) continue;
        if (feetY >= c.topY - 0.16 &&
            player.pos.x >= c.minX - 0.10 && player.pos.x <= c.maxX + 0.10 &&
            player.pos.z >= c.minZ - 0.10 && player.pos.z <= c.maxZ + 0.10) {
          floorSurfaceY = Math.max(floorSurfaceY, c.topY);
        }
      }
      const groundEyeY = floorSurfaceY + 1.46;
      if (!player.grounded || player.pos.y > groundEyeY + 0.005 || player.velY > 0) {
        player.velY -= 14.2 * dt;
        player.pos.y += player.velY * dt;
        if (player.pos.y <= groundEyeY) {
          player.pos.y = groundEyeY;
          player.velY = 0;
          player.grounded = true;
        }
      } else {
        player.pos.y += (groundEyeY - player.pos.y) * Math.min(1, dt * 10);
        player.grounded = true;
      }

      const bobY = (isMoving && player.grounded) ? Math.sin(player.bobPhase) * 0.012 : 0;
      camera.position.set(player.pos.x, player.pos.y + bobY, player.pos.z);
      euler.set(player.pitch, player.yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      if (mouseDown && controlMode === 'mouse' && zombies.game.active && !zombies.game.gameOver && !zombies.game.talentOpen) {
        blaster.fire(zombies);
      }

      // Homework / Noodle / Ammo interaction prompt
      const hsPrompt = (zombies.game.active && !zombies.game.gameOver && zombies.getHomeworkState) ? zombies.getHomeworkState() : null;
      const nearHw = hsPrompt && hsPrompt.active && Math.hypot(player.pos.x - hsPrompt.x, player.pos.z - hsPrompt.z) < 2.15;
      const nsPrompt = (zombies.game.active && !zombies.game.gameOver && zombies.getNoodleState) ? zombies.getNoodleState() : null;
      const nearNoodles = !nearHw && nsPrompt && nsPrompt.active && Math.hypot(player.pos.x - nsPrompt.x, player.pos.z - nsPrompt.z) < 2.30;
      const ammoList = (zombies.game.active && !zombies.game.gameOver && zombies.getAmmoStates) ? zombies.getAmmoStates() : [];
      const nearAmmo = !nearHw && !nearNoodles && ammoList.some(p => p.active && Math.hypot(player.pos.x - p.x, player.pos.z - p.z) < 2.20);
      if (nearHw) {
        const needTxt = hsPrompt.needHold <= 0.1 ? 'Trykk E' : `Hold E (${hsPrompt.progress.toFixed(1)} / ${hsPrompt.needHold.toFixed(1)}s)`;
        promptEl.textContent = `Lekser på spisebordet — ${needTxt} • ${Math.ceil(hsPrompt.timeLeft)}s igjen`;
        promptEl.classList.add('show');
        if (hwProgressWrap && hwProgressFill) {
          hwProgressWrap.classList.add('show');
          hwProgressFill.style.width = `${Math.min(100, (hsPrompt.progress / hsPrompt.needHold) * 100)}%`;
        }
        if (hwWriteAnim) {
          const isWriting = !!(hsPrompt.holding && hsPrompt.progress > 0);
          hwWriteAnim.classList.toggle('show', isWriting);
          if (isWriting && hwAnimCanvas) {
            renderHomeworkAnim(hwAnimCanvas, hsPrompt.progress / hsPrompt.needHold, clock.elapsedTime);
          }
        }
      } else {
        if (hwProgressWrap) hwProgressWrap.classList.remove('show');
        if (hwWriteAnim) hwWriteAnim.classList.remove('show');
        if (nearNoodles) {
          promptEl.textContent = 'Varme nudler (+35 HP) — Trykk E for å spise';
          promptEl.classList.add('show');
        } else if (nearAmmo) {
          promptEl.textContent = 'Ammunisjonseske — Trykk E for å fylle ammo helt opp';
          promptEl.classList.add('show');
        } else {
          promptEl.classList.remove('show');
        }
      }
      if (roomInd) roomInd.textContent = detectRoom(player.pos.x, player.pos.z);

      // Update X-Shot Insanity blaster & Minecraft zombie horde
      if (zombies.game.active) {
        zombies.update(dt, player.pos, !!keys['KeyE']);
        blaster.update(dt, isMoving, zombies, curLightMood);
      }
    } else {
      // Dollhouse Orbit Camera
      const cx = orbit.target.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist;
      const cy = orbit.target.y + Math.sin(orbit.pitch) * orbit.dist;
      const cz = orbit.target.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist;
      camera.position.set(cx, cy, cz);
      camera.lookAt(orbit.target);
      promptEl.classList.remove('show');
      if (roomInd) roomInd.textContent = '3D Dukkehus-oversikt (Dra for å rotere, scroll for å zoome)';
    }

    // Sync Zombie & Blaster HUD
    if (zombies.game.active) {
      const gState = zombies.game;
      const aliveCount = gState.toSpawn + (zombies.isVipPending() ? 1 : 0) + zombies.getMinimapDots().filter(d => !d.dying).length;
      const hpPct = Math.max(0, Math.min(100, (gState.hp / (gState.maxHp || 100)) * 100));
      hpFill.style.width = `${hpPct}%`;
      hpFill.style.background = hpPct > 50 ? '#4cd964' : (hpPct > 25 ? '#ff9f0a' : '#ff3b30');
      hpText.textContent = Math.ceil(gState.hp);
      if (hwHud && hwHudSep && hwTimerEl && zombies.getHomeworkState) {
        const hsHud = zombies.getHomeworkState();
        hwHud.style.display = hsHud.active ? 'flex' : 'none';
        hwHudSep.style.display = hsHud.active ? 'block' : 'none';
        if (hsHud.active) {
          const secs = Math.ceil(hsHud.timeLeft);
          hwTimerEl.textContent = `${secs}s`;
          hwTimerEl.style.color = secs <= 7 ? '#ff5247' : '#59c8ff';
        }
      }
      if (hwBigBanner && hwBigSec && hwBigFill && zombies.getHomeworkState) {
        const hsBig = zombies.getHomeworkState();
        hwBigBanner.classList.toggle('show', hsBig.active);
        if (hsBig.active) {
          const secs = Math.ceil(hsBig.timeLeft);
          const pct = Math.max(0, Math.min(100, (hsBig.timeLeft / 20) * 100));
          const color = secs <= 6 ? '#ff3b30' : (secs <= 12 ? '#ff9f0a' : '#59c8ff');
          hwBigSec.textContent = `${secs}s`;
          hwBigSec.style.color = color;
          hwBigFill.style.width = `${pct}%`;
          hwBigFill.style.background = color;
          if (hwBigSub) {
            hwBigSub.textContent = hsBig.needHold <= 0.1
              ? 'Spisebordet — Trykk E (øyeblikkelig!)'
              : `Spisebordet — Hold E i ${hsBig.needHold}s`;
          }
        }
      }
      waveText.textContent = gState.wave;
      zleftText.textContent = aliveCount;
      scoreText.textContent = gState.score;
      ammoCur.textContent = blaster.state.reloading ? '...' : blaster.state.ammo;
      ammoRes.textContent = blaster.state.reserve;
      hurtVignette.style.opacity = gState.hurtFlash.toFixed(2);
      if (noodleSpinEl) {
        if (gState.noodleFxT > 0) {
          const p = gState.noodleFxT;
          noodleSpinEl.classList.add('show');
          noodleSpinEl.style.opacity = Math.min(1, p * 4, (1 - p) * 6).toFixed(2);
          noodleSpinEl.style.transform = `translate(-50%, -50%) rotate(${(1 - p) * 720}deg) scale(${0.70 + Math.sin(p * Math.PI) * 0.55})`;
        } else {
          noodleSpinEl.classList.remove('show');
          noodleSpinEl.style.opacity = '0';
        }
      }
      hitMarker.classList.toggle('show', gState.hitMarkerT > 0);
      hitMarker.classList.toggle('head', gState.hitWasHead);
      if (gState.bannerT > 0) {
        waveBanner.textContent = gState.bannerMsg;
        waveBanner.classList.add('show');
      } else {
        waveBanner.classList.remove('show');
      }
      if (gState.gameOver) {
        gameOverStats.textContent = `Bølge ${gState.wave} • ${gState.kills} zombier • ${gState.score} poeng`;
        gameOverOverlay.classList.add('show');
        if (document.pointerLockElement === canvas) document.exitPointerLock();
      } else {
        gameOverOverlay.classList.remove('show');
      }
      if (gState.talentOpen && !gState.gameOver) {
        if (!lastTalentOpenState) {
          renderTalentTree();
          talentOverlay?.classList.add('show');
          if (document.pointerLockElement === canvas) {
            try { document.exitPointerLock(); } catch (_) {}
          }
          lastTalentOpenState = true;
        }
      } else {
        if (lastTalentOpenState) {
          talentOverlay?.classList.remove('show');
          lastTalentOpenState = false;
        }
      }
      syncSkillsHud(gState);
    } else {
      waveBanner.classList.remove('show');
      if (hwBigBanner) hwBigBanner.classList.remove('show');
      if (noodleSpinEl) noodleSpinEl.classList.remove('show');
      if (talentOverlay) talentOverlay.classList.remove('show');
      if (skillsHud) skillsHud.classList.remove('has-skills');
      lastTalentOpenState = false;
      hurtVignette.style.opacity = '0';
      hitMarker.classList.remove('show');
      gameOverOverlay.classList.remove('show');
    }

    drawMinimap();
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
})();
