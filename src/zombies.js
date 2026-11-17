// Minecraft Zombie Horde, Window/Door Breaching, BFS Room Pathfinding & Wave Manager
window.APP = window.APP || {};

APP.createZombieSystem = function(scene, arch, blaster) {
  // ==================== PIXEL-ART MINECRAFT ZOMBIE TEXTURES ====================
  function makePixelTex(drawFn, size = 16) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  function makeNoiseSkin(baseHex, shades) {
    return makePixelTex((ctx, S) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (((x * 13 + y * 29) % 7) < 2) {
            ctx.fillStyle = shades[(x + y) % shades.length];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }, 8);
  }

  const faceTex = makePixelTex((ctx) => {
    // Classic 8x8 Minecraft Zombie face
    const greens = ['#4c7b38', '#3f692e', '#578a42', '#345826'];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = greens[(x * 3 + y * 5) % greens.length];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Hair/top shadow
    ctx.fillStyle = '#2d4e21';
    ctx.fillRect(0, 0, 8, 2);
    ctx.fillRect(0, 2, 1, 1); ctx.fillRect(7, 2, 1, 1);
    // Dark sunken square Minecraft eyes
    ctx.fillStyle = '#0f160d';
    ctx.fillRect(1, 3, 2, 1);
    ctx.fillRect(5, 3, 2, 1);
    ctx.fillStyle = '#1b2b15';
    ctx.fillRect(2, 4, 1, 1);
    ctx.fillRect(5, 4, 1, 1);
    // Nose & dark zombie mouth
    ctx.fillStyle = '#315424';
    ctx.fillRect(3, 4, 2, 2);
    ctx.fillStyle = '#1e3516';
    ctx.fillRect(2, 6, 4, 1);
    ctx.fillStyle = '#28451d';
    ctx.fillRect(3, 7, 2, 1);
  }, 8);

  const skinTex = makeNoiseSkin('#4b7937', ['#3b632b', '#5a8b44', '#315423']);
  const shirtTex = makeNoiseSkin('#2b96a1', ['#1f7a84', '#37aab5', '#1b646d']);
  const pantsTex = makeNoiseSkin('#3c398f', ['#2f2c75', '#4b48a3', '#232158']);

  const matFace = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.85 });
  const matSkin = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.85 });
  const matShirt = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.90 });
  const matPants = new THREE.MeshStandardMaterial({ map: pantsTex, roughness: 0.90 });
  const matBoot = new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.85 });
  const matHelmet = new THREE.MeshStandardMaterial({ color: 0xbec6ce, roughness: 0.35, metalness: 0.65 });

  // Custom Minecraft zombie character:
  // long golden-blonde hair w/ straight bangs, light green zombie skin, & red dress w/ dark belt
  const blondeTex = makeNoiseSkin('#dfb256', ['#c79438', '#eed07a', '#b6832c']);
  const dressTex = makePixelTex((ctx) => {
    const reds = ['#b91c26', '#9a141c', '#d12631', '#871017'];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = reds[(x * 3 + y * 5) % reds.length];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Scoop neckline showing light-green zombie skin collar at top center
    ctx.fillStyle = '#a8e08a';
    ctx.fillRect(4, 0, 8, 2);
    ctx.fillRect(5, 2, 6, 1);
    // Dress fold shading & dark beaded waist belt at rows 10..11
    ctx.fillStyle = '#192123';
    ctx.fillRect(0, 10, 16, 2);
    ctx.fillStyle = '#536266';
    for (let x = 1; x < 16; x += 2) ctx.fillRect(x, 10 + (x % 3 === 0 ? 1 : 0), 1, 1);
  }, 16);

  const vipFaceTex = makePixelTex((ctx) => {
    // 16x16 blocky Minecraft face skin with light green zombie complexion
    const skin = '#a8e08a', skinSh = '#89c46b', skinHi = '#c4f0a8';
    ctx.fillStyle = skin;
    ctx.fillRect(0, 0, 16, 16);
    // Subtle cheek/chin pixel shading
    ctx.fillStyle = skinSh;
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillRect(0, 5, 1, 9);
    ctx.fillRect(15, 5, 1, 9);
    ctx.fillStyle = '#7bb45e'; // zombie cheek contour
    ctx.fillRect(2, 9, 2, 1);
    ctx.fillRect(12, 9, 2, 1);

    // Side golden-blonde hair framing cheeks
    const h1 = '#dfb155', h2 = '#c8953a', h3 = '#f0cf7b';
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = (y % 2 === 0) ? h1 : h2;
      ctx.fillRect(0, y, 1, 1);
      ctx.fillRect(15, y, 1, 1);
      if (y < 12) {
        ctx.fillStyle = (y % 3 === 0) ? h3 : h1;
        ctx.fillRect(1, y, 1, 1);
        ctx.fillRect(14, y, 1, 1);
      }
    }
    // Straight blonde bangs (pannelugg) across top 5 rows with crisp pixel strands
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = (x % 3 === 0) ? h3 : (x % 2 === 0 ? h1 : h2);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Soft fringe shadow under bangs
    ctx.fillStyle = skinSh;
    ctx.fillRect(2, 5, 12, 1);

    // Classic Minecraft eyes (rows 6..7) with dark lash line, sclera, and blue-slate iris
    ctx.fillStyle = '#22282d';
    ctx.fillRect(3, 6, 3, 1);
    ctx.fillRect(10, 6, 3, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 7, 1, 1);
    ctx.fillRect(5, 7, 1, 1);
    ctx.fillRect(10, 7, 1, 1);
    ctx.fillRect(12, 7, 1, 1);
    ctx.fillStyle = '#3c5e78';
    ctx.fillRect(4, 7, 1, 1);
    ctx.fillRect(11, 7, 1, 1);

    // Nose highlight/shadow
    ctx.fillStyle = skinHi;
    ctx.fillRect(7, 8, 2, 2);
    ctx.fillStyle = skinSh;
    ctx.fillRect(7, 10, 2, 1);

    // Big bright Minecraft smile (lips + teeth)
    ctx.fillStyle = '#d45861';
    ctx.fillRect(4, 11, 8, 3);
    ctx.fillStyle = '#faf7f0';
    ctx.fillRect(5, 12, 6, 1);
  }, 16);

  const vipSkinTex = makeNoiseSkin('#a8e08a', ['#8dc86f', '#c2efa6', '#7eb860']);

  const matVipFace = new THREE.MeshStandardMaterial({ map: vipFaceTex, roughness: 0.85 });
  const matHairBlonde = new THREE.MeshStandardMaterial({ map: blondeTex, roughness: 0.82 });
  const matHumanSkin = new THREE.MeshStandardMaterial({ map: vipSkinTex, roughness: 0.85 });
  const matDress = new THREE.MeshStandardMaterial({ map: dressTex, roughness: 0.85 });
  const matSkirt = new THREE.MeshStandardMaterial({ map: makeNoiseSkin('#b91c26', ['#9a141c', '#d12631', '#871017']), roughness: 0.85 });
  const matBelt = new THREE.MeshStandardMaterial({ color: 0x1a2022, roughness: 0.40, metalness: 0.35 });

  // ==================== BUILD SINGLE MINECRAFT ZOMBIE MESH ====================
  function createZombieMesh(armored, scale = 1.0, isVip = false) {
    const root = new THREE.Group();
    root.scale.setScalar(scale);

    if (isVip) {
      const mFace = matVipFace.clone();
      const mHair = matHairBlonde.clone();
      const mBody = matDress.clone();
      const mSkirt = matSkirt.clone();
      const mLimb = matHumanSkin.clone();
      const flashMats = [mFace, mHair, mBody, mSkirt, mLimb];

      // Legs (slim skin legs + dark shoes)
      const legL = new THREE.Group();
      legL.position.set(-0.095, 0.58, 0);
      const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.52, 0.15), mLimb);
      legLMesh.position.y = -0.26; legLMesh.castShadow = true;
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.18), matBoot);
      shoeL.position.set(0, -0.53, 0.01);
      legL.add(legLMesh, shoeL);

      const legR = new THREE.Group();
      legR.position.set(0.095, 0.58, 0);
      const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.52, 0.15), mLimb);
      legRMesh.position.y = -0.26; legRMesh.castShadow = true;
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.18), matBoot);
      shoeR.position.set(0, -0.53, 0.01);
      legR.add(legRMesh, shoeR);

      // Emerald-green dress torso + belt + flared skirt
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.60, 0.22), mBody);
      torso.position.set(0, 0.90, 0); torso.castShadow = true;
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.415, 0.06, 0.232), matBelt);
      belt.position.set(0, 0.72, 0);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.26), mSkirt);
      skirt.position.set(0, 0.49, 0); skirt.castShadow = true;

      // Head with real cropped portrait face on +Z and blonde hair around sides/top/back
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), [
        mHair, mHair, mHair, mLimb, mFace, mHair
      ]);
      head.position.set(0, 1.43, 0); head.castShadow = true;

      // Long golden-blonde hair back sheet + wavy shoulder locks framing the front of the dress
      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.76, 0.08), mHair);
      hairBack.position.set(0, 1.18, -0.19); hairBack.castShadow = true;
      const hairCrown = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), mHair);
      hairCrown.position.set(0, 1.65, 0);
      const hairLockL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.10), mHair);
      hairLockL.position.set(-0.20, 1.06, 0.14);
      hairLockL.rotation.z = 0.06;
      const hairLockR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.10), mHair);
      hairLockR.position.set(0.20, 1.06, 0.14);
      hairLockR.rotation.z = -0.06;

      // Sleeveless light-green zombie arms extended forward
      function makeVipArm(xOff) {
        const ag = new THREE.Group();
        ag.position.set(xOff, 1.14, 0);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.14), mLimb);
        arm.position.y = -0.25; arm.castShadow = true;
        ag.add(arm);
        ag.rotation.x = -Math.PI / 2 + 0.08;
        return ag;
      }
      const armL = makeVipArm(-0.28);
      const armR = makeVipArm(0.28);

      root.add(legL, legR, torso, belt, skirt, head, hairBack, hairCrown, hairLockL, hairLockR, armL, armR);
      return { root, legL, legR, armL, armR, head, torso, flashMats };
    }

    // Clone materials per zombie so brief red damage flash is independent
    const mFace = matFace.clone();
    const mSkin = matSkin.clone();
    const mShirt = matShirt.clone();
    const mPants = matPants.clone();
    const flashMats = [mFace, mSkin, mShirt, mPants];

    // Legs (pivoted at hip y = 0.60)
    const legL = new THREE.Group();
    legL.position.set(-0.105, 0.60, 0);
    const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.56, 0.19), mPants);
    legLMesh.position.y = -0.28; legLMesh.castShadow = true;
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.21), matBoot);
    bootL.position.set(0, -0.55, 0.01);
    legL.add(legLMesh, bootL);

    const legR = new THREE.Group();
    legR.position.set(0.105, 0.60, 0);
    const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.56, 0.19), mPants);
    legRMesh.position.y = -0.28; legRMesh.castShadow = true;
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.21), matBoot);
    bootR.position.set(0, -0.55, 0.01);
    legR.add(legRMesh, bootR);

    // Torso (y = 0.60 .. 1.22)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.22), mShirt);
    torso.position.set(0, 0.91, 0);
    torso.castShadow = true;

    // Head (y = 1.22 .. 1.64, face on +Z)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.41, 0.41), [
      mSkin, mSkin, mSkin, mSkin, mFace, mSkin
    ]);
    head.position.set(0, 1.43, 0);
    head.castShadow = true;

    if (armored) {
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.45), matHelmet);
      helm.position.set(0, 1.56, 0);
      head.add(helm);
      helm.position.set(0, 0.13, 0);
    }

    // Classic stretched-forward Minecraft Zombie Arms (pivoted at shoulder y = 1.15)
    function makeArm(xOff) {
      const ag = new THREE.Group();
      ag.position.set(xOff, 1.14, 0);
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.22, 0.17), mShirt);
      sleeve.position.y = -0.06;
      const fore = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), mSkin);
      fore.position.y = -0.34; fore.castShadow = true;
      ag.add(sleeve, fore);
      ag.rotation.x = -Math.PI / 2 + 0.08;
      return ag;
    }
    const armL = makeArm(-0.30);
    const armR = makeArm(0.30);

    root.add(legL, legR, torso, head, armL, armR);
    return { root, legL, legR, armL, armR, head, torso, flashMats };
  }

  // ==================== ROOM GRAPH & EXTERIOR BREACH PORTALS ====================
  // Waypoints so zombies entering through ANY bedroom/bath/living window or door navigate doorways cleanly
  const NODES = {
    stue: [5.45, 3.85],
    kitchen: [2.80, 1.90],
    dining: [4.55, 0.70],
    entre_n: [3.76, 6.76],
    entre_m: [3.78, 7.60],
    entre_s: [3.92, 8.75],
    sov1: [2.15, 5.25],
    bad: [1.85, 7.35],
    sov2: [1.85, 9.00],
    sov3: [5.95, 8.15],
    bod: [6.45, 9.65],
    terrace_n: [8.60, 1.25],
    terrace_s: [8.95, 4.90],
    lawn: [11.30, 4.90]
  };
  const EDGES = {
    stue: ['dining', 'kitchen', 'entre_n', 'sov1'],
    kitchen: ['stue', 'dining'],
    dining: ['stue', 'kitchen', 'terrace_n'],
    entre_n: ['stue', 'entre_m'],
    entre_m: ['entre_n', 'entre_s', 'bad'],
    entre_s: ['entre_m', 'sov2', 'sov3'],
    sov1: ['stue'],
    bad: ['entre_m'],
    sov2: ['entre_s'],
    sov3: ['entre_s', 'bod'],
    bod: ['sov3'],
    terrace_n: ['dining', 'terrace_s'],
    terrace_s: ['terrace_n', 'lawn'],
    lawn: ['terrace_s']
  };
  // Directed doorway portals: [approachX, approachZ, exitX, exitZ] so zombies align perpendicular and pass strictly inside target room
  const DOOR_PORTALS = {
    'stue|sov1': [3.68, 5.57, 2.64, 5.57],
    'sov1|stue': [2.64, 5.57, 3.68, 5.57],
    'stue|entre_n': [3.76, 6.18, 3.76, 6.94],
    'entre_n|stue': [3.76, 6.94, 3.76, 6.12],
    'entre_m|bad': [3.62, 7.50, 2.64, 7.50],
    'bad|entre_m': [2.64, 7.50, 3.62, 7.50],
    'entre_s|sov2': [3.62, 8.76, 2.64, 8.76],
    'sov2|entre_s': [2.64, 8.76, 3.62, 8.76],
    'entre_s|sov3': [4.22, 8.24, 5.22, 8.24],
    'sov3|entre_s': [5.22, 8.24, 4.22, 8.24],
    'sov3|bod': [6.84, 8.52, 6.84, 9.50],
    'bod|sov3': [6.84, 9.50, 6.84, 8.52],
    'dining|terrace_n': [5.40, 0.30, 6.48, 0.30],
    'terrace_n|dining': [6.48, 0.30, 5.40, 0.30],
    'terrace_n|terrace_s': [8.60, 2.15, 8.85, 3.30],
    'terrace_s|terrace_n': [8.85, 3.30, 8.60, 2.15],
    'terrace_s|lawn': [9.60, 4.90, 10.55, 4.90],
    'lawn|terrace_s': [10.55, 4.90, 9.60, 4.90]
  };

  function getPortalTarget(fromNode, toNode, pos) {
    const dp = DOOR_PORTALS[`${fromNode}|${toNode}`];
    if (!dp) return NODES[toNode];
    const [ax, az, bx, bz] = dp;
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const along = ((pos.x - ax) * dx + (pos.z - az) * dz) / (len * len);
    const perp = Math.abs((pos.x - ax) * (-dz) + (pos.z - az) * dx) / len;
    // Line up strictly in front of the approach side before entering, never flip back once past 8%
    if (along < 0.08 && (perp > 0.14 || along < -0.10)) {
      return [ax, az];
    }
    // Funnel straight down the dead-center of the doorway throat through to the exit side
    const tAhead = Math.min(1.0, Math.max(0.55, along + 0.35));
    return [ax + dx * tAhead, az + dz * tAhead];
  }

  function nearestNode(x, z) {
    if (x > 10.05) return 'lawn';
    if (x > 5.90 && z < 1.18) return 'terrace_n';
    if (x > 8.13) return z < 2.9 ? 'terrace_n' : 'terrace_s';
    if (x < 3.16 && z >= 2.66 && z <= 6.18) return 'sov1';
    if (x < 3.16 && z > 6.18 && z <= 8.10) return 'bad';
    if (x < 3.16 && z > 8.10) return 'sov2';
    if (x >= 5.26 && z > 9.00) return 'bod';
    if (x >= 4.69 && z >= 6.58 && z <= 9.00) return 'sov3';
    if (x >= 3.16 && x <= 4.69 && z >= 6.58) {
      if (z < 7.15) return 'entre_n';
      return z < 8.15 ? 'entre_m' : 'entre_s';
    }
    if (x < 3.22 && z < 2.66) return 'kitchen';
    if (z < 1.85 && x >= 3.22) return 'dining';
    return 'stue';
  }

  function findPathNodes(fromNode, toNode) {
    if (fromNode === toNode) return [];
    const q = [[fromNode]];
    const seen = new Set([fromNode]);
    while (q.length) {
      const path = q.shift();
      const cur = path[path.length - 1];
      for (const nxt of (EDGES[cur] || [])) {
        if (seen.has(nxt)) continue;
        const np = path.concat(nxt);
        if (nxt === toNode) return np;
        seen.add(nxt);
        q.push(np);
      }
    }
    return [];
  }

  // All real windows and exterior doors around Bjørkvegen 8A
  const BREACH_PORTALS = [
    {
      name: 'Stue østvindu', isWindow: true, roomNode: 'stue',
      spawn: [12.1, 3.50], outside: [8.52, 3.50], inside: [7.45, 3.50], viaLawnOpening: true
    },
    {
      name: 'Terrassedør', isWindow: false, roomNode: 'dining', doorLabel: 'Terrassedør',
      spawn: [11.9, 4.7], outside: [6.48, 0.30], inside: [5.35, 0.30], viaTerrace: true
    },
    {
      name: 'Spiseplass nordvindu', isWindow: true, roomNode: 'dining',
      spawn: [4.60, -4.8], outside: [4.60, -1.00], inside: [4.60, 0.05]
    },
    {
      name: 'Kjøkken nordvindu', isWindow: true, roomNode: 'kitchen',
      spawn: [2.55, -4.8], outside: [2.55, -0.50], inside: [2.55, 0.95]
    },
    {
      name: 'Inngangsdør', isWindow: false, roomNode: 'entre_s', doorLabel: 'Inngangsdør (Smartlås)',
      spawn: [3.92, 12.8], outside: [3.92, 10.95], inside: [3.92, 9.75]
    },
    {
      name: 'Soverom 1 vindu', isWindow: true, roomNode: 'sov1',
      spawn: [-2.6, 4.42], outside: [-0.48, 4.42], inside: [0.75, 4.42]
    },
    {
      name: 'Bad vindu', isWindow: true, roomNode: 'bad',
      spawn: [-2.6, 7.35], outside: [-0.48, 7.35], inside: [1.05, 7.35]
    },
    {
      name: 'Soverom 2 vindu', isWindow: true, roomNode: 'sov2',
      spawn: [-2.6, 9.10], outside: [-0.48, 9.10], inside: [0.85, 9.10]
    },
    {
      name: 'Soverom 3 østvindu', isWindow: true, roomNode: 'sov3',
      spawn: [11.2, 7.95], outside: [8.05, 7.95], inside: [6.85, 8.05]
    }
  ];

  // ==================== PARTICLE BURSTS (GLASS SHARDS & BLOCKY SPARKS) ====================
  const particles = [];
  const shardMat = new THREE.MeshStandardMaterial({ color: 0xcfe9f8, roughness: 0.15, transparent: true, opacity: 0.78 });
  const greenMat = new THREE.MeshBasicMaterial({ color: 0x5ca63d });
  const orangeSparkMat = new THREE.MeshBasicMaterial({ color: 0xff6b21 });

  function spawnBurst(x, y, z, mat, count, speed, size = 0.05) {
    const geo = new THREE.BoxGeometry(size, size, size * 0.45);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, z + (Math.random() - 0.5) * 0.3);
      scene.add(m);
      particles.push({
        mesh: m,
        vx: (Math.random() - 0.5) * speed,
        vy: Math.random() * speed * 0.8 + 0.6,
        vz: (Math.random() - 0.5) * speed,
        life: 0.65 + Math.random() * 0.45
      });
    }
  }

  // ==================== X-SHOT AMMO PICKUPS AROUND APARTMENT ====================
  const ammoPickups = [];
  const pickupMatBlue = new THREE.MeshStandardMaterial({ color: 0x176fd6, emissive: 0x0c346b, emissiveIntensity: 0.45, roughness: 0.3 });
  const pickupMatOrange = new THREE.MeshStandardMaterial({ color: 0xff621a, emissive: 0x6b2608, emissiveIntensity: 0.45, roughness: 0.35 });
  const pickupCoords = [[2.35, 0.92, 1.45], [3.92, 0.05, 8.20], [8.92, 0.75, 2.55]];
  pickupCoords.forEach(([px, py, pz]) => {
    const pg = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.18), pickupMatBlue);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.19), pickupMatOrange);
    pg.add(box, band);
    pg.position.set(px, py + 0.18, pz);
    scene.add(pg);
    ammoPickups.push({ mesh: pg, pos: new THREE.Vector3(px, py + 0.18, pz), active: true, respawnT: 0 });
  });

  // ==================== KITCHEN NOODLE BOWL (REFILLS HUNGER) ====================
  function createNoodleBowl() {
    const ng = new THREE.Group();
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0xb84028, roughness: 0.45 });
    const brothMat = new THREE.MeshStandardMaterial({ color: 0xd98c2b, roughness: 0.22 });
    const noodleMat = new THREE.MeshStandardMaterial({ color: 0xf7d560, roughness: 0.65 });
    const scallionMat = new THREE.MeshStandardMaterial({ color: 0x58bd42, roughness: 0.6 });
    const eggMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, roughness: 0.5 });
    const yolkMat = new THREE.MeshStandardMaterial({ color: 0xff9b1a, roughness: 0.4 });
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xc9965b, roughness: 0.6 });
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.062, 0.088, 16), bowlMat);
    bowl.position.y = 0.044;
    bowl.castShadow = true;
    ng.add(bowl);

    const broth = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.014, 16), brothMat);
    broth.position.y = 0.072;
    ng.add(broth);

    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036 + i * 0.015, 0.011, 7, 16), noodleMat);
      ring.rotation.x = Math.PI / 2 + (i % 2 ? 0.12 : -0.1);
      ring.position.set((i % 2 ? 0.008 : -0.008), 0.082 + (i % 2) * 0.004, 0);
      ng.add(ring);
    }

    const eggWhite = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), eggMat);
    eggWhite.scale.set(1.25, 0.45, 0.9);
    eggWhite.position.set(-0.042, 0.084, 0.03);
    const eggYolk = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), yolkMat);
    eggYolk.scale.set(1, 0.65, 1);
    eggYolk.position.set(-0.042, 0.092, 0.03);
    ng.add(eggWhite, eggYolk);

    for (const [sx, sz] of [[0.03, 0.02], [0.045, -0.025], [-0.01, -0.04]]) {
      const sc = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.01, 0.016), scallionMat);
      sc.position.set(sx, 0.09, sz);
      ng.add(sc);
    }

    for (const off of [-0.014, 0.014]) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, 0.25, 6), stickMat);
      stick.rotation.z = Math.PI / 2 - 0.12;
      stick.rotation.y = off * 4;
      stick.position.set(0.02, 0.105, off + 0.035);
      ng.add(stick);
    }

    const steamPuffs = [];
    const puffGeo = new THREE.SphereGeometry(0.022, 7, 6);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(puffGeo, steamMat);
      p.position.set((i - 1.5) * 0.022, 0.14 + i * 0.055, (i % 2 ? 0.015 : -0.015));
      ng.add(p);
      steamPuffs.push({ mesh: p, phase: i * 0.8 });
    }

    ng.position.set(2.02, 0.90, 0.38);
    scene.add(ng);
    return { mesh: ng, pos: new THREE.Vector3(2.02, 0.90, 0.38), active: true, respawnT: 0, steamPuffs };
  }
  const noodleBowl = createNoodleBowl();

  // ==================== DINING TABLE HOMEWORK (LEKSER) ====================
  function createHomeworkMesh() {
    const hg = new THREE.Group();
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x2659a8, roughness: 0.55 });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfbf8ef, roughness: 0.8 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0x5c85c9, roughness: 0.7 });
    const pencilMat = new THREE.MeshStandardMaterial({ color: 0xffc42e, roughness: 0.5 });
    const eraserMat = new THREE.MeshStandardMaterial({ color: 0xe67c94, roughness: 0.6 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x59c8ff, transparent: true, opacity: 0.85 });

    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.010, 0.23), coverMat);
    cover.position.y = 0.005;
    hg.add(cover);

    const page = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.008, 0.205), paperMat);
    page.position.y = 0.012;
    hg.add(page);

    for (let i = -3; i <= 3; i++) {
      const rule = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.002, 0.004), lineMat);
      rule.position.set(0, 0.017, i * 0.023);
      hg.add(rule);
    }

    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), pencilMat);
    pencil.rotation.z = Math.PI / 2;
    pencil.rotation.y = 0.38;
    pencil.position.set(0.04, 0.022, 0.05);
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.018, 6), eraserMat);
    eraser.rotation.z = Math.PI / 2;
    eraser.rotation.y = 0.38;
    eraser.position.set(-0.032, 0.022, 0.022);
    hg.add(pencil, eraser);

    const beacon = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 22), beaconMat);
    beacon.rotation.x = Math.PI / 2;
    beacon.position.y = 0.18;
    hg.add(beacon);

    hg.position.set(4.50, 0.746, 0.52);
    hg.visible = false;
    scene.add(hg);
    return { mesh: hg, beacon };
  }
  const hwVisual = createHomeworkMesh();
  const homework = {
    active: false,
    spawnTimer: 12.0,
    timeLeft: 0,
    maxTime: 20.0,
    progress: 0,
    needHold: 3.0,
    pos: new THREE.Vector3(4.50, 0.746, 0.52),
    mesh: hwVisual.mesh,
    beacon: hwVisual.beacon,
    phase: 0
  };

  // ==================== ZOMBIE HORDE & GAME STATE ====================
  const zombies = [];
  const game = {
    active: true,
    wave: 1,
    score: 0,
    kills: 0,
    hp: 100,
    maxHp: 100,
    hunger: 100,
    maxHunger: 100,
    hungerWarned: false,
    gameOver: false,
    toSpawn: 0,
    spawnTimer: 0,
    betweenWavesT: 0,
    hurtFlash: 0,
    hurtCooldown: 0,
    bannerMsg: '',
    bannerT: 0,
    hitMarkerT: 0,
    hitWasHead: false
  };

  function showBanner(txt, dur = 2.6) {
    game.bannerMsg = txt;
    game.bannerT = dur;
  }

  function clearZombies() {
    while (zombies.length) {
      const z = zombies.pop();
      scene.remove(z.rig.root);
    }
  }

  let vipPending = true;
  let vipTimer = 8.0;

  function startWave(num) {
    game.wave = num;
    game.toSpawn = 4 + num * 3;
    game.spawnTimer = 0.5;
    vipPending = (num === 1);
    vipTimer = (num === 1) ? 8.0 : 0;
    blaster.sfx.wave();
    showBanner(`BØLGE ${num} — Zombiene angriper gjennom vinduer og dører!`, 3.2);
  }

  function resetGame() {
    clearZombies();
    resetCat();
    game.hp = 100;
    game.hunger = 100;
    game.hungerWarned = false;
    game.score = 0;
    game.kills = 0;
    game.gameOver = false;
    game.hurtFlash = 0;
    game.hurtCooldown = 0;
    game.betweenWavesT = 0;
    blaster.resetAmmo();
    ammoPickups.forEach(p => { p.active = true; p.mesh.visible = true; p.respawnT = 0; });
    noodleBowl.active = true;
    noodleBowl.mesh.visible = game.active;
    noodleBowl.respawnT = 0;
    homework.active = false;
    homework.spawnTimer = 12.0;
    homework.timeLeft = 0;
    homework.progress = 0;
    homework.mesh.visible = false;
    startWave(1);
  }

  function eatNoodles() {
    if (!noodleBowl.active) return false;
    noodleBowl.active = false;
    noodleBowl.mesh.visible = false;
    noodleBowl.respawnT = 14;
    game.hunger = game.maxHunger;
    game.hungerWarned = false;
    game.hp = Math.min(game.maxHp, game.hp + 10);
    if (blaster.sfx.eat) blaster.sfx.eat();
    else blaster.sfx.wave();
    spawnBurst(noodleBowl.pos.x, noodleBowl.pos.y + 0.12, noodleBowl.pos.z, orangeSparkMat, 8, 2.2, 0.04);
    showBanner('Spiste varme nudler på kjøkkenet! Sult 100%', 2.2);
    return true;
  }

  function tryEatNoodles(playerPos) {
    if (!game.active || game.gameOver || !noodleBowl.active) return false;
    if (Math.hypot(playerPos.x - noodleBowl.pos.x, playerPos.z - noodleBowl.pos.z) < 2.05) {
      return eatNoodles();
    }
    return false;
  }

  function setGameActive(flag) {
    game.active = flag;
    blaster.setVisible(flag);
    cat.rig.root.visible = flag;
    ammoPickups.forEach(p => { p.mesh.visible = flag && p.active; });
    noodleBowl.mesh.visible = flag && noodleBowl.active;
    homework.mesh.visible = flag && homework.active;
    if (!flag) {
      clearZombies();
    } else if (zombies.length === 0 && game.toSpawn === 0 && game.betweenWavesT <= 0) {
      resetGame();
    }
  }

  function spawnOneZombie(forceVip = false) {
    const isVip = forceVip;
    // VIP Minecraft character enters through the Front Door (Inngangsdør) down the hallway toward the living room!
    const portal = isVip ? BREACH_PORTALS[4] : BREACH_PORTALS[Math.floor(Math.random() * BREACH_PORTALS.length)];
    const armored = !isVip && game.wave >= 2 && Math.random() < Math.min(0.45, (game.wave - 1) * 0.16);
    const runner = !isVip && game.wave >= 3 && Math.random() < 0.25;
    const scale = armored ? 1.04 : 0.98 + Math.random() * 0.06;
    const rig = createZombieMesh(armored, scale, isVip);

    if (isVip) {
      rig.root.position.set(portal.outside[0], -0.10, portal.outside[1] + 0.35);
    } else {
      rig.root.position.set(portal.spawn[0], -0.16, portal.spawn[1]);
    }
    scene.add(rig.root);

    // Queue approach points cleanly outside -> portal -> inside
    const approachQueue = [];
    if (isVip) {
      approachQueue.push(portal.outside);
    } else if (portal.viaLawnOpening) {
      approachQueue.push([10.35, 4.90], [9.45, 4.90], portal.outside);
    } else if (portal.viaTerrace) {
      approachQueue.push([10.35, 4.90], [9.10, 4.65], [8.90, 2.00], portal.outside);
    } else {
      approachQueue.push(portal.outside);
    }

    zombies.push({
      rig,
      portal,
      phase: 'approach', // 'approach' | 'breach' | 'chase' | 'dying'
      queue: approachQueue,
      breachT: 0,
      breachShattered: false,
      hp: armored ? 5 : 3,
      speed: runner ? 1.85 : (1.15 + Math.random() * 0.35 + Math.min(0.4, game.wave * 0.06)),
      walkCycle: Math.random() * 6,
      flashT: 0,
      deathT: 0,
      groanT: 1.5 + Math.random() * 4.5,
      atkCooldown: 0,
      curRoom: portal.roomNode,
      detourSign: Math.random() < 0.5 ? 1 : -1,
      detourT: 0,
      stuckT: 0,
      watchX: rig.root.position.x,
      watchZ: rig.root.position.z,
      watchT: 0
    });
  }

  function isNearAnyDoorway(x, z) {
    for (const k in DOOR_PORTALS) {
      const dp = DOOR_PORTALS[k];
      const mx = (dp[0] + dp[2]) * 0.5, mz = (dp[1] + dp[3]) * 0.5;
      if (Math.hypot(x - mx, z - mz) < 0.75) return true;
    }
    return false;
  }

  function openDoorIfNear(x, z, doorLabel) {
    for (const d of arch.doors) {
      if (doorLabel && d.label !== doorLabel) continue;
      const c = arch.colliders[d.colliderIdx];
      let dx = 0, dz = 0;
      if (c) {
        dx = (c.x1 + c.x2) * 0.5 - x;
        dz = (c.z1 + c.z2) * 0.5 - z;
      }
      if (Math.hypot(dx, dz) < 1.90 && !d.isOpen) {
        d.isOpen = true;
        if (c) c.enabled = false;
        blaster.sfx.door();
      }
    }
  }

  function resolveZombieCollisions(pos, r = 0.14) {
    for (let pass = 0; pass < 2; pass++) {
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
          if (dist < minD && dist > 1e-5) {
            const push = minD - dist;
            pos.x += (dx / dist) * push;
            pos.z += (dz / dist) * push;
          }
        } else if (c.kind === 'box') {
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

  // ==================== IMMORTAL BLACK CAT COMPANION ====================
  function createBlackCatMesh() {
    const matFur = new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.94, metalness: 0.0 });
    const matEarIn = new THREE.MeshStandardMaterial({ color: 0xd97d95, roughness: 0.68 });
    const matEye = new THREE.MeshBasicMaterial({ color: 0x7cff4d });
    const matPupil = new THREE.MeshBasicMaterial({ color: 0x090b08 });
    const matNose = new THREE.MeshStandardMaterial({ color: 0xe6849a, roughness: 0.6 });

    const root = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.36), matFur);
    body.position.set(0, 0.20, 0);
    body.castShadow = true; body.receiveShadow = true;
    root.add(body);

    const head = new THREE.Group();
    head.position.set(0, 0.285, 0.21);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.16), matFur);
    skull.position.set(0, 0, 0.03);
    skull.castShadow = true;
    head.add(skull);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.04), matFur);
    snout.position.set(0, -0.025, 0.115);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.015), matNose);
    nose.position.set(0, -0.008, 0.138);
    head.add(snout, nose);

    const earGeo = new THREE.BoxGeometry(0.042, 0.06, 0.03);
    const earInGeo = new THREE.BoxGeometry(0.024, 0.036, 0.012);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(earGeo, matFur);
      ear.position.set(s * 0.055, 0.095, 0.01);
      const earIn = new THREE.Mesh(earInGeo, matEarIn);
      earIn.position.set(s * 0.055, 0.09, 0.023);
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.026, 0.01), matEye);
      eye.position.set(s * 0.044, 0.018, 0.112);
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.022, 0.012), matPupil);
      pupil.position.set(s * 0.044, 0.018, 0.115);
      head.add(ear, earIn, eye, pupil);
    });
    root.add(head);

    function makeCatLeg(x, z) {
      const piv = new THREE.Group();
      piv.position.set(x, 0.14, z);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.14, 0.052), matFur);
      m.position.y = -0.07;
      m.castShadow = true;
      piv.add(m);
      root.add(piv);
      return piv;
    }
    const legFL = makeCatLeg(-0.055, 0.12);
    const legFR = makeCatLeg(0.055, 0.12);
    const legBL = makeCatLeg(-0.055, -0.12);
    const legBR = makeCatLeg(0.055, -0.12);

    const tailPiv = new THREE.Group();
    tailPiv.position.set(0, 0.24, -0.17);
    const tailBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), matFur);
    tailBase.position.set(0, 0.04, -0.07);
    tailBase.rotation.x = 0.55;
    const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.14), matFur);
    tailTip.position.set(0, 0.12, -0.15);
    tailTip.rotation.x = 1.05;
    tailPiv.add(tailBase, tailTip);
    root.add(tailPiv);

    scene.add(root);
    return { root, head, legFL, legFR, legBL, legBR, tailPiv };
  }

  const catRig = createBlackCatMesh();
  const ROAM_ROOMS = ['stue', 'kitchen', 'dining', 'entre_n', 'entre_s', 'sov1', 'bad', 'sov2', 'sov3', 'bod', 'terrace_n', 'terrace_s'];
  const cat = {
    rig: catRig,
    target: null,
    biteCooldown: 0,
    lungeT: 0,
    walkCycle: 0,
    speed: 3.35,
    roamRoom: 'kitchen',
    roamX: 2.80,
    roamZ: 1.90,
    roamWait: 0,
    roamWatchT: 0,
    roamWatchX: 4.80,
    roamWatchZ: 4.10
  };

  function pickCatRoamGoal(curRoom) {
    const pool = ROAM_ROOMS.filter(r => r !== curRoom);
    const nextRoom = pool[Math.floor(Math.random() * pool.length)] || 'stue';
    const base = NODES[nextRoom] || NODES.stue;
    cat.roamRoom = nextRoom;
    cat.roamX = base[0] + (Math.random() - 0.5) * 0.45;
    cat.roamZ = base[1] + (Math.random() - 0.5) * 0.45;
    cat.roamWatchT = 0;
  }

  function resetCat() {
    cat.target = null;
    cat.biteCooldown = 0;
    cat.lungeT = 0;
    cat.walkCycle = 0;
    cat.roamWait = 0.6;
    cat.rig.root.position.set(4.80, 0, 4.10);
    cat.rig.root.rotation.set(0, 0, 0);
    cat.rig.root.visible = game.active;
    pickCatRoamGoal('stue');
  }

  function setCatTarget(zombie) {
    if (!zombie || zombie.phase === 'dying') return;
    cat.target = zombie;
  }

  function isCatTargetAlive(z) {
    return z && z.phase !== 'dying' && zombies.includes(z);
  }

  function updateCat(dt, playerPos, playerRoom) {
    cat.rig.root.visible = game.active;
    if (!game.active) return;
    if (cat.biteCooldown > 0) cat.biteCooldown = Math.max(0, cat.biteCooldown - dt);
    if (cat.lungeT > 0) cat.lungeT = Math.max(0, cat.lungeT - dt);

    if (cat.target && !isCatTargetAlive(cat.target)) {
      cat.target = null;
      pickCatRoamGoal(nearestNode(cat.rig.root.position.x, cat.rig.root.position.z));
    }

    const cPos = cat.rig.root.position;
    const hunting = !!cat.target;
    let tx = cat.roamX;
    let tz = cat.roamZ;
    let stopDist = 0.25;
    let waiting = false;

    if (hunting) {
      cat.roamWait = 0;
      const tPos = cat.target.rig.root.position;
      const catRoom = nearestNode(cPos.x, cPos.z);
      const tRoom = nearestNode(tPos.x, tPos.z);
      if (catRoom !== tRoom) {
        const path = findPathNodes(catRoom, tRoom);
        if (path.length >= 2) {
          const portalPt = getPortalTarget(path[0], path[1], cPos);
          tx = portalPt[0]; tz = portalPt[1];
        } else {
          tx = tPos.x; tz = tPos.z;
        }
      } else {
        tx = tPos.x; tz = tPos.z;
      }
      stopDist = 0.62;
      openDoorIfNear(cPos.x, cPos.z, null);
    } else if (cat.roamWait > 0) {
      waiting = true;
      cat.roamWait -= dt;
      if (cat.roamWait <= 0) {
        pickCatRoamGoal(nearestNode(cPos.x, cPos.z));
      }
    } else {
      const catRoom = nearestNode(cPos.x, cPos.z);
      if (catRoom !== cat.roamRoom) {
        const path = findPathNodes(catRoom, cat.roamRoom);
        if (path.length >= 2) {
          const portalPt = getPortalTarget(path[0], path[1], cPos);
          tx = portalPt[0]; tz = portalPt[1];
        }
      }
      openDoorIfNear(cPos.x, cPos.z, null);
      if (Math.hypot(cat.roamX - cPos.x, cat.roamZ - cPos.z) < 0.42) {
        cat.roamWait = 0.5 + Math.random() * 1.4;
      } else {
        cat.roamWatchT += dt;
        if (cat.roamWatchT > 1.6) {
          if (Math.hypot(cPos.x - cat.roamWatchX, cPos.z - cat.roamWatchZ) < 0.25) {
            pickCatRoamGoal(catRoom);
          }
          cat.roamWatchX = cPos.x;
          cat.roamWatchZ = cPos.z;
          cat.roamWatchT = 0;
        }
      }
    }

    const dx = tx - cPos.x, dz = tz - cPos.z;
    const dist = Math.hypot(dx, dz);
    if (!waiting && dist > 0.08) {
      cat.rig.root.rotation.y = Math.atan2(dx, dz);
    }

    let moving = false;
    if (!waiting && dist > stopDist) {
      moving = true;
      const moveSpeed = hunting ? cat.speed : 2.15;
      const step = Math.min(dist - stopDist, moveSpeed * dt);
      cPos.x += (dx / dist) * step;
      cPos.z += (dz / dist) * step;
      resolveZombieCollisions(cPos, 0.11);
    }

    // Bite & deal damage to shot target zombie (immortal cat cannot be harmed)
    if (hunting) {
      const tPos = cat.target.rig.root.position;
      const distToTarget = Math.hypot(tPos.x - cPos.x, tPos.z - cPos.z);
      if (distToTarget <= 0.92 && cat.biteCooldown <= 0) {
        const z = cat.target;
        cat.biteCooldown = 0.65;
        cat.lungeT = 0.22;
        z.hp -= 2;
        z.flashT = 0.14;
        z.rig.flashMats.forEach(m => m.emissive.setHex(0x881111));
        if (blaster.sfx.catBite) blaster.sfx.catBite();
        else blaster.sfx.hit(false);
        spawnBurst(tPos.x, 0.65, tPos.z, orangeSparkMat, 6, 3.0, 0.042);
        game.hitMarkerT = 0.16;
        game.hitWasHead = false;
        if (z.hp <= 0) {
          z.phase = 'dying';
          z.deathT = 0.75;
          game.kills++;
          game.score += 100;
          cat.target = null;
        }
      }
    }

    const floorY = (cPos.x > 10.05 || cPos.z < -0.78 || cPos.z > 10.60 || cPos.x < -0.15) ? -0.16 : 0;
    const lungeY = cat.lungeT > 0 ? Math.sin((cat.lungeT / 0.22) * Math.PI) * 0.24 : 0;
    cPos.y += ((floorY + lungeY) - cPos.y) * Math.min(1, dt * 16);

    cat.walkCycle += dt * (moving ? (hunting ? 15 : 10) : 2.8);
    const swing = moving ? Math.sin(cat.walkCycle) * 0.75 : 0;
    cat.rig.legFL.rotation.x = swing;
    cat.rig.legBR.rotation.x = swing;
    cat.rig.legFR.rotation.x = -swing;
    cat.rig.legBL.rotation.x = -swing;
    cat.rig.head.rotation.x = cat.lungeT > 0 ? -0.35 : Math.sin(cat.walkCycle * 0.5) * 0.05;
    cat.rig.tailPiv.rotation.y = Math.sin(cat.walkCycle * 0.7) * 0.35;
  }

  function getCatDot() {
    return { x: cat.rig.root.position.x, z: cat.rig.root.position.z, hunting: !!cat.target };
  }

  // ==================== DART HIT DETECTION ====================
  const hitRay = new THREE.Ray();
  const hitHeadBox = new THREE.Box3();
  const hitBodyBox = new THREE.Box3();
  const hitTmpPt = new THREE.Vector3();

  function raycastZombie(ray) {
    let best = null;
    const box = new THREE.Box3();
    const hitPt = new THREE.Vector3();
    for (const z of zombies) {
      if (z.phase === 'dying') continue;
      const p = z.rig.root.position;
      // Full zombie silhouette bounds in world space
      box.min.set(p.x - 0.36, p.y + 0.02, p.z - 0.36);
      box.max.set(p.x + 0.36, p.y + 1.72, p.z + 0.36);
      if (ray.intersectBox(box, hitPt)) {
        const d = ray.origin.distanceTo(hitPt);
        if (!best || d < best.dist) {
          best = { dist: d, point: hitPt.clone(), zombie: z };
        }
      }
    }
    return best;
  }

  function checkDartHit(segA, segB, sfx) {
    const segDir = segB.clone().sub(segA);
    const segLen = segDir.length();
    if (segLen < 1e-6) segDir.set(0, 0, -1);
    else segDir.divideScalar(segLen);
    hitRay.set(segA, segDir);

    let bestHit = null;
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (z.phase === 'dying') continue;
      const p = z.rig.root.position;
      hitHeadBox.min.set(p.x - 0.30, p.y + 1.22, p.z - 0.30);
      hitHeadBox.max.set(p.x + 0.30, p.y + 1.72, p.z + 0.30);
      hitBodyBox.min.set(p.x - 0.36, p.y + 0.02, p.z - 0.36);
      hitBodyBox.max.set(p.x + 0.36, p.y + 1.24, p.z + 0.36);

      const checkBox = (box, isHead) => {
        if (!hitRay.intersectBox(box, hitTmpPt)) return;
        const d = segA.distanceTo(hitTmpPt);
        if (d > segLen + 0.05) return;
        if (!bestHit || d < bestHit.dist) {
          bestHit = { z, isHead, dist: d, pt: hitTmpPt.clone(), box: box.clone() };
        }
      };
      checkBox(hitHeadBox, true);
      checkBox(hitBodyBox, false);
    }
    if (!bestHit) return null;

    const { z, isHead, pt, box } = bestHit;
    setCatTarget(z);
    const p = z.rig.root.position;
    const dmg = isHead ? 2 : 1;
    z.hp -= dmg;
    z.flashT = 0.14;
    z.rig.flashMats.forEach(m => m.emissive.setHex(0x881111));
    sfx.hit(isHead);
    spawnBurst(pt.x, pt.y, pt.z, isHead ? orangeSparkMat : greenMat, 6, 3.0, 0.04);

    game.hitMarkerT = 0.20;
    game.hitWasHead = isHead;

    // Slight knockback
    z.rig.root.position.x += segDir.x * 0.16;
    z.rig.root.position.z += segDir.z * 0.16;

    if (z.hp <= 0) {
      z.phase = 'dying';
      z.deathT = 0.75;
      game.kills++;
      game.score += isHead ? 150 : 100;
    }

    // Bounce normal pointing out from box face (or back toward shooter if spawned close)
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    const normal = new THREE.Vector3(pt.x - cx, 0.22, pt.z - cz);
    if (normal.lengthSq() < 0.005) normal.copy(segDir).negate().setY(0.22);
    normal.normalize();
    return { point: pt.clone().addScaledVector(normal, 0.06), normal, isHead };
  }

  // ==================== UPDATE LOOP ====================
  function update(dt, playerPos, holdE = false) {
    if (game.bannerT > 0) game.bannerT = Math.max(0, game.bannerT - dt);
    if (game.hurtFlash > 0) game.hurtFlash = Math.max(0, game.hurtFlash - dt * 1.8);
    if (game.hurtCooldown > 0) game.hurtCooldown = Math.max(0, game.hurtCooldown - dt);
    if (game.hitMarkerT > 0) game.hitMarkerT = Math.max(0, game.hitMarkerT - dt);

    // Update flying particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.vy -= 9.5 * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.x += 6 * dt;
      pt.mesh.rotation.y += 5 * dt;
      if (pt.mesh.position.y < -0.15) { pt.mesh.position.y = -0.15; pt.vy *= -0.25; }
      if (pt.life <= 0) { scene.remove(pt.mesh); particles.splice(i, 1); }
    }

    if (!game.active || game.gameOver) return;

    // Hunger bar slowly drops over time; reaching 0 drains HP until player eats noodles in kitchen
    game.hunger = Math.max(0, game.hunger - dt * 1.35);
    if (game.hunger < 25 && !game.hungerWarned) {
      game.hungerWarned = true;
      showBanner('Du er sulten! Gå til kjøkkenet og spis nudler!', 3.2);
    }
    if (game.hunger <= 0) {
      game.hp = Math.max(0, game.hp - dt * 2.5);
      if (game.hp <= 0) game.gameOver = true;
    }

    // Kitchen noodle bowl steam animation, respawn & auto-eat on approach
    if (!noodleBowl.active) {
      noodleBowl.respawnT -= dt;
      if (noodleBowl.respawnT <= 0) {
        noodleBowl.active = true;
        noodleBowl.mesh.visible = true;
      }
    } else {
      for (const sp of noodleBowl.steamPuffs) {
        sp.phase = (sp.phase + dt * 1.3) % 3.2;
        const t = sp.phase / 3.2;
        sp.mesh.position.y = 0.11 + t * 0.22;
        sp.mesh.scale.setScalar(0.75 + t * 0.7);
      }
      if (Math.hypot(playerPos.x - noodleBowl.pos.x, playerPos.z - noodleBowl.pos.z) < 1.32 && game.hunger < 92) {
        eatNoodles();
      }
    }

    // Dining table homework event (must hold E for 3s within 20s)
    if (!homework.active) {
      homework.spawnTimer -= dt;
      if (homework.spawnTimer <= 0) {
        homework.active = true;
        homework.timeLeft = homework.maxTime;
        homework.progress = 0;
        homework.mesh.visible = true;
        blaster.sfx.wave();
        showBanner('Lekser på spisebordet! Hold E i 3s innen 20s!', 3.2);
      }
    } else {
      homework.phase += dt * 4.5;
      homework.beacon.position.y = 0.16 + Math.sin(homework.phase) * 0.05;
      homework.timeLeft = Math.max(0, homework.timeLeft - dt);

      const nearHw = Math.hypot(playerPos.x - homework.pos.x, playerPos.z - homework.pos.z) < 2.15;
      if (nearHw && holdE) {
        homework.progress = Math.min(homework.needHold, homework.progress + dt);
      } else {
        homework.progress = 0;
      }

      if (homework.progress >= homework.needHold) {
        homework.active = false;
        homework.mesh.visible = false;
        homework.progress = 0;
        homework.spawnTimer = 17 + Math.random() * 8;
        game.score += 200;
        blaster.sfx.wave();
        spawnBurst(homework.pos.x, homework.pos.y + 0.12, homework.pos.z, orangeSparkMat, 10, 2.5, 0.045);
        showBanner('Lekser ferdig! +200 poeng', 2.4);
      } else if (homework.timeLeft <= 0) {
        homework.active = false;
        homework.mesh.visible = false;
        homework.progress = 0;
        homework.spawnTimer = 17 + Math.random() * 8;
        game.hp = Math.max(0, game.hp - 35);
        game.hurtFlash = 0.85;
        blaster.sfx.hurt();
        showBanner('Du rakk ikke leksene på 20s! -35 HP', 3.0);
        if (game.hp <= 0) game.gameOver = true;
      }
    }

    // Spin & collect ammo pickups
    for (const pk of ammoPickups) {
      if (!pk.active) {
        pk.respawnT -= dt;
        if (pk.respawnT <= 0) { pk.active = true; pk.mesh.visible = true; }
        continue;
      }
      pk.mesh.rotation.y += dt * 1.8;
      if (Math.hypot(playerPos.x - pk.pos.x, playerPos.z - pk.pos.z) < 0.95) {
        pk.active = false;
        pk.mesh.visible = false;
        pk.respawnT = 20;
        blaster.addAmmo(24);
        blaster.sfx.wave();
        showBanner('+24 X-Shot piler plukket opp!', 1.5);
      }
    }

    // VIP blonde Minecraft character ALWAYS spawns after 8 seconds
    if (vipPending) {
      vipTimer -= dt;
      if (vipTimer <= 0) {
        vipPending = false;
        spawnOneZombie(true);
      }
    }

    // Wave spawning
    if (game.toSpawn > 0) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0 && zombies.length < 14) {
        spawnOneZombie(false);
        game.toSpawn--;
        game.spawnTimer = Math.max(0.95, 2.4 - game.wave * 0.18);
      }
    } else if (!vipPending && zombies.length === 0) {
      if (game.betweenWavesT <= 0) {
        game.betweenWavesT = 3.2;
        blaster.addAmmo(45);
        game.hp = Math.min(game.maxHp, game.hp + 25);
        showBanner(`BØLGE ${game.wave} KLART! +45 piler & +25 HP`, 3.0);
        blaster.sfx.wave();
      } else {
        game.betweenWavesT -= dt;
        if (game.betweenWavesT <= 0) startWave(game.wave + 1);
      }
    }

    const playerRoom = nearestNode(playerPos.x, playerPos.z);

    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      const pos = z.rig.root.position;

      // Clear red damage tint
      if (z.flashT > 0) {
        z.flashT -= dt;
        if (z.flashT <= 0) z.rig.flashMats.forEach(m => m.emissive.setHex(0x000000));
      }

      // Death tip-over animation
      if (z.phase === 'dying') {
        z.deathT -= dt;
        const p = 1 - Math.max(0, z.deathT) / 0.75;
        z.rig.root.rotation.z = Math.min(Math.PI / 2, p * Math.PI * 0.95);
        z.rig.root.position.y = Math.max(-0.14, (pos.y) - dt * 0.4);
        if (z.deathT <= 0) {
          spawnBurst(pos.x, 0.3, pos.z, greenMat, 8, 2.2, 0.06);
          scene.remove(z.rig.root);
          zombies.splice(i, 1);
        }
        continue;
      }

      z.groanT -= dt;
      if (z.groanT <= 0) {
        if (Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z) < 7.5) blaster.sfx.groan();
        z.groanT = 3.5 + Math.random() * 5.0;
      }

      let tx = playerPos.x, tz = playerPos.z;
      let targetY = (pos.x > 10.02 || pos.z < -0.78 || pos.z > 10.60 || pos.x < -0.15) ? -0.18 : 0;

      if (z.phase === 'approach') {
        const wp = z.queue[0];
        tx = wp[0]; tz = wp[1];
        if (Math.hypot(tx - pos.x, tz - pos.z) < 0.35) {
          z.queue.shift();
          if (z.queue.length === 0) {
            z.phase = 'breach';
            z.breachT = 0;
          }
        }
      } else if (z.phase === 'breach') {
        const pr = z.portal;
        if (!z.breachShattered) {
          z.breachShattered = true;
          if (pr.isWindow) {
            blaster.sfx.glass();
            spawnBurst((pr.outside[0] + pr.inside[0]) * 0.5, 1.35, (pr.outside[1] + pr.inside[1]) * 0.5, shardMat, 14, 4.2, 0.065);
          } else {
            openDoorIfNear(pr.outside[0], pr.outside[1], pr.doorLabel);
          }
        }
        const dur = pr.isWindow ? 1.05 : 0.65;
        z.breachT += dt / dur;
        const u = Math.min(1, z.breachT);
        pos.x = pr.outside[0] + (pr.inside[0] - pr.outside[0]) * u;
        pos.z = pr.outside[1] + (pr.inside[1] - pr.outside[1]) * u;
        // Classic jump/vault arc over window sill!
        pos.y = pr.isWindow ? Math.sin(u * Math.PI) * 0.96 : 0;
        const ang = Math.atan2(pr.inside[0] - pr.outside[0], pr.inside[1] - pr.outside[1]);
        z.rig.root.rotation.y = ang;
        z.rig.legL.rotation.x = Math.sin(u * Math.PI * 3) * 0.7;
        z.rig.legR.rotation.x = -Math.sin(u * Math.PI * 3) * 0.7;
        if (u >= 1) {
          pos.y = 0;
          z.phase = 'chase';
          z.curRoom = pr.roomNode;
        }
        continue;
      } else {
        // Interior / Yard BFS chasing toward player!
        z.curRoom = nearestNode(pos.x, pos.z);
        if (z.curRoom !== playerRoom) {
          const path = findPathNodes(z.curRoom, playerRoom);
          if (path.length >= 2) {
            const portalPt = getPortalTarget(path[0], path[1], pos);
            tx = portalPt[0]; tz = portalPt[1];
          }
        }
        openDoorIfNear(pos.x, pos.z, null);
        if (tx !== playerPos.x || tz !== playerPos.z) openDoorIfNear(tx, tz, null);
      }

      // Move toward (tx, tz), stopping cleanly 1.05m from player so full Minecraft body stays visible
      const dx = tx - pos.x, dz = tz - pos.z;
      const dist = Math.hypot(dx, dz);
      const isDirectPlayer = (tx === playerPos.x && tz === playerPos.z);
      const inDoorCorridor = !isDirectPlayer || isNearAnyDoorway(pos.x, pos.z);
      if (inDoorCorridor) z.detourT = 0; // Never steer perpendicular into door jambs
      const stopD = isDirectPlayer ? 1.05 : 0.05;
      if (dist > 0.05) {
        const targetYaw = Math.atan2(dx, dz);
        z.rig.root.rotation.y = targetYaw;
      }
      if (dist > stopD) {
        const step = Math.min(dist - stopD, z.speed * dt);
        const dirX = dx / dist, dirZ = dz / dist;
        const prevX = pos.x, prevZ = pos.z;
        if (z.phase === 'chase' && !inDoorCorridor && z.detourT > 0) {
          z.detourT -= dt;
          // Slide cleanly around room furniture when chasing in open space
          const perpX = -dirZ * z.detourSign, perpZ = dirX * z.detourSign;
          const steerX = dirX * 0.45 + perpX * 0.89;
          const steerZ = dirZ * 0.45 + perpZ * 0.89;
          const sLen = Math.hypot(steerX, steerZ) || 1;
          pos.x += (steerX / sLen) * step;
          pos.z += (steerZ / sLen) * step;
        } else {
          pos.x += dirX * step;
          pos.z += dirZ * step;
        }
        if (z.phase === 'chase') {
          resolveZombieCollisions(pos, 0.14);
          const moved = Math.hypot(pos.x - prevX, pos.z - prevZ);
          if (step > 0.004 && moved < step * 0.42) {
            z.stuckT += dt;
            if (!inDoorCorridor && z.stuckT > 0.16) {
              if (z.detourT > 0) z.detourSign *= -1;
              z.detourT = 0.55;
              z.stuckT = 0;
            }
          } else {
            z.stuckT = Math.max(0, z.stuckT - dt * 2);
          }

          // Progress watchdog: if stalled near any threshold/corner for 0.85s, open nearby doors & advance along centerline
          z.watchT += dt;
          if (z.watchT > 0.85) {
            const progressed = Math.hypot(pos.x - z.watchX, pos.z - z.watchZ);
            if (progressed < 0.22 && dist > stopD + 0.15) {
              openDoorIfNear(pos.x, pos.z, null);
              pos.x += dirX * Math.min(0.32, dist * 0.5);
              pos.z += dirZ * Math.min(0.32, dist * 0.5);
              resolveZombieCollisions(pos, 0.14);
              z.detourSign *= -1;
            }
            z.watchX = pos.x;
            z.watchZ = pos.z;
            z.watchT = 0;
          }
        }
      }
      pos.y += (targetY - pos.y) * Math.min(1, dt * 8);

      // Animate blocky Minecraft arms & legs
      z.walkCycle += dt * z.speed * 5.2;
      const swing = Math.sin(z.walkCycle) * 0.65;
      z.rig.legL.rotation.x = swing;
      z.rig.legR.rotation.x = -swing;
      z.rig.armL.rotation.x = -Math.PI / 2 + Math.sin(z.walkCycle * 0.7) * 0.14;
      z.rig.armR.rotation.x = -Math.PI / 2 - Math.sin(z.walkCycle * 0.7) * 0.14;

      // Separation between overlapping zombies (suspended in narrow doorway corridors so they file through cleanly)
      if (!inDoorCorridor) {
        for (let j = i - 1; j >= 0; j--) {
          const oz = zombies[j].rig.root.position;
          if (isNearAnyDoorway(oz.x, oz.z)) continue;
          const sx = pos.x - oz.x, sz = pos.z - oz.z;
          const sd = Math.hypot(sx, sz);
          if (sd > 0.001 && sd < 0.52) {
            const push = (0.52 - sd) * 0.45;
            pos.x += (sx / sd) * push; pos.z += (sz / sd) * push;
            oz.x -= (sx / sd) * push; oz.z -= (sz / sd) * push;
          }
        }
      }

      // Keep chasing zombies from clipping right inside the player's camera
      const px = pos.x - playerPos.x, pz = pos.z - playerPos.z;
      const pd = Math.hypot(px, pz);
      if (z.phase === 'chase' && pd > 0.001 && pd < 0.78) {
        pos.x = playerPos.x + (px / pd) * 0.78;
        pos.z = playerPos.z + (pz / pd) * 0.78;
      }
      if (z.phase === 'chase') {
        resolveZombieCollisions(pos, 0.14);
      }

      // Melee bite attack when reaching player
      if (z.atkCooldown > 0) z.atkCooldown -= dt;
      const distToPlayer = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z);
      if (distToPlayer < 1.25 && z.phase === 'chase' && z.atkCooldown <= 0 && game.hurtCooldown <= 0) {
        z.atkCooldown = 1.05;
        game.hurtCooldown = 0.65;
        game.hurtFlash = 0.75;
        game.hp = Math.max(0, game.hp - 15);
        blaster.sfx.hurt();
        if (game.hp <= 0) {
          game.gameOver = true;
        }
      }
    }

    updateCat(dt, playerPos, playerRoom);
  }

  function getMinimapDots() {
    return zombies.map(z => ({ x: z.rig.root.position.x, z: z.rig.root.position.z, dying: z.phase === 'dying' }));
  }

  // Start Wave 1 immediately!
  resetGame();

  return {
    game, resetGame, setGameActive, raycastZombie, checkDartHit, setCatTarget,
    tryEatNoodles, getNoodleState: () => ({ active: noodleBowl.active, x: noodleBowl.pos.x, z: noodleBowl.pos.z }),
    getHomeworkState: () => ({ active: homework.active, timeLeft: homework.timeLeft, progress: homework.progress, needHold: homework.needHold, x: homework.pos.x, z: homework.pos.z }),
    update, getMinimapDots, getCatDot, isVipPending: () => vipPending
  };
};
