// Architectural Shell: Exact Floorplan Walls, Windows, Doors, Floors, Ceilings, Colliders
window.APP = window.APP || {};

APP.H = 2.42; // Normal ceiling height (m)
APP.XZ = 1.24; // Wider & roomier floorplan expansion in X/Z only

APP.buildArchitecture = function(scene, mats) {
  const H = APP.H;
  const S = APP.XZ;
  const archGroup = new THREE.Group();
  const ceilingGroup = new THREE.Group();
  const colliders = [];     // Static AABB / segment colliders: { x1, z1, x2, z2, r }
  const doors = [];         // Interactive doors: { pivot, mesh, openAngle, closedAngle, isOpen, type, slideVec, colliderIdx, label }
  const blindSlats = [];    // Individual vertical blind slats zombies can smash through
  const exteriorWallRefs = [];

  // Helper: add wall collision box (axis-aligned or angled capsule-line) in scaled world coords
  function addSegmentCollider(x1, z1, x2, z2, halfThick, isWindowWall = false) {
    colliders.push({ kind: 'seg', x1: x1 * S, z1: z1 * S, x2: x2 * S, z2: z2 * S, pad: halfThick * S, enabled: true, isWindowWall });
    return colliders.length - 1;
  }
  function addBoxCollider(cx, cz, wx, wz, topY = undefined) {
    colliders.push({ kind: 'box', minX: (cx - wx / 2) * S, maxX: (cx + wx / 2) * S, minZ: (cz - wz / 2) * S, maxZ: (cz + wz / 2) * S, topY, enabled: true });
    return colliders.length - 1;
  }

  // Add baseboard strip along wall face
  function addBaseboard(x, y, z, len, rotY, offsetNormal, mat, h = 0.075, d = 0.014) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, d), mat);
    const nx = Math.sin(rotY), nz = Math.cos(rotY);
    m.position.set(x + nx * offsetNormal, y, z + nz * offsetNormal);
    m.rotation.y = rotY;
    m.receiveShadow = true;
    m.userData.noDestroy = true;
    archGroup.add(m);
  }

  // Window builder inside an opening
  function buildWindow(cx, cz, len, rotY, t, y0, y1, opts = {}) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    g.rotation.y = rotY;

    const frameT = 0.055;
    const frameD = t + 0.015;
    const h = y1 - y0;
    const ym = (y0 + y1) / 2;

    // Outer frame (top, bottom, left, right)
    const topF = new THREE.Mesh(new THREE.BoxGeometry(len, frameT, frameD), mats.trimWhite);
    topF.position.set(0, y1 - frameT / 2, 0);
    const botF = new THREE.Mesh(new THREE.BoxGeometry(len, frameT, frameD + 0.02), mats.trimWhite);
    botF.position.set(0, y0 + frameT / 2, 0);
    botF.castShadow = true; botF.receiveShadow = true;
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(frameT, h, frameD), mats.trimWhite);
    leftF.position.set(-len / 2 + frameT / 2, ym, 0);
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(frameT, h, frameD), mats.trimWhite);
    rightF.position.set(len / 2 - frameT / 2, ym, 0);
    g.add(topF, botF, leftF, rightF);

    // Interior windowsill extension
    if (opts.sillIn !== false) {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(len + 0.06, 0.025, 0.09), mats.trimWhite);
      const sgn = opts.inSign || 1;
      sill.position.set(0, y0 + 0.012, sgn * (t / 2 + 0.025));
      sill.receiveShadow = true;
      g.add(sill);
    }

    // Mullions / transoms
    const innerW = len - frameT * 2;
    const innerH = h - frameT * 2;
    if (opts.splitX !== undefined) {
      const mx = -len / 2 + frameT + innerW * opts.splitX;
      const mull = new THREE.Mesh(new THREE.BoxGeometry(0.05, innerH, frameD * 0.8), mats.trimWhite);
      mull.position.set(mx, ym, 0);
      mull.castShadow = true;
      g.add(mull);
    }
    if (opts.transomY !== undefined) {
      // Horizontal bar inside one side or full width
      const xStart = opts.transomLeftOnly ? -len / 2 + frameT : -len / 2 + frameT;
      const wBar = opts.transomLeftOnly ? innerW * opts.splitX : innerW;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(wBar, 0.042, frameD * 0.72), mats.trimWhite);
      bar.position.set(xStart + wBar / 2, y0 + frameT + innerH * opts.transomY, 0);
      bar.castShadow = true;
      g.add(bar);
    }

    // Glass pane
    const glassMat = opts.frosted ? mats.frostedGlass : mats.glass;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), glassMat);
    pane.position.set(0, ym, 0);
    g.add(pane);

    // Plissegardin (pleated blind)
    if (opts.blindFrac && opts.blindFrac > 0) {
      const bh = innerH * opts.blindFrac;
      const blind = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.01, bh, 0.018), mats.blindDark);
      const by = opts.blindBottom
        ? (y0 + frameT + bh / 2)
        : (y1 - frameT - bh / 2);
      blind.position.set(0, by, (opts.inSign || 1) * 0.02);
      blind.castShadow = true;
      g.add(blind);
    }

    // White vertical blinds (lamellgardiner) spanning full height & just past sill
    if (opts.verticalBlinds) {
      const sgn = opts.inSign || 1;
      const trackW = len + 0.06;
      const track = new THREE.Mesh(new THREE.BoxGeometry(trackW, 0.032, 0.048), mats.trimWhite);
      track.position.set(0, y1 + 0.02, sgn * (t / 2 + 0.035));
      track.userData.noDestroy = true;
      g.add(track);
      const slatTop = y1 + 0.005;
      const slatBot = Math.max(0.66, y0 - 0.16);
      const slatH = slatTop - slatBot;
      const isOpenBlinds = opts.verticalBlinds === 'open';
      const slatW = isOpenBlinds ? 0.095 : 0.105;
      const count = Math.max(4, Math.floor((trackW - 0.04) / 0.076));
      const step = (trackW - 0.06) / Math.max(1, count - 1);
      const slatAngle = isOpenBlinds ? 0.92 : 0.14;
      const slatMat = mats.ceramicWhite;
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
      const sz = sgn * (t / 2 + 0.042);
      for (let i = 0; i < count; i++) {
        const sx = -trackW / 2 + 0.03 + i * step;
        const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, slatH, 0.004), slatMat);
        slat.position.set(sx, slatBot + slatH / 2, sz);
        slat.rotation.y = slatAngle;
        slat.castShadow = true;
        slat.receiveShadow = true;
        slat.userData.noDestroy = true;
        g.add(slat);
        blindSlats.push({
          mesh: slat,
          wx: (cx + cosR * sx + sinR * sz) * S,
          wz: (cz - sinR * sx + cosR * sz) * S,
          broken: false
        });
      }
    }

    archGroup.add(g);
  }

  // Interactive Door Builder
  function buildDoor(cx, cz, len, rotY, t, op) {
    const h = op.y1 || 2.10;
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    g.rotation.y = rotY;

    // Casing frame (sides & top)
    const fW = 0.055;
    const fD = t + 0.028;
    const leftC = new THREE.Mesh(new THREE.BoxGeometry(fW, h + 0.03, fD), mats.trimWhite);
    leftC.position.set(-len / 2 - fW / 2 + 0.02, (h + 0.03) / 2, 0);
    const rightC = new THREE.Mesh(new THREE.BoxGeometry(fW, h + 0.03, fD), mats.trimWhite);
    rightC.position.set(len / 2 + fW / 2 - 0.02, (h + 0.03) / 2, 0);
    const topC = new THREE.Mesh(new THREE.BoxGeometry(len + fW * 1.4, fW, fD), mats.trimWhite);
    topC.position.set(0, h + fW / 2 - 0.01, 0);
    g.add(leftC, rightC, topC);

    // Oak or slate threshold
    const thresh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.014, t + 0.01), mats.oakFurniture);
    thresh.position.set(0, 0.007, 0);
    g.add(thresh);

    // Compute world coordinates of door opening for its dynamic collider
    const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
    const dx1 = cx - cosR * (len / 2), dz1 = cz + sinR * (len / 2);
    const dx2 = cx + cosR * (len / 2), dz2 = cz - sinR * (len / 2);
    const colIdx = addSegmentCollider(dx1, dz1, dx2, dz2, t * 0.5 + 0.04);

    if (op.doorKind === 'sliding') {
      // Sliding door leaf (Bod)
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(len + 0.04, h - 0.02, 0.038), mats.doorWhite);
      const slideSign = op.slideDir || -1;
      const closedX = 0;
      const openX = slideSign * (len * 0.78);
      const isOpen = op.startOpen !== false;
      leaf.position.set(isOpen ? openX : closedX, h / 2, (op.swingSign || 1) * (t / 2 + 0.025));
      leaf.castShadow = true; leaf.receiveShadow = true;
      // Recessed pull ring
      const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.045, 12), mats.chrome);
      pull.rotation.x = Math.PI / 2;
      pull.position.set(-slideSign * (len * 0.38), 1.0, 0);
      leaf.add(pull);
      g.add(leaf);

      colliders[colIdx].enabled = !isOpen;
      const dRec = {
        type: 'sliding', mesh: leaf, closedX, openX, isOpen, colliderIdx: colIdx,
        label: op.label || 'Skyvedør', interactMeshes: [leaf]
      };
      leaf.userData.doorRef = dRec;
      g.traverse(ch => { if (ch.isMesh) ch.userData.noDestroy = true; });
      doors.push(dRec);
    } else {
      // Hinged door
      const hingeSide = op.hingeSide || -1; // -1 = left (-len/2), +1 = right (+len/2)
      const swingSign = op.swingSign || 1;  // +1 = +Z_local, -1 = -Z_local
      const pivot = new THREE.Group();
      pivot.position.set(hingeSide * (len / 2 - 0.02), 0, 0);
      g.add(pivot);

      const leafW = len - 0.04;
      const leafMat = op.doorKind === 'front' ? mats.frontDoor : mats.doorWhite;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, h - 0.02, 0.042), leafMat);
      leaf.position.set(-hingeSide * (leafW / 2), h / 2, 0);
      leaf.castShadow = true; leaf.receiveShadow = true;
      pivot.add(leaf);

      if (op.doorKind === 'terrace') {
        // Glass terrace door: top glass pane + bottom white panel
        const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(leafW - 0.18, h - 0.45), mats.glass);
        glassPane.position.set(-hingeSide * (leafW / 2), h / 2 + 0.1, 0);
        // Replace solid leaf with frame + glass
        pivot.remove(leaf);
        const stileW = 0.095;
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(stileW, h - 0.02, 0.052), mats.doorWhite);
        s1.position.set(-hingeSide * (stileW / 2), h / 2, 0);
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(stileW, h - 0.02, 0.052), mats.doorWhite);
        s2.position.set(-hingeSide * (leafW - stileW / 2), h / 2, 0);
        const botR = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.36, 0.052), mats.doorWhite);
        botR.position.set(-hingeSide * (leafW / 2), 0.18, 0);
        const topR = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.12, 0.052), mats.doorWhite);
        topR.position.set(-hingeSide * (leafW / 2), h - 0.07, 0);
        s1.castShadow = s2.castShadow = botR.castShadow = topR.castShadow = true;
        pivot.add(s1, s2, botR, topR, glassPane);
        s1.userData.doorRef = s2.userData.doorRef = botR.userData.doorRef = topR.userData.doorRef = null;
      } else if (op.doorKind === 'front') {
        // Vertical frosted glass strip + Yale Doorman smartlock
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.92, 0.052), mats.frostedGlass);
        strip.position.set(-hingeSide * (leafW * 0.5), 1.18, 0);
        const stripFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.048), mats.darkMetal);
        stripFrame.position.set(-hingeSide * (leafW * 0.5), 1.18, 0);
        const smartLock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.085), mats.darkMetal);
        smartLock.position.set(-hingeSide * (leafW - 0.09), 1.05, 0);
        pivot.add(stripFrame, strip, smartLock);
      }

      // Door handle on both sides
      const handleX = -hingeSide * (leafW - 0.08);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.11), mats.chrome);
      handle.position.set(handleX, 1.0, 0);
      pivot.add(handle);

      const openAngle = hingeSide * swingSign * (op.openDeg || 84) * Math.PI / 180;
      const isOpen = op.startOpen !== undefined ? op.startOpen : (op.doorKind !== 'front');
      pivot.rotation.y = isOpen ? openAngle : 0;
      colliders[colIdx].enabled = !isOpen;

      const dRec = {
        type: 'hinged', pivot, closedAngle: 0, openAngle, isOpen,
        colliderIdx: colIdx, label: op.label || 'Dør',
        isInterior: op.doorKind === 'interior'
      };
      pivot.traverse(ch => { if (ch.isMesh) ch.userData.doorRef = dRec; });
      g.traverse(ch => { if (ch.isMesh) ch.userData.noDestroy = true; });
      doors.push(dRec);
    }

    archGroup.add(g);
  }

  // Main Wall Segment Builder (with openings & per-side materials)
  function addWall(cfg) {
    const { x1, z1, x2, z2, t, matPos, matNeg, openings = [], basePos = true, baseNeg = true, isExterior = false } = cfg;
    const dx = x2 - x1, dz = z2 - z1;
    const L = Math.hypot(dx, dz);
    const rotY = Math.atan2(-dz, dx);
    const ux = dx / L, uz = dz / L;
    // local +Z in world = (sin(rotY), cos(rotY)) = (-uz, ux)
    const nx = -uz, nz = ux;

    const sorted = [...openings].sort((a, b) => a.s0 - b.s0);
    const wallMats = [
      mats.trimWhite, mats.trimWhite,
      mats.trimWhite, mats.trimWhite,
      matPos, matNeg
    ];

    function makeBlock(s0, s1, y0, y1) {
      const bw = s1 - s0, bh = y1 - y0;
      if (bw <= 0.002 || bh <= 0.002) return;
      const nx = Math.max(1, Math.round(bw / 0.42));
      const ny = Math.max(1, Math.round(bh / 0.48));
      const dx = bw / nx, dy = bh / ny;
      for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
          const sx = s0 + (ix + 0.5) * dx;
          const sy = y0 + (iy + 0.5) * dy;
          const geo = new THREE.BoxGeometry(dx, dy, t);
          if (nx > 1 || ny > 1) {
            const uv = geo.attributes.uv;
            const nrm = geo.attributes.normal;
            for (let vi = 0; vi < uv.count; vi++) {
              const nz = nrm.getZ(vi);
              if (Math.abs(nz) > 0.5) {
                const u = uv.getX(vi), v = uv.getY(vi);
                const mappedU = nz > 0 ? (ix + u) / nx : (nx - 1 - ix + u) / nx;
                uv.setXY(vi, mappedU, (iy + v) / ny);
              }
            }
          }
          const mesh = new THREE.Mesh(geo, wallMats);
          mesh.position.set(x1 + ux * sx, sy, z1 + uz * sx);
          mesh.rotation.y = rotY;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.destructible = 'wall';
          mesh.userData.maxHp = 3;
          mesh.userData.hp = 3;
          archGroup.add(mesh);
        }
      }
    }

    let cursor = 0;
    for (const op of sorted) {
      if (op.s0 > cursor + 0.005) {
        makeBlock(cursor, op.s0, 0, H);
        // Static collider for solid pier
        addSegmentCollider(x1 + ux * cursor, z1 + uz * cursor, x1 + ux * op.s0, z1 + uz * op.s0, t / 2);
        // Baseboard & crown on solid pier
        const sm = (cursor + op.s0) / 2, bw = op.s0 - cursor;
        if (basePos) {
          addBaseboard(x1 + ux * sm, 0.0375, z1 + uz * sm, bw, rotY, t / 2 + 0.007, mats.trimWhite, 0.075, 0.014);
          addBaseboard(x1 + ux * sm, H - 0.025, z1 + uz * sm, bw, rotY, t / 2 + 0.012, mats.trimWhite, 0.05, 0.024);
        }
        if (baseNeg) {
          addBaseboard(x1 + ux * sm, 0.0375, z1 + uz * sm, bw, rotY, -(t / 2 + 0.007), mats.trimWhite, 0.075, 0.014);
          addBaseboard(x1 + ux * sm, H - 0.025, z1 + uz * sm, bw, rotY, -(t / 2 + 0.012), mats.trimWhite, 0.05, 0.024);
        }
      }
      // Above opening lintel
      const yTop = op.y1 || 2.10;
      if (yTop < H - 0.005) {
        makeBlock(op.s0, op.s1, yTop, H);
        const sm = (op.s0 + op.s1) / 2, bw = op.s1 - op.s0;
        if (basePos) addBaseboard(x1 + ux * sm, H - 0.025, z1 + uz * sm, bw, rotY, t / 2 + 0.012, mats.trimWhite, 0.05, 0.024);
        if (baseNeg) addBaseboard(x1 + ux * sm, H - 0.025, z1 + uz * sm, bw, rotY, -(t / 2 + 0.012), mats.trimWhite, 0.05, 0.024);
      }
      // Below opening sill (if window)
      const yBot = op.y0 || 0;
      if (yBot > 0.005) {
        makeBlock(op.s0, op.s1, 0, yBot);
        addSegmentCollider(x1 + ux * op.s0, z1 + uz * op.s0, x1 + ux * op.s1, z1 + uz * op.s1, t / 2, true);
        const sm = (op.s0 + op.s1) / 2, bw = op.s1 - op.s0;
        if (basePos) addBaseboard(x1 + ux * sm, 0.0375, z1 + uz * sm, bw, rotY, t / 2 + 0.007, mats.trimWhite, 0.075, 0.014);
        if (baseNeg) addBaseboard(x1 + ux * sm, 0.0375, z1 + uz * sm, bw, rotY, -(t / 2 + 0.007), mats.trimWhite, 0.075, 0.014);
      }

      const om = (op.s0 + op.s1) / 2;
      const ox = x1 + ux * om, oz = z1 + uz * om;
      if (op.type === 'window') {
        buildWindow(ox, oz, op.s1 - op.s0, rotY, t, yBot, yTop, op);
      } else if (op.type === 'door') {
        buildDoor(ox, oz, op.s1 - op.s0, rotY, t, op);
      }
      cursor = op.s1;
    }

    if (cursor < L - 0.005) {
      makeBlock(cursor, L, 0, H);
      addSegmentCollider(x1 + ux * cursor, z1 + uz * cursor, x2, z2, t / 2);
      const sm = (cursor + L) / 2, bw = L - cursor;
      if (basePos) {
        addBaseboard(x1 + ux * sm, 0.0375, z1 + uz * sm, bw, rotY, t / 2 + 0.007, mats.trimWhite, 0.075, 0.014);
        addBaseboard(x1 + ux * sm, H - 0.025, z1 + uz * sm, bw, rotY, t / 2 + 0.012, mats.trimWhite, 0.05, 0.024);
      }
      if (baseNeg) {
        addBaseboard(x1 + ux * sm, 0.0375, z1 + uz * sm, bw, rotY, -(t / 2 + 0.007), mats.trimWhite, 0.075, 0.014);
        addBaseboard(x1 + ux * sm, H - 0.025, z1 + uz * sm, bw, rotY, -(t / 2 + 0.012), mats.trimWhite, 0.05, 0.024);
      }
    }
    if (isExterior) exteriorWallRefs.push({ x1, z1, x2, z2, nx, nz });
  }

  // ==================== BUILD EXACT APARTMENT SHELL ====================
  // Coordinate system: X = West->East, Z = North->South
  // Note: for wall (x1,z1)->(x2,z2):
  //   If West->East (+X): matPos = +Z (South), matNeg = -Z (North)
  //   If North->South (+Z): matPos = -X (West), matNeg = +X (East)

  // 1. Kitchen North Wall (Z = -0.10, X = -0.20 .. 3.20) -> South (+Z) is Kitchen, North (-Z) is Exterior
  addWall({
    x1: -0.20, z1: -0.10, x2: 3.20, z2: -0.10, t: 0.20,
    matPos: mats.sandWall, matNeg: mats.sidingWhite, baseNeg: false, isExterior: true,
    openings: [
      { type: 'window', s0: 2.20, s1: 3.28, y0: 0.94, y1: 2.12, inSign: 1, blindFrac: 0.26, blindBottom: true }
    ]
  });

  // 2. Kitchen-to-Dining Step Wall (X = 3.10, Z = -0.70 .. 0.00) -> +Z_local is West (-X, Exterior), -Z_local is East (+X, Dining)
  addWall({
    x1: 3.10, z1: -0.70, x2: 3.10, z2: 0.00, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.sandWall, basePos: false, isExterior: true
  });

  // 3. Dining Bay North Wall (Z = -0.60, X = 3.00 .. 6.00) -> +Z is Dining, -Z is Exterior
  addWall({
    x1: 3.00, z1: -0.60, x2: 6.00, z2: -0.60, t: 0.20,
    matPos: mats.sandWall, matNeg: mats.sidingWhite, baseNeg: false, isExterior: true,
    openings: [
      { type: 'window', s0: 0.62, s1: 2.58, y0: 0.88, y1: 2.12, inSign: 1, splitX: 0.28 }
    ]
  });

  // 4. Dining Terrace Door Wall (X = 5.90, Z = -0.70 .. 1.24) -> +Z_local is West (-X, Dining), -Z_local is East (+X, Terrace)
  addWall({
    x1: 5.90, z1: -0.70, x2: 5.90, z2: 1.24, t: 0.20,
    matPos: mats.sandWall, matNeg: mats.sidingBeige, baseNeg: false, isExterior: true,
    openings: [
      { type: 'door', doorKind: 'terrace', s0: 0.56, s1: 1.44, y0: 0.0, y1: 2.12, hingeSide: 1, swingSign: -1, openDeg: 75, startOpen: true, label: 'Terrassedør' }
    ]
  });

  // 5. 45° Angled TV Wall: inner face (5.80, 1.20) -> (7.52, 2.92), shifted outward (+0.071, -0.071)
  addWall({
    x1: 5.871, z1: 1.129, x2: 7.591, z2: 2.849, t: 0.20,
    matPos: mats.sandWall, matNeg: mats.sidingBeige, baseNeg: false, isExterior: true
  });

  // 6. Short Corner Return above East Living Window (Z = 2.82, X = 7.52 .. 8.23) -> +Z is Living, -Z is Terrace
  addWall({
    x1: 7.52, z1: 2.82, x2: 8.23, z2: 2.82, t: 0.20,
    matPos: mats.sandWall, matNeg: mats.sidingBeige, baseNeg: false, isExterior: true
  });

  // 7. Living Room Right Window Wall (X = 8.13, Z = 2.72 .. 6.62) -> +Z_local is West (-X, Living), -Z_local is East (+X, Terrace)
  addWall({
    x1: 8.13, z1: 2.72, x2: 8.13, z2: 6.62, t: 0.20,
    matPos: mats.sandWall, matNeg: mats.sidingBeige, baseNeg: false, isExterior: true,
    openings: [
      { type: 'window', s0: 0.44, s1: 1.14, y0: 0.88, y1: 2.12, inSign: 1, transomY: 0.45, verticalBlinds: 'open' },
      { type: 'window', s0: 1.48, s1: 3.55, y0: 0.88, y1: 2.12, inSign: 1, splitX: 0.31, transomY: 0.45, transomLeftOnly: true, verticalBlinds: 'closed' }
    ]
  });

  // 8. Step back from Living Room (8.03) to East Bedroom (7.55) at Z = 6.62 -> +Z is Exterior, -Z is Living (kalkmaling)
  addWall({
    x1: 7.65, z1: 6.62, x2: 8.23, z2: 6.62, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.kalkWall, basePos: false, isExterior: true
  });

  // 9. East Bedroom + Bod Outer Wall (X = 7.65, Z = 6.52 .. 10.56) -> +Z_local is West (-X, Room/Bod), -Z_local is East (+X, Exterior)
  addWall({
    x1: 7.65, z1: 6.52, x2: 7.65, z2: 10.56, t: 0.20,
    matPos: mats.panelWall, matNeg: mats.sidingWhite, baseNeg: false, isExterior: true,
    openings: [
      { type: 'window', s0: 0.65, s1: 1.75, y0: 0.90, y1: 2.08, inSign: 1, blindFrac: 0.42 }
    ]
  });

  // 10. South Outer Wall (Z = 10.46, X = -0.20 .. 7.75) -> +Z is Exterior, -Z is Interior (SW Bed / Entre / Bod)
  addWall({
    x1: -0.20, z1: 10.46, x2: 7.75, z2: 10.46, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.panelWall, basePos: false, isExterior: true,
    openings: [
      { type: 'door', doorKind: 'front', s0: 3.65, s1: 4.58, y0: 0.0, y1: 2.12, hingeSide: -1, swingSign: -1, openDeg: 85, startOpen: true, label: 'Inngangsdør (Smartlås)' }
    ]
  });

  // 11. West Outer Wall (X = -0.10, Z = -0.20 .. 10.56) -> Split into sections so each room gets its exact wall material!
  // 11a. Kitchen West (Z = -0.20 .. 2.66)
  addWall({
    x1: -0.10, z1: -0.20, x2: -0.10, z2: 2.66, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.sandWall, basePos: false, isExterior: true
  });
  // 11b. Master Bedroom West (Z = 2.66 .. 6.18)
  addWall({
    x1: -0.10, z1: 2.66, x2: -0.10, z2: 6.18, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.terracottaWall, basePos: false, isExterior: true,
    openings: [
      { type: 'window', s0: 1.18, s1: 2.28, y0: 0.90, y1: 2.06, inSign: -1, blindFrac: 0.18 }
    ]
  });
  // 11c. Bathroom West (Z = 6.18 .. 8.10)
  addWall({
    x1: -0.10, z1: 6.18, x2: -0.10, z2: 8.10, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.bathWallTile, basePos: false, baseNeg: false, isExterior: true,
    openings: [
      { type: 'window', s0: 1.12, s1: 1.82, y0: 0.96, y1: 2.06, inSign: -1, frosted: true }
    ]
  });
  // 11d. SW Bedroom West (Z = 8.10 .. 10.56)
  addWall({
    x1: -0.10, z1: 8.10, x2: -0.10, z2: 10.56, t: 0.20,
    matPos: mats.sidingWhite, matNeg: mats.panelWall, basePos: false, isExterior: true,
    openings: [
      { type: 'window', s0: 0.68, s1: 1.72, y0: 0.90, y1: 2.06, inSign: -1, blindFrac: 0.16 }
    ]
  });

  // ==================== INTERIOR PARTITION WALLS (t = 0.12) ====================
  // I1. Kitchen / Master Bedroom divider (Z = 2.66, X = 0.00 .. 3.16) -> +Z is Master (terracotta), -Z is Kitchen (sand)
  addWall({
    x1: 0.00, z1: 2.66, x2: 3.16, z2: 2.66, t: 0.12,
    matPos: mats.terracottaWall, matNeg: mats.sandWall
  });

  // I2. Master Bedroom / Living divider (X = 3.16, Z = 2.66 .. 6.18) -> +Z_local is West (terracotta), -Z_local is East (sand)
  addWall({
    x1: 3.16, z1: 2.66, x2: 3.16, z2: 6.18, t: 0.12,
    matPos: mats.terracottaWall, matNeg: mats.sandWall,
    openings: [
      { type: 'door', doorKind: 'interior', s0: 2.48, s1: 3.34, y0: 0, y1: 2.10, hingeSide: 1, swingSign: 1, openDeg: 78, startOpen: true, label: 'Soverom 1 (10,5 m²)' }
    ]
  });

  // Protruding ventilation shaft column in Living Room (X = 3.22..3.64, Z = 3.30..3.95)
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.42, H, 0.65), mats.sandWall);
  shaft.position.set(3.43, H / 2, 3.625);
  shaft.castShadow = true; shaft.receiveShadow = true;
  archGroup.add(shaft);
  addBoxCollider(3.43, 3.625, 0.42, 0.65);
  // Baseboard & crown around shaft
  addBaseboard(3.43, 0.0375, 3.30, 0.44, Math.PI, 0.007, mats.trimWhite, 0.075, 0.014);
  addBaseboard(3.43, 0.0375, 3.95, 0.44, 0, 0.007, mats.trimWhite, 0.075, 0.014);
  addBaseboard(3.64, 0.0375, 3.625, 0.67, Math.PI / 2, 0.007, mats.trimWhite, 0.075, 0.014);
  addBaseboard(3.43, H - 0.025, 3.30, 0.46, Math.PI, 0.012, mats.trimWhite, 0.05, 0.024);
  addBaseboard(3.43, H - 0.025, 3.95, 0.46, 0, 0.012, mats.trimWhite, 0.05, 0.024);
  addBaseboard(3.64, H - 0.025, 3.625, 0.69, Math.PI / 2, 0.012, mats.trimWhite, 0.05, 0.024);

  // I3. Master Bedroom / Bath divider (Z = 6.18, X = 0.00 .. 3.16) -> +Z is Bath (white tile), -Z is Master (terracotta)
  addWall({
    x1: 0.00, z1: 6.18, x2: 3.16, z2: 6.18, t: 0.12,
    matPos: mats.bathWallTile, matNeg: mats.terracottaWall, basePos: false
  });

  // I4. Bath / Entre divider (X = 3.16, Z = 6.18 .. 8.10) -> +Z_local is West (bath tile), -Z_local is East (sand)
  addWall({
    x1: 3.16, z1: 6.18, x2: 3.16, z2: 8.10, t: 0.12,
    matPos: mats.bathWallTile, matNeg: mats.sandWall, basePos: false,
    openings: [
      { type: 'door', doorKind: 'interior', s0: 0.90, s1: 1.74, y0: 0, y1: 2.10, hingeSide: 1, swingSign: 1, openDeg: 78, startOpen: true, label: 'Bad (5,5 m²)' }
    ]
  });

  // I5. Bath / SW Bedroom divider (Z = 8.10, X = 0.00 .. 3.16) -> +Z is SW Bed (panel), -Z is Bath (white tile)
  addWall({
    x1: 0.00, z1: 8.10, x2: 3.16, z2: 8.10, t: 0.12,
    matPos: mats.panelWall, matNeg: mats.bathWallTile, baseNeg: false
  });

  // I6. SW Bedroom / Entre divider (X = 3.16, Z = 8.10 .. 10.36) -> +Z_local is West (panel), -Z_local is East (sand)
  addWall({
    x1: 3.16, z1: 8.10, x2: 3.16, z2: 10.36, t: 0.12,
    matPos: mats.panelWall, matNeg: mats.sandWall,
    openings: [
      { type: 'door', doorKind: 'interior', s0: 0.24, s1: 1.08, y0: 0, y1: 2.10, hingeSide: -1, swingSign: 1, openDeg: 82, startOpen: true, label: 'Soverom 2 (6,5 m² SV)' }
    ]
  });

  // I7. Living / East Bedroom divider (Z = 6.58, X = 4.63 .. 7.55) + Hallway lintel (X = 3.16 .. 4.63) -> -Z is Living (kalkmaling)
  addWall({
    x1: 3.16, z1: 6.58, x2: 4.63, z2: 6.58, t: 0.12,
    matPos: mats.sandWall, matNeg: mats.kalkWall,
    openings: [
      { type: 'opening', s0: 0, s1: 1.47, y0: 0, y1: 2.12 }
    ]
  });
  addWall({
    x1: 4.63, z1: 6.58, x2: 7.65, z2: 6.58, t: 0.12,
    matPos: mats.panelWall, matNeg: mats.kalkWall
  });

  // I8. Entre / East Bedroom divider (X = 4.69, Z = 6.58 .. 9.00) -> +Z_local is West (Entre sand), -Z_local is East (panel)
  addWall({
    x1: 4.69, z1: 6.58, x2: 4.69, z2: 9.00, t: 0.12,
    matPos: mats.sandWall, matNeg: mats.panelWall,
    openings: [
      { type: 'door', doorKind: 'interior', s0: 1.24, s1: 2.08, y0: 0, y1: 2.10, hingeSide: 1, swingSign: -1, openDeg: 84, startOpen: true, label: 'Soverom 3 (6,5 m² Ø)' }
    ]
  });

  // I9. East Bedroom / Bod divider (Z = 9.00, X = 4.69 .. 7.55) -> +Z is Bod (white), -Z is East Bed (panel)
  addWall({
    x1: 4.69, z1: 9.00, x2: 7.55, z2: 9.00, t: 0.12,
    matPos: mats.whiteWall, matNeg: mats.panelWall,
    openings: [
      { type: 'door', doorKind: 'sliding', s0: 1.75, s1: 2.55, y0: 0, y1: 2.10, slideDir: -1, swingSign: 1, startOpen: true, label: 'Innvendig bod (3 m²)' }
    ]
  });

  // I10. Entre Recessed Wardrobe back wall (separating wardrobe alcove from Bod, X = 5.26, Z = 9.00 .. 10.36)
  addWall({
    x1: 5.26, z1: 9.00, x2: 5.26, z2: 10.36, t: 0.12,
    matPos: mats.whiteWall, matNeg: mats.whiteWall
  });

  // ==================== FLOORS & CEILINGS ====================
  // Helper for rectangular floor / ceiling patches
  function addRectFloor(x0, z0, x1, z1, mat, y = 0) {
    const w = x1 - x0, d = z1 - z0;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.receiveShadow = true;
    m.userData.noDestroy = true;
    archGroup.add(m);
  }

  // Oak parquet across Living, Kitchen, Dining, 3 Bedrooms, Bod, and north end of Hallway
  // Shape covering exact apartment interior footprint
  const aptShape = new THREE.Shape();
  aptShape.moveTo(0, 0);
  aptShape.lineTo(3.20, 0);
  aptShape.lineTo(3.20, 0.50);
  aptShape.lineTo(5.80, 0.50);
  aptShape.lineTo(5.80, -1.20);
  aptShape.lineTo(7.52, -2.92);
  aptShape.lineTo(8.03, -2.92);
  aptShape.lineTo(8.03, -6.58);
  aptShape.lineTo(7.55, -6.58);
  aptShape.lineTo(7.55, -10.36);
  aptShape.lineTo(0, -10.36);
  aptShape.closePath();

  const floorGeo = new THREE.ShapeGeometry(aptShape);
  // Normalize UVs in meters so textures scale evenly
  const posAttr = floorGeo.attributes.position;
  const uvAttr = floorGeo.attributes.uv;
  for (let i = 0; i < posAttr.count; i++) {
    uvAttr.setXY(i, posAttr.getX(i) / 4.5, posAttr.getY(i) / 4.5);
  }
  const oakMain = new THREE.Mesh(floorGeo, mats.oakFloor);
  oakMain.rotation.x = -Math.PI / 2;
  oakMain.receiveShadow = true;
  oakMain.userData.noDestroy = true;
  archGroup.add(oakMain);

  // Entre dark charcoal tile overlay (Z = 6.75 .. 10.36, X = 3.22 .. 4.63)
  addRectFloor(3.22, 6.75, 4.63, 10.36, mats.entreTile, 0.002);
  // Thin aluminum transition strip at Z = 6.75
  const transStrip = new THREE.Mesh(new THREE.BoxGeometry(1.41, 0.005, 0.03), mats.chrome);
  transStrip.position.set(3.925, 0.0025, 6.75);
  transStrip.userData.noDestroy = true;
  archGroup.add(transStrip);

  // Bathroom slate tile overlay (X = 0 .. 3.10, Z = 6.24 .. 8.04)
  addRectFloor(0.0, 6.24, 3.10, 8.04, mats.bathFloorTile, 0.002);

  // Ceiling (in ceilingGroup so Dollhouse view hides it)
  const ceilGeo = new THREE.ShapeGeometry(aptShape);
  const ceilMesh = new THREE.Mesh(ceilGeo, mats.ceiling);
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.y = H;
  ceilMesh.userData.noDestroy = true;
  ceilMesh.castShadow = false;
  ceilMesh.receiveShadow = false;
  ceilingGroup.add(ceilMesh);

  // Ceiling downlights, smoke detectors, ventilation valves
  function addCeilingFixture(x, z, kind) {
    if (kind === 'downlight') {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16), mats.trimWhite);
      ring.position.set(x, H - 0.004, z);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.014, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff8e7 }));
      lens.position.set(x, H - 0.005, z);
      ceilingGroup.add(ring, lens);
    } else if (kind === 'smoke') {
      const det = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.035, 18), mats.trimWhite);
      det.position.set(x, H - 0.017, z);
      ceilingGroup.add(det);
    } else if (kind === 'valve') {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 20), mats.trimWhite);
      v.position.set(x, H - 0.012, z);
      ceilingGroup.add(v);
    } else if (kind === 'plafond') {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: 0.45, roughness: 0.25 }));
      p.rotation.x = Math.PI;
      p.scale.y = 0.45;
      p.position.set(x, H, z);
      ceilingGroup.add(p);
    }
  }

  // Hallway downlights & smoke detector & valve (matches p03_img0 & p12_img0)
  addCeilingFixture(3.92, 9.50, 'downlight');
  addCeilingFixture(3.92, 8.20, 'downlight');
  addCeilingFixture(3.92, 7.05, 'downlight');
  addCeilingFixture(3.92, 7.60, 'smoke');
  addCeilingFixture(4.42, 9.90, 'valve');
  // Kitchen & Living ceiling fixtures
  addCeilingFixture(1.65, 1.35, 'plafond');
  addCeilingFixture(4.60, 0.55, 'downlight');
  addCeilingFixture(5.25, 1.55, 'smoke');
  addCeilingFixture(6.35, 5.95, 'valve');
  // Bedrooms & Bath ceiling lights
  addCeilingFixture(1.60, 4.45, 'plafond');
  addCeilingFixture(1.60, 7.14, 'plafond');
  addCeilingFixture(2.40, 6.75, 'valve');
  addCeilingFixture(1.55, 9.25, 'plafond');
  addCeilingFixture(6.15, 7.80, 'plafond');
  addCeilingFixture(6.40, 9.70, 'plafond');

  archGroup.scale.set(S, 1, S);
  ceilingGroup.scale.set(S, 1, S);
  scene.add(archGroup);
  scene.add(ceilingGroup);

  function resetBlinds() {
    for (const s of blindSlats) {
      s.broken = false;
      s.mesh.visible = true;
    }
  }

  return { archGroup, ceilingGroup, colliders, doors, blindSlats, resetBlinds, addBoxCollider };
};
