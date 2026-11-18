// Living Room, Dining Nook & JKE Design Kitchen Furnishing
window.APP = window.APP || {};

APP.furnishLivingAndKitchen = function(scene, mats, arch) {
  const g = new THREE.Group();
  const H = APP.H;

  // Shared helper: framed artwork or tapestry
  function addArtFrame(w, h, x, y, z, rotY, artKey, frameMat, isTapestry = false) {
    const fg = new THREE.Group();
    fg.position.set(x, y, z);
    fg.rotation.y = rotY;
    const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats.getArtMat(artKey));
    art.position.z = 0.012;
    fg.add(art);
    if (isTapestry) {
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.022, 0.022), mats.darkMetal);
      topBar.position.set(0, h / 2 + 0.01, 0.014);
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.02, 0.02), mats.darkMetal);
      botBar.position.set(0, -h / 2 - 0.01, 0.014);
      fg.add(topBar, botBar);
    } else if (frameMat) {
      const ft = 0.024, fd = 0.024;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w + ft * 2, ft, fd), frameMat);
      top.position.set(0, h / 2 + ft / 2, fd / 2);
      const bot = new THREE.Mesh(new THREE.BoxGeometry(w + ft * 2, ft, fd), frameMat);
      bot.position.set(0, -h / 2 - ft / 2, fd / 2);
      const lf = new THREE.Mesh(new THREE.BoxGeometry(ft, h, fd), frameMat);
      lf.position.set(-w / 2 - ft / 2, 0, fd / 2);
      const rt = new THREE.Mesh(new THREE.BoxGeometry(ft, h, fd), frameMat);
      rt.position.set(w / 2 + ft / 2, 0, fd / 2);
      top.castShadow = bot.castShadow = lf.castShadow = rt.castShadow = true;
      fg.add(top, bot, lf, rt);
    }
    g.add(fg);
  }
  APP.addArtFrame = addArtFrame;

  // Shared helper: realistic potted plants
  function addPlant(kind, x, y, z, scale = 1) {
    const pg = new THREE.Group();
    pg.position.set(x, y, z);
    pg.scale.setScalar(scale);

    if (kind === 'dracaena') {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.28, 16), mats.terracottaPot);
      pot.position.y = 0.14; pot.castShadow = true;
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 14), mats.walnut);
      soil.position.y = 0.27;
      pg.add(pot, soil);
      const stems = [[-0.02, 0, 1.05, 0.05], [0.03, 0.02, 0.78, -0.07], [0.0, -0.03, 0.58, 0.06]];
      for (const [sx, sz, sh, tilt] of stems) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.018, sh, 8), mats.walnut);
        stem.position.set(sx, 0.25 + sh / 2, sz);
        stem.rotation.z = tilt;
        stem.castShadow = true;
        pg.add(stem);
        for (let i = 0; i < 16; i++) {
          const ang = i * 0.85;
          const elev = 0.15 + (i % 4) * 0.18;
          const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.032, 0.34), i % 2 ? mats.leafGreen : mats.leafDark);
          leaf.position.set(sx + Math.cos(ang) * 0.12, 0.25 + sh - 0.05 + Math.sin(elev) * 0.06, sz + Math.sin(ang) * 0.12);
          leaf.rotation.order = 'YXZ';
          leaf.rotation.y = -ang + Math.PI / 2;
          leaf.rotation.x = 1.15 - (i % 3) * 0.22;
          leaf.castShadow = true;
          pg.add(leaf);
        }
      }
    } else if (kind === 'fiddle') {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.30, 18), mats.ceramicWhite);
      pot.position.y = 0.15; pot.castShadow = true;
      pg.add(pot);
      for (let b = 0; b < 3; b++) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.015, 0.65 + b * 0.15, 8), mats.walnut);
        stem.position.set((b - 1) * 0.04, 0.55, (b % 2) * 0.03);
        stem.rotation.z = (b - 1) * 0.12;
        pg.add(stem);
        for (let i = 0; i < 7; i++) {
          const ang = i * 0.9 + b;
          const lf = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), i % 2 ? mats.leafGreen : mats.leafDark);
          lf.scale.set(1.0, 0.14, 1.55);
          lf.position.set((b - 1) * 0.06 + Math.cos(ang) * 0.11, 0.55 + i * 0.06, Math.sin(ang) * 0.11);
          lf.rotation.y = -ang;
          lf.rotation.x = 0.35;
          lf.castShadow = true;
          pg.add(lf);
        }
      }
    } else if (kind === 'smallHerb') {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.048, 0.11, 12), mats.terracottaPot);
      pot.position.y = 0.055; pot.castShadow = true;
      pg.add(pot);
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7;
        const sprig = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), mats.leafGreen);
        sprig.scale.set(0.7, 1.4, 0.7);
        sprig.position.set(Math.cos(a) * 0.03, 0.13 + (i % 3) * 0.025, Math.sin(a) * 0.03);
        pg.add(sprig);
      }
    } else if (kind === 'hanging') {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.13, 14), mats.terracottaPot);
      pot.position.y = 0; pot.castShadow = true;
      pg.add(pot);
      // Ceiling hanger cord
      const hangCord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.62, 6), mats.sandWall);
      hangCord.position.y = 0.34;
      pg.add(hangCord);
      for (let v = 0; v < 5; v++) {
        const a = v * 1.25;
        const vineLen = 0.24;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, vineLen, 5), mats.leafDark);
        stem.position.set(Math.cos(a) * 0.08, 0.05 - vineLen / 2, Math.sin(a) * 0.08);
        stem.rotation.z = -Math.cos(a) * 0.18;
        stem.rotation.x = Math.sin(a) * 0.18;
        pg.add(stem);
        for (let k = 0; k < 4; k++) {
          const lf = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), mats.leafGreen);
          lf.scale.set(1, 0.22, 1.3);
          lf.position.set(Math.cos(a) * (0.07 + k * 0.016), 0.04 - k * 0.058, Math.sin(a) * (0.07 + k * 0.016));
          pg.add(lf);
        }
      }
    }
    g.add(pg);
  }
  APP.addPlant = addPlant;

  // ==================== 1. JKE DESIGN KITCHEN ====================
  // Tall integrated fridge/freezer (X=0..0.60, Z=1.96..2.60) — hollow lit interior + animated door (indestructible)
  const fridgeGroup = new THREE.Group();
  const fBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.38, 0.62), mats.kitchenGloss);
  fBack.position.set(0.03, 1.19, 2.29);
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.56, 2.38, 0.045), mats.kitchenGloss);
  fLeft.position.set(0.30, 1.19, 1.995);
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.56, 2.38, 0.045), mats.kitchenGloss);
  fRight.position.set(0.30, 1.19, 2.585);
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.10, 0.62), mats.kitchenGloss);
  fTop.position.set(0.30, 2.33, 2.29);
  const fBot = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.62), mats.kitchenGloss);
  fBot.position.set(0.30, 0.03, 2.29);
  const fridgeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: 0.48, roughness: 0.35
  });
  const fInnerBack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.18, 0.54), fridgeGlowMat);
  fInnerBack.position.set(0.07, 1.16, 2.29);
  const fVentBot = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.54), mats.steel);
  fVentBot.position.set(0.585, 0.03, 2.29);
  const fVentTop = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.54), mats.steel);
  fVentTop.position.set(0.585, 2.34, 2.29);
  fridgeGroup.add(fBack, fLeft, fRight, fTop, fBot, fInnerBack, fVentBot, fVentTop);

  // Interior glass shelves tucked cleanly at back so zombies fit cleanly when waiting inside
  const fShelfMat = new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.55, roughness: 0.1 });
  for (const sy of [1.45, 1.85]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.014, 0.52), fShelfMat);
    sh.position.set(0.16, sy, 2.29);
    fridgeGroup.add(sh);
  }

  // Hinged full-height fridge door pivoted at South edge (0.58, 0, 2.59) swinging out into +X kitchen
  const fridgeDoorPivot = new THREE.Group();
  fridgeDoorPivot.position.set(0.58, 0, 2.59);
  const fDoor = new THREE.Mesh(new THREE.BoxGeometry(0.038, 2.24, 0.61), mats.kitchenGloss);
  fDoor.position.set(0, 1.18, -0.30);
  fDoor.castShadow = true; fDoor.receiveShadow = true;
  const fSeam = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.60), mats.darkMetal);
  fSeam.position.set(0.020, 0.90, -0.30);
  const fHandleTop = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.48, 8), mats.steel);
  fHandleTop.position.set(0.032, 1.32, -0.53);
  const fHandleBot = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.32, 8), mats.steel);
  fHandleBot.position.set(0.032, 0.66, -0.53);
  fridgeDoorPivot.add(fDoor, fSeam, fHandleTop, fHandleBot);
  fridgeGroup.add(fridgeDoorPivot);
  fridgeGroup.traverse(ch => { if (ch.isMesh) ch.userData.noDestroy = true; });
  g.add(fridgeGroup);
  arch.addBoxCollider(0.30, 2.29, 0.62, 0.64);
  arch.fridgeControl = { doorPivot: fridgeDoorPivot, openTimer: 0, targetAngle: -1.68 };

  // West wall lower cabinets (X=0..0.60, Z=0.00..1.98)
  const kLowWest = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.87, 1.98), mats.kitchenGloss);
  kLowWest.position.set(0.30, 0.435, 0.99);
  kLowWest.castShadow = true; kLowWest.receiveShadow = true;
  const kTopWest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.032, 2.00), mats.counterTop);
  kTopWest.position.set(0.31, 0.886, 1.00);
  kTopWest.receiveShadow = true;
  g.add(kLowWest, kTopWest);
  arch.addBoxCollider(0.31, 1.00, 0.64, 2.00);

  const kickW = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.11, 1.98), mats.kitchenGloss);
  kickW.position.set(0.275, 0.055, 0.99);
  g.add(kickW);

  // North wall lower cabinets (X=0.60..3.18, Z=0.00..0.60)
  const kLowNorth = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.87, 0.60), mats.kitchenGloss);
  kLowNorth.position.set(1.89, 0.435, 0.30);
  kLowNorth.castShadow = true; kLowNorth.receiveShadow = true;
  const kTopNorth = new THREE.Mesh(new THREE.BoxGeometry(2.60, 0.032, 0.62), mats.counterTop);
  kTopNorth.position.set(1.90, 0.886, 0.31);
  kTopNorth.receiveShadow = true;
  g.add(kLowNorth, kTopNorth);
  arch.addBoxCollider(1.90, 0.31, 2.60, 0.64);

  // Cabinet door/drawer groove lines & chrome top-edge bar pulls
  for (const zLine of [0.70, 1.32, 1.96]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.74, 0.006), mats.steel);
    seam.position.set(0.602, 0.49, zLine);
    g.add(seam);
  }
  for (const xLine of [1.28, 1.90, 2.54, 3.16]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.74, 0.005), mats.steel);
    seam.position.set(xLine, 0.49, 0.602);
    g.add(seam);
  }
  // Horizontal drawer seams & brushed steel pulls on North right drawers (X=1.90..3.16)
  for (const yLine of [0.36, 0.62]) {
    const hSeam = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.005, 0.005), mats.steel);
    hSeam.position.set(2.53, yLine, 0.602);
    g.add(hSeam);
  }
  for (const [bx, by] of [[2.22, 0.84], [2.22, 0.60], [2.85, 0.84], [2.85, 0.60]]) {
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.018), mats.chrome);
    pull.position.set(bx, by, 0.608);
    g.add(pull);
  }
  for (const bz of [0.98, 1.64]) {
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.56), mats.chrome);
    pull.position.set(0.608, 0.84, bz);
    g.add(pull);
  }

  // Upper cabinets along West wall (X=0..0.34, Z=0.04..1.98, Y=1.48..2.40)
  const kUpWest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.90, 1.94), mats.kitchenGloss);
  kUpWest.position.set(0.17, 1.93, 1.01);
  kUpWest.castShadow = true; kUpWest.receiveShadow = true;
  g.add(kUpWest);

  // Integrated black Microwave inside upper cabinet (Z=1.44..1.96, Y=1.48..1.86)
  const micro = new THREE.Mesh(new THREE.BoxGeometry(0.355, 0.36, 0.52), mats.darkMetal);
  micro.position.set(0.18, 1.67, 1.70);
  const microGlass = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.25, 0.38), mats.tvScreen);
  microGlass.position.set(0.36, 1.68, 1.71);
  g.add(micro, microGlass);

  // Glass backsplash behind West counter
  const splash = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.55, 1.94), mats.glass);
  splash.position.set(0.008, 1.18, 1.01);
  g.add(splash);

  // Kitchen sink & gooseneck tap (X=0.30, Z=1.08)
  const sinkRim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.018, 0.54), mats.darkMetal);
  sinkRim.position.set(0.30, 0.90, 1.08);
  const tapBase = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.24, 12), mats.darkMetal);
  tapBase.position.set(0.12, 1.02, 1.08);
  const tapSpout = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.011, 8, 14, Math.PI), mats.darkMetal);
  tapSpout.position.set(0.20, 1.14, 1.08);
  g.add(sinkRim, tapBase, tapSpout);

  // Built-in Oven (X=1.59, Z=0.30) & Induction Cooktop
  const ovenFace = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.02), mats.steel);
  ovenFace.position.set(1.59, 0.56, 0.60);
  const ovenGlass = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.025), mats.tvScreen);
  ovenGlass.position.set(1.59, 0.51, 0.605);
  const ovenHandle = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.018, 0.045), mats.chrome);
  ovenHandle.position.set(1.59, 0.72, 0.625);
  const cooktop = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.012, 0.52), mats.tvScreen);
  cooktop.position.set(1.59, 0.905, 0.31);
  g.add(ovenFace, ovenGlass, ovenHandle, cooktop);

  // Cylindrical Brushed Stainless Range Hood (X=1.59, Z=0.30)
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.84, 24), mats.steel);
  hood.position.set(1.59, 2.00, 0.30);
  hood.castShadow = true;
  const spiceShelf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.024, 0.10), mats.oakFurniture);
  spiceShelf.position.set(1.16, 1.48, 0.06);
  g.add(hood, spiceShelf);

  // Kitchen Countertop Appliances matching Photo 1:
  // Automatic Espresso/Coffee Machine under microwave (X=0.32, Z=1.72)
  const coffeeBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.30), mats.darkMetal);
  coffeeBody.position.set(0.30, 1.07, 1.72);
  coffeeBody.castShadow = true;
  const coffeeFront = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.22), mats.steel);
  coffeeFront.position.set(0.425, 1.09, 1.72);
  const coffeeTray = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.02, 0.22), mats.chrome);
  coffeeTray.position.set(0.45, 0.91, 1.72);
  g.add(coffeeBody, coffeeFront, coffeeTray);

  // Toaster & White Rice Cooker near NW corner (X=0.72..0.98) + Cutting board + Pot on stove
  const toaster = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.17, 0.24), mats.ceramicWhite);
  toaster.position.set(0.62, 0.985, 0.28);
  const riceCooker = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.19, 16), mats.ceramicWhite);
  riceCooker.position.set(0.92, 0.995, 0.30);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.30, 0.022), mats.oakFurniture);
  board.position.set(1.18, 1.05, 0.05);
  board.rotation.x = -0.14;
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.10, 0.11, 16), mats.steel);
  pot.position.set(1.54, 0.965, 0.28);
  // Black SodaStream (X=2.36) + Black Box Air Fryer (X=2.84) in front of kitchen window
  // (Leaves X=2.02, Z=0.38 free for the noodleBowl spawn in zombies.js)
  const sodaBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.38, 12), mats.darkMetal);
  sodaBody.position.set(2.36, 1.09, 0.24);
  const airFryer = new THREE.Mesh(APP.makeRoundedBox(0.28, 0.31, 0.28, 0.03, 2), mats.darkMetal);
  airFryer.position.set(2.84, 1.06, 0.34);
  airFryer.castShadow = true;
  const airHandle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.025, 0.04), mats.steel);
  airHandle.position.set(2.84, 1.02, 0.49);
  g.add(toaster, riceCooker, board, pot, sodaBody, airFryer, airHandle);

  // Kitchen flat round LED ceiling plafonds
  for (const [lx, lz] of [[1.45, 1.55], [2.25, 0.95]]) {
    const plaf = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 20), mats.ceramicWhite);
    plaf.position.set(lx, H - 0.015, lz);
    g.add(plaf);
  }

  // Kitchen South Wall (Z = 2.60 facing North -Z) — overhead white cabinets, Norway map, 2 botanical prints, calendar & spice rack
  const kUpSouth = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.50, 0.36), mats.kitchenGloss);
  kUpSouth.position.set(1.86, 2.15, 2.42);
  kUpSouth.castShadow = true; kUpSouth.receiveShadow = true;
  const kUpSouthSeam = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.49, 0.006), mats.steel);
  kUpSouthSeam.position.set(1.86, 2.15, 2.238);
  g.add(kUpSouth, kUpSouthSeam);
  // Norgeskart poster next to fridge, small schedule note, 2 botanical oak frames under cabinet, and 2026 calendar
  addArtFrame(0.38, 0.54, 0.92, 1.52, 2.596, Math.PI, 'norgeskart', null, false);
  const kNote = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.22), mats.ceramicWhite);
  kNote.rotation.y = Math.PI;
  kNote.position.set(1.26, 1.54, 2.595);
  g.add(kNote);
  addArtFrame(0.30, 0.40, 1.62, 1.50, 2.594, Math.PI, 'botan_yellow', mats.oakFurniture, false);
  addArtFrame(0.32, 0.42, 2.12, 1.50, 2.594, Math.PI, 'botan_blue', mats.oakFurniture, false);
  addArtFrame(0.34, 0.42, 2.74, 1.46, 2.596, Math.PI, 'calendar', null, false);
  // Small oak wall spice rack under botanical print (X = 1.62, Z = 2.54)
  const kSpiceRack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.11), mats.oakFurniture);
  kSpiceRack.position.set(1.62, 1.15, 2.54);
  const kTowel = new THREE.Mesh(APP.makeRoundedBox(0.14, 0.36, 0.03, 0.01, 2), new THREE.MeshStandardMaterial({ color: 0xa66368, roughness: 0.9 }));
  kTowel.position.set(1.46, 0.92, 2.53);
  g.add(kSpiceRack, kTowel);
  // Small framed landscape on Kitchen North wall left of range hood
  addArtFrame(0.24, 0.30, 1.16, 1.72, 0.004, 0, 'kitchen_mini', mats.chrome, false);

  // ==================== 2. DINING NOOK (PHOTO 1 & 3) ====================
  // Rectangular Off-White Dining Table (1.36m x 0.80m, H=0.742 at (4.48, 0.38))
  // (Kept at H=0.742 so homework item at (4.50, 0.746, 0.52) sits crisply on top)
  const dTableX = 4.48, dTableZ = 0.38, dtW = 1.36, dtD = 0.80;
  const tblTop = new THREE.Mesh(new THREE.BoxGeometry(dtW, 0.032, dtD), mats.ceramicWhite);
  tblTop.position.set(dTableX, 0.726, dTableZ);
  tblTop.castShadow = true; tblTop.receiveShadow = true;
  const apronF = new THREE.Mesh(new THREE.BoxGeometry(dtW - 0.08, 0.065, dtD - 0.08), mats.doorWhite);
  apronF.position.set(dTableX, 0.678, dTableZ);
  g.add(tblTop, apronF);
  for (const lx of [-dtW / 2 + 0.045, dtW / 2 - 0.045]) {
    for (const lz of [-dtD / 2 + 0.045, dtD / 2 - 0.045]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.71, 0.062), mats.doorWhite);
      leg.position.set(dTableX + lx, 0.355, dTableZ + lz);
      leg.castShadow = true; leg.receiveShadow = true;
      g.add(leg);
    }
  }
  arch.addBoxCollider(dTableX, dTableZ, dtW, dtD, 0.742);

  // Dining tabletop items (paper towel roll, black tray, sauce bottles, pouch)
  const pTowel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 14), mats.ceramicWhite);
  pTowel.position.set(dTableX - 0.56, 0.855, dTableZ + 0.24);
  const dTray = new THREE.Mesh(APP.makeRoundedBox(0.24, 0.14, 0.19, 0.02, 2), mats.darkMetal);
  dTray.position.set(dTableX - 0.06, 0.81, dTableZ - 0.10);
  const soyBot = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.14, 10), mats.darkMetal);
  soyBot.position.set(dTableX + 0.16, 0.81, dTableZ + 0.10);
  const honeyBot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xc97b1e, roughness: 0.35 }));
  honeyBot.position.set(dTableX - 0.36, 0.80, dTableZ - 0.08);
  const pouch = new THREE.Mesh(APP.makeRoundedBox(0.18, 0.05, 0.09, 0.015, 2), mats.sofaOlive);
  pouch.position.set(dTableX + 0.44, 0.77, dTableZ + 0.14);
  g.add(pTowel, dTray, soyBot, honeyBot, pouch);

  // 4 White Vertical-Slatted Dining Chairs with Charcoal Seat Cushions
  function addWhiteSlattedChair(cx, cz, rotY, hasBackpack = false) {
    const cg = new THREE.Group();
    cg.position.set(cx, 0, cz);
    cg.rotation.y = rotY;
    for (const sx of [-0.18, 0.18]) {
      const frontLeg = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.45, 0.032), mats.doorWhite);
      frontLeg.position.set(sx, 0.225, 0.18);
      frontLeg.castShadow = true;
      const backPost = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.94, 0.032), mats.doorWhite);
      backPost.position.set(sx, 0.47, -0.18);
      backPost.castShadow = true;
      const sideRung = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.36), mats.doorWhite);
      sideRung.position.set(sx, 0.14, 0);
      cg.add(frontLeg, backPost, sideRung);
    }
    const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.04, 0.40), mats.doorWhite);
    seatFrame.position.set(0, 0.435, 0);
    seatFrame.castShadow = true;
    const cushion = new THREE.Mesh(APP.makeRoundedBox(0.39, 0.035, 0.38, 0.012, 2), mats.chairCharcoal);
    cushion.position.set(0, 0.468, 0.005);
    cushion.castShadow = true;
    // High slatted backrest
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.045, 0.03), mats.doorWhite);
    topRail.position.set(0, 0.92, -0.18);
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.025), mats.doorWhite);
    botRail.position.set(0, 0.50, -0.18);
    cg.add(seatFrame, cushion, topRail, botRail);
    for (let s = -2; s <= 2; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.41, 0.014), mats.doorWhite);
      slat.position.set(s * 0.062, 0.71, -0.18);
      slat.castShadow = true;
      cg.add(slat);
    }
    if (hasBackpack) {
      const pack = new THREE.Mesh(APP.makeRoundedBox(0.28, 0.32, 0.20, 0.05, 3), mats.darkMetal);
      pack.position.set(0, 0.645, 0.04);
      pack.rotation.x = -0.06;
      pack.castShadow = true;
      cg.add(pack);
    }
    g.add(cg);
  }
  addWhiteSlattedChair(dTableX - 0.76, dTableZ + 0.04, Math.PI * 0.48, false); // West head of table
  addWhiteSlattedChair(dTableX - 0.30, dTableZ - 0.52, 0.0, false);              // North window left
  addWhiteSlattedChair(dTableX + 0.34, dTableZ - 0.52, 0.0, false);              // North window right
  addWhiteSlattedChair(dTableX, dTableZ + 0.52, Math.PI, false);                 // South side of table (clear of terrace door)
  arch.addBoxCollider(dTableX, dTableZ + 0.52, 0.44, 0.40, 0.48);

  // Matte taupe dome pendant lamp centered over dining table
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.88, 6), mats.ceramicWhite);
  cord.position.set(dTableX, 1.98, dTableZ);
  const domeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.09, 14), mats.taupeLamp);
  domeCap.position.set(dTableX, 1.62, dTableZ);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({ color: 0x7a7266, roughness: 0.50, metalness: 0.12, side: THREE.DoubleSide })
  );
  dome.position.set(dTableX, 1.40, dTableZ);
  dome.castShadow = true;
  g.add(cord, domeCap, dome);

  // Dining windowsill flowers (pink vase + coral blooms + dark lantern)
  const winVase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.062, 0.15, 14), new THREE.MeshStandardMaterial({ color: 0xdfc1c4, roughness: 0.55 }));
  winVase.position.set(4.56, 0.96, -0.45);
  g.add(winVase);
  for (let i = 0; i < 6; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd86b42 : 0xe59772, roughness: 0.8 }));
    fl.position.set(4.56 + Math.cos(i * 1.05) * 0.055, 1.08 + (i % 3) * 0.025, -0.45 + Math.sin(i * 1.05) * 0.05);
    g.add(fl);
  }
  const winLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.16, 12), mats.darkMetal);
  winLantern.position.set(4.24, 0.96, -0.45);
  g.add(winLantern);

  // Tall White Open Wire-Frame Shelf next to Dining Table (Photo 1 right & Photo 3 far left)
  const wShelf = new THREE.Group();
  wShelf.position.set(5.56, 0, -0.16);
  wShelf.rotation.y = -Math.PI / 2; // +Z faces West (-X) into dining area
  const wsW = 0.68, wsD = 0.34, wsH = 1.76;
  for (const px of [-wsW / 2, 0, wsW / 2]) {
    for (const pz of [-wsD / 2, wsD / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.018, wsH, 0.018), mats.trimWhite);
      post.position.set(px, wsH / 2, pz);
      post.castShadow = true;
      wShelf.add(post);
    }
  }
  for (const sy of [0.16, 0.54, 0.92, 1.32, 1.75]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(wsW, 0.018, wsD), mats.doorWhite);
    sh.position.set(0, sy, 0);
    sh.castShadow = true; sh.receiveShadow = true;
    wShelf.add(sh);
  }
  // Leaning binders on lower shelf
  for (let i = 0; i < 6; i++) {
    const bnd = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.29, 0.24),
      i % 2 === 0 ? mats.ceramicWhite : (i === 3 ? mats.terracottaPot : mats.darkMetal));
    bnd.position.set(-0.24 + i * 0.042, 0.69, 0);
    bnd.rotation.z = -0.22;
    wShelf.add(bnd);
  }
  // Small potted trailing plant & tiny calendar blocks on mid shelf
  const wsPot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.09, 10), mats.darkMetal);
  wsPot.position.set(-0.16, 0.97, 0.02);
  const wsPlant = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 7), mats.leafDark);
  wsPlant.position.set(-0.16, 1.05, 0.02);
  // Classical figurine on shelf 4 + botanical framed print on top shelf
  const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.048, 0.24, 12), mats.sandWall);
  statue.position.set(0.20, 1.45, 0.04);
  const statHead = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), mats.sandWall);
  statHead.position.set(0.20, 1.59, 0.04);
  const topPrint = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.024), mats.oakFurniture);
  topPrint.position.set(0.08, 1.97, -0.04);
  const topArt = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.36), mats.getArtMat('floral'));
  topArt.position.set(0.08, 1.97, -0.025);
  wShelf.add(wsPot, wsPlant, statue, statHead, topPrint, topArt);
  g.add(wShelf);
  arch.addBoxCollider(5.56, -0.16, 0.38, 0.72);

  // ==================== 3. 45° BOOKCASE WALL (PHOTO 3) ====================
  // Diagonal inner wall runs from (5.80, 1.20) to (7.52, 2.92), length 2.43m, inward normal (-0.707, +0.707)
  const diagGroup = new THREE.Group();
  diagGroup.position.set(6.66, 0, 2.06);
  diagGroup.rotation.y = -Math.PI / 4; // local +Z points SW into living room

  // Two Tall Black Bookcases (each 0.78m wide x 2.02m tall x 0.32m deep) on NW half of 45° wall
  function addBlackBookcase(localX, isLeft) {
    const bg = new THREE.Group();
    bg.position.set(localX, 0, 0.17);
    const bw = 0.78, bh = 2.02, bd = 0.32;
    const mat = mats.darkMetal;
    const back = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.016), mat);
    back.position.set(0, bh / 2, -bd / 2 + 0.008);
    bg.add(back);
    for (const sx of [-bw / 2 + 0.012, bw / 2 - 0.012]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.024, bh, bd), mat);
      side.position.set(sx, bh / 2, 0);
      side.castShadow = true; side.receiveShadow = true;
      bg.add(side);
    }
    const shelfYs = [0.08, 0.44, 0.80, 1.16, 1.56, 2.01];
    for (const sy of shelfYs) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.02, 0.024, bd), mat);
      sh.position.set(0, sy, 0);
      sh.castShadow = true; sh.receiveShadow = true;
      bg.add(sh);
    }
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.02, 0.08, bd - 0.02), mat);
    plinth.position.set(0, 0.04, 0);
    bg.add(plinth);

    // Colorful book rows & decor
    const bookColors = [mats.terracottaPot, mats.ceramicWhite, mats.sofaOlive, mats.chairCharcoal, mats.leatherCognac, mats.sandWall];
    for (let si = 1; si <= 4; si++) {
      const sy = shelfYs[si];
      if (isLeft && si === 2) {
        // Blue mini screen/display on shelf 2 left bookcase (Photo 3!)
        const scr = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.14, 0.02), new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.75 }));
        scr.position.set(-0.22, sy + 0.10, 0.04);
        bg.add(scr);
      }
      const startI = (isLeft && si === 2) ? 6 : 0;
      const count = isLeft ? 13 : 11;
      for (let k = startI; k < count; k++) {
        const bhItem = 0.20 + ((k * 3 + si) % 5) * 0.024;
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.036, bhItem, 0.21), bookColors[(k + si) % bookColors.length]);
        bk.position.set(-0.31 + k * 0.048, sy + 0.012 + bhItem / 2, -0.02);
        bk.castShadow = true;
        bg.add(bk);
      }
    }
    // Bottom shelf boardgames stack
    for (let gIdx = 0; gIdx < 3; gIdx++) {
      const boxG = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.24), gIdx === 1 ? mats.terracottaPot : mats.ceramicWhite);
      boxG.position.set(-0.14 + gIdx * 0.03, 0.12 + gIdx * 0.062, 0.01);
      bg.add(boxG);
    }

    if (isLeft) {
      // 2 brown kraft storage boxes on top (Photo 3!)
      const kraft = new THREE.MeshStandardMaterial({ color: 0xc29e70, roughness: 0.85 });
      for (const bx of [-0.19, 0.19]) {
        const kBox = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.20, 0.26), kraft);
        kBox.position.set(bx, 2.12, 0);
        kBox.castShadow = true;
        bg.add(kBox);
      }
    } else {
      // Black storage box + terracotta/bronze Buddha statue on top right (Photo 3!)
      const bBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.26), mats.darkMetal);
      bBox.position.set(-0.18, 2.09, 0);
      const buddhaBody = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 12), mats.terracottaPot);
      buddhaBody.position.set(0.20, 2.13, 0);
      const buddhaHead = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), mats.terracottaPot);
      buddhaHead.position.set(0.20, 2.27, 0);
      bg.add(bBox, buddhaBody, buddhaHead);
    }
    diagGroup.add(bg);
  }
  addBlackBookcase(-0.74, true);
  addBlackBookcase(0.08, false);
  arch.addBoxCollider(6.14, 1.54, 0.62, 0.62);
  arch.addBoxCollider(6.68, 2.08, 0.62, 0.62);

  // Two stacked vertical framed portraits to the right of the bookcases (Photo 3!)
  function addDiagArt(lx, ly, w, h, artKey) {
    const fg = new THREE.Group();
    fg.position.set(lx, ly, 0.015);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.022), mats.doorWhite);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats.getArtMat(artKey));
    art.position.z = 0.013;
    fg.add(frame, art);
    diagGroup.add(fg);
  }
  addDiagArt(0.68, 1.58, 0.30, 0.36, 'kid_girl');
  addDiagArt(0.68, 1.12, 0.30, 0.36, 'kid_boy');

  g.add(diagGroup);

  // Hanging macrame/cord planter in NE living room corner (Photo 2 & Photo 3)
  addPlant('hanging', 7.72, 1.76, 3.04, 1.0);

  // Soft Oval Dog Bed tucked behind left side of sofa near bookcase (Photo 3)
  const dogBed = new THREE.Group();
  dogBed.position.set(5.48, 0, 2.34);
  const bedRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 12, 24), mats.sandWall);
  bedRim.rotation.x = Math.PI / 2;
  bedRim.scale.set(1.22, 0.88, 0.9);
  bedRim.position.y = 0.09;
  bedRim.castShadow = true; bedRim.receiveShadow = true;
  const bedPad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 20), mats.rugTaupe);
  bedPad.scale.set(1.18, 1, 0.85);
  bedPad.position.y = 0.04;
  dogBed.add(bedRim, bedPad);
  g.add(dogBed);

  // ==================== 4. LIVING ROOM: CHARCOAL L-SOFA, OAK SLATTED TABLE, ARMCHAIR & TV WALL ====================
  // Dark Charcoal L-Shaped Sectional Sofa (facing South toward TV wall Z=6.58)
  function addSofaPart(cx, cy, cz, w, h, d, r = 0.04, mat = mats.chairCharcoal) {
    const m = new THREE.Mesh(APP.makeRoundedBox(w, h, d, r, 3), mat);
    m.position.set(cx, cy, cz);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  }
  // Main run facing South (+Z): X = 5.10 .. 7.80, Z = 3.18 .. 4.08
  addSofaPart(6.45, 0.19, 3.63, 2.70, 0.32, 0.90, 0.04);
  for (let i = 0; i < 3; i++) {
    addSofaPart(5.58 + i * 0.87, 0.38, 3.68, 0.85, 0.13, 0.78, 0.04);
  }
  // North backrest & West armrest
  addSofaPart(6.45, 0.56, 3.28, 2.70, 0.44, 0.22, 0.04);
  addSofaPart(5.20, 0.44, 3.63, 0.20, 0.38, 0.90, 0.04);

  // East window wing extending South: X = 7.00 .. 7.84, Z = 4.08 .. 4.92
  addSofaPart(7.42, 0.19, 4.50, 0.84, 0.32, 0.86, 0.04);
  addSofaPart(7.37, 0.38, 4.49, 0.72, 0.13, 0.82, 0.04);
  addSofaPart(7.75, 0.56, 4.50, 0.22, 0.44, 0.86, 0.04);
  addSofaPart(7.42, 0.44, 4.86, 0.84, 0.38, 0.20, 0.04);

  // Neat, flush backrest cushions & natural leaned corner pillows
  for (const [px, pz, ry] of [
    [5.69, 3.45, 0],
    [6.45, 3.45, 0],
    [7.21, 3.45, 0],
    [7.57, 4.18, -Math.PI / 2]
  ]) {
    const bpW = ry === 0 ? 0.74 : 1.08;
    const bp = new THREE.Mesh(APP.makeRoundedBox(bpW, 0.31, 0.14, 0.04, 2), mats.chairCharcoal);
    bp.rotation.order = 'YXZ';
    bp.position.set(px, 0.59, pz);
    bp.rotation.y = ry;
    bp.rotation.x = -0.08;
    bp.castShadow = true;
    g.add(bp);
  }
  const leftPillow = new THREE.Mesh(APP.makeRoundedBox(0.38, 0.27, 0.10, 0.035, 2), mats.sofaGrey);
  leftPillow.rotation.order = 'YXZ';
  leftPillow.position.set(5.54, 0.565, 3.60);
  leftPillow.rotation.y = 0.22;
  leftPillow.rotation.x = -0.22;
  leftPillow.castShadow = true;
  const rightPillow = new THREE.Mesh(APP.makeRoundedBox(0.38, 0.27, 0.10, 0.035, 2), mats.sofaGrey);
  rightPillow.rotation.order = 'YXZ';
  rightPillow.position.set(7.32, 0.565, 3.64);
  rightPillow.rotation.y = -0.45;
  rightPillow.rotation.x = -0.22;
  rightPillow.castShadow = true;
  g.add(leftPillow, rightPillow);
  arch.addBoxCollider(6.45, 3.63, 2.74, 0.94);
  arch.addBoxCollider(7.42, 4.50, 0.88, 0.88);

  // Slatted Light Oak Oval-End Coffee Table (6.18, 4.74) — extra walkway room from sofa
  const ctGroup = new THREE.Group();
  ctGroup.position.set(6.18, 0, 4.74);
  const ctTop = new THREE.Mesh(APP.makeRoundedBox(1.04, 0.026, 0.54, 0.14, 4), mats.oakFurniture);
  ctTop.position.y = 0.405; ctTop.castShadow = true; ctTop.receiveShadow = true;
  const ctBot = new THREE.Mesh(APP.makeRoundedBox(1.00, 0.024, 0.50, 0.13, 4), mats.oakFurniture);
  ctBot.position.y = 0.215; ctBot.castShadow = true; ctBot.receiveShadow = true;
  ctGroup.add(ctTop, ctBot);
  // Vertical oak slats around rounded skirt
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const sx = Math.cos(a) * 0.48;
    const sz = Math.sin(a) * 0.23;
    // Leave open cubby front opening facing sofa/living
    if (sz > 0.17 && Math.abs(sx) < 0.22) continue;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.18, 0.018), mats.oakFurniture);
    slat.position.set(sx, 0.31, sz);
    slat.castShadow = true;
    ctGroup.add(slat);
  }
  // 4 thin black metal legs
  for (const [lx, lz] of [[-0.38, -0.17], [0.38, -0.17], [-0.38, 0.17], [0.38, 0.17]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.010, 0.21, 8), mats.darkMetal);
    leg.position.set(lx, 0.105, lz);
    leg.castShadow = true;
    ctGroup.add(leg);
  }
  // Coffee table props: Pringles red tube & PlayStation DualSense controller (white & black)
  const pringles = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.22, 14), new THREE.MeshStandardMaterial({ color: 0xb82820, roughness: 0.4 }));
  pringles.rotation.z = Math.PI / 2;
  pringles.rotation.y = 0.55;
  pringles.position.set(0.04, 0.455, 0.02);

  const psCtrl = new THREE.Group();
  psCtrl.position.set(-0.22, 0.422, -0.02);
  psCtrl.rotation.y = 0.15;
  const psBody = new THREE.Mesh(APP.makeRoundedBox(0.145, 0.024, 0.072, 0.01, 2), mats.ceramicWhite);
  psBody.position.y = 0.016; psBody.castShadow = true;
  const psTrim = new THREE.Mesh(APP.makeRoundedBox(0.088, 0.026, 0.056, 0.008, 2), mats.darkMetal);
  psTrim.position.set(0, 0.016, 0.012);
  const psTouch = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.006, 0.034), mats.ceramicWhite);
  psTouch.position.set(0, 0.030, -0.014);
  for (const gx of [-0.060, 0.060]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.013, 0.078, 10), mats.ceramicWhite);
    grip.rotation.x = Math.PI / 2;
    grip.rotation.z = gx < 0 ? 0.26 : -0.26;
    grip.position.set(gx, 0.014, 0.036);
    grip.castShadow = true;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.008, 0.014, 10), mats.darkMetal);
    stick.position.set(gx * 0.44, 0.034, 0.018);
    psCtrl.add(grip, stick);
  }
  const dpad = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.005, 0.007), mats.darkMetal);
  dpad.position.set(-0.044, 0.030, -0.008);
  const dpadV = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.005, 0.022), mats.darkMetal);
  dpadV.position.set(-0.044, 0.030, -0.008);
  psCtrl.add(psBody, psTrim, psTouch, dpad, dpadV);
  // Colored PlayStation face buttons (Δ O X □)
  for (const [bx, bz, col] of [[0, -0.012, 0x34d399], [0.012, 0, 0xf87171], [0, 0.012, 0x60a5fa], [-0.012, 0, 0xf472b6]]) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.005, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }));
    btn.position.set(0.044 + bx, 0.030, -0.008 + bz);
    psCtrl.add(btn);
  }
  ctGroup.add(pringles, psCtrl);
  g.add(ctGroup);
  arch.addBoxCollider(6.18, 4.74, 1.06, 0.56, 0.418);

  // Dark Charcoal Plush Lounge Armchair (7.42, 5.44) facing West (-X), away from the East window blinds
  const armG = new THREE.Group();
  armG.position.set(7.42, 0, 5.44);
  armG.rotation.y = -Math.PI / 2;
  const aBase = new THREE.Mesh(APP.makeRoundedBox(0.84, 0.22, 0.80, 0.04, 2), mats.chairCharcoal);
  aBase.position.set(0, 0.26, 0); aBase.castShadow = true; aBase.receiveShadow = true;
  const aSeat = new THREE.Mesh(APP.makeRoundedBox(0.76, 0.14, 0.70, 0.045, 3), mats.chairCharcoal);
  aSeat.position.set(0, 0.42, 0.03); aSeat.castShadow = true;
  const aBack = new THREE.Mesh(APP.makeRoundedBox(0.82, 0.46, 0.18, 0.05, 3), mats.chairCharcoal);
  aBack.position.set(0, 0.60, -0.28); aBack.rotation.x = -0.14; aBack.castShadow = true;
  armG.add(aBase, aSeat, aBack);
  for (const sx of [-0.36, 0.36]) {
    const aArm = new THREE.Mesh(APP.makeRoundedBox(0.14, 0.24, 0.72, 0.035, 2), mats.chairCharcoal);
    aArm.position.set(sx, 0.44, 0); aArm.castShadow = true;
    armG.add(aArm);
  }
  for (const [lx, lz] of [[-0.32, -0.28], [0.32, -0.28], [-0.32, 0.28], [0.32, 0.28]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.011, 0.16, 8), mats.darkMetal);
    leg.position.set(lx, 0.08, lz);
    armG.add(leg);
  }
  g.add(armG);
  arch.addBoxCollider(7.42, 5.44, 0.84, 0.84);

  // Small Black 2-Tier Electronics Stand & Straight Open Laptop next to Armchair (7.54, 6.26)
  const lapStand = new THREE.Group();
  lapStand.position.set(7.54, 0, 6.26);
  for (const [lx, lz] of [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.50, 0.024), mats.darkMetal);
    leg.position.set(lx, 0.25, lz);
    lapStand.add(leg);
  }
  for (const sy of [0.16, 0.33, 0.49]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.018, 0.40), mats.darkMetal);
    sh.position.set(0, sy, 0); sh.castShadow = true;
    lapStand.add(sh);
  }
  // Open Laptop aligned straight facing North (-Z) with glowing blue screen
  const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.014, 0.22), mats.steel);
  lapBase.position.set(0, 0.507, -0.04);
  const lapLid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.21, 0.010), mats.darkMetal);
  lapLid.rotation.order = 'YXZ';
  lapLid.position.set(0, 0.60, 0.075);
  lapLid.rotation.y = Math.PI;
  lapLid.rotation.x = -0.20;
  const lapScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.295, 0.185),
    new THREE.MeshStandardMaterial({ color: 0x2a88ff, emissive: 0x1672ff, emissiveIntensity: 0.9, roughness: 0.25 })
  );
  lapScreen.rotation.order = 'YXZ';
  lapScreen.position.set(0, 0.60, 0.068);
  lapScreen.rotation.y = Math.PI;
  lapScreen.rotation.x = -0.20;
  lapStand.add(lapBase, lapLid, lapScreen);
  g.add(lapStand);
  arch.addBoxCollider(7.54, 6.26, 0.52, 0.44);

  // ==================== 5. TV WALL (Z = 6.58 KALKMMALING WALL, PHOTO 2 & 3) ====================
  const tvGroup = new THREE.Group();
  tvGroup.position.set(6.22, 0, 6.51);
  tvGroup.rotation.y = Math.PI; // local +Z faces North (-Z) into Living Room!

  // Light Oak Slatted Media Console (1.28m W x 0.40m D x 0.45m H)
  const tvConsole = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.34, 0.40), mats.oakFurniture);
  tvConsole.position.set(0, 0.28, 0.22);
  tvConsole.castShadow = true; tvConsole.receiveShadow = true;
  tvGroup.add(tvConsole);
  // Vertical oak slats across console front doors
  for (let x = -0.60; x <= 0.60; x += 0.045) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.31, 0.012), mats.teak);
    slat.position.set(x, 0.28, 0.422);
    tvGroup.add(slat);
  }
  for (const [lx, lz] of [[-0.56, 0.06], [0.56, 0.06], [-0.56, 0.38], [0.56, 0.38]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.11, 8), mats.oakFurniture);
    leg.position.set(lx, 0.055, lz);
    tvGroup.add(leg);
  }
  // Black Soundbar & white mini router/boxes on TV bench
  const soundbar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.065, 0.095), mats.darkMetal);
  soundbar.position.set(0.04, 0.482, 0.29);
  soundbar.castShadow = true;
  const psBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), mats.ceramicWhite);
  psBox.position.set(-0.54, 0.49, 0.22);
  tvGroup.add(soundbar, psBox);

  // Huge 85-98" Wall-mounted Flat OLED TV (clearly larger than console, matching Photo 2)
  const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(2.12, 1.22, 0.028), mats.darkMetal);
  tvFrame.position.set(0, 1.15, 0.055);
  tvFrame.castShadow = true;
  const tvPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 1.18), mats.tvScreen);
  tvPanel.position.set(0, 1.15, 0.071);
  tvGroup.add(tvFrame, tvPanel);

  // Small black center speaker high above TV
  const hiSpk = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.07), mats.darkMetal);
  hiSpk.position.set(0.08, 1.93, 0.04);
  tvGroup.add(hiSpk);

  // Round White Wall Clock upper-right of TV (closer to Entre!)
  const clkRim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.028, 24), mats.darkMetal);
  clkRim.rotation.x = Math.PI / 2;
  clkRim.position.set(1.22, 1.88, 0.015);
  const clkFace = new THREE.Mesh(new THREE.CircleGeometry(0.145, 24), mats.ceramicWhite);
  clkFace.position.set(1.22, 1.88, 0.031);
  const clkHand1 = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.10, 0.004), mats.darkMetal);
  clkHand1.position.set(1.22, 1.92, 0.034); clkHand1.rotation.z = 0.55;
  const clkHand2 = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.009, 0.004), mats.darkMetal);
  clkHand2.position.set(1.25, 1.87, 0.034); clkHand2.rotation.z = -0.35;
  tvGroup.add(clkRim, clkFace, clkHand1, clkHand2);

  // Small framed portrait upper-left of TV
  const tvArtFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.02), mats.ceramicWhite);
  tvArtFrame.position.set(-1.24, 1.72, 0.015);
  const tvArt = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.28), mats.getArtMat('master_bw'));
  tvArt.position.set(-1.24, 1.72, 0.027);
  tvGroup.add(tvArtFrame, tvArt);

  g.add(tvGroup);
  arch.addBoxCollider(6.22, 6.29, 1.32, 0.44);

  // Roborock Robot Vacuum Dock & Vacuum right beside Entre doorway (5.04, 6.28) (Photo 2!)
  const rrGroup = new THREE.Group();
  rrGroup.position.set(5.04, 0, 6.28);
  const rrTower = new THREE.Mesh(APP.makeRoundedBox(0.32, 0.44, 0.32, 0.025, 2), mats.sandWall);
  rrTower.position.set(0, 0.22, 0.06); rrTower.castShadow = true;
  const rrBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.24), mats.darkMetal);
  rrBase.position.set(0, 0.012, -0.18);
  const rrBot = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.082, 20), mats.ceramicWhite);
  rrBot.position.set(0, 0.055, -0.16); rrBot.castShadow = true;
  const rrLidar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.022, 12), mats.steel);
  rrLidar.position.set(0, 0.105, -0.16);
  rrGroup.add(rrTower, rrBase, rrBot, rrLidar);
  g.add(rrGroup);
  arch.addBoxCollider(5.04, 6.28, 0.38, 0.42);

  // Living Room White Track Light Bar with 4 Adjustable Spotlights on Ceiling (Photo 2 & 3)
  const trkGroup = new THREE.Group();
  trkGroup.position.set(6.15, H - 0.025, 4.65);
  trkGroup.rotation.y = -0.45;
  const trkRail = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.024, 0.042), mats.trimWhite);
  trkGroup.add(trkRail);
  for (let i = 0; i < 4; i++) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.11, 12), mats.trimWhite);
    can.position.set(-0.42 + i * 0.28, -0.065, 0);
    can.rotation.x = i % 2 ? 0.38 : -0.32;
    can.rotation.z = (i - 1.5) * 0.18;
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.026, 10), new THREE.MeshBasicMaterial({ color: 0xfff6d8 }));
    bulb.rotation.x = Math.PI / 2;
    bulb.position.y = -0.056;
    can.add(bulb);
    trkGroup.add(can);
  }
  g.add(trkGroup);

  // ==================== LIVING ROOM & HALLWAY ARTWORK (PHOTO 4) ====================
  // 1. Coastal ocean/rocks painting on X = 3.22 between Soverom 1 door & shaft
  addArtFrame(0.76, 0.54, 3.225, 1.62, 4.54, Math.PI / 2, 'coastal', mats.chrome, false);
  // 2. Four artworks on East face of Ventilation Shaft (X = 3.645, facing +X)
  // Round embroidery hoop upper-left
  const hoopG = new THREE.Group();
  hoopG.position.set(3.645, 1.92, 3.74);
  hoopG.rotation.y = Math.PI / 2;
  const hoopRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.010, 8, 24), mats.oakFurniture);
  const hoopDisc = new THREE.Mesh(new THREE.CircleGeometry(0.092, 24), mats.getArtMat('hoop'));
  hoopDisc.position.z = 0.005;
  hoopG.add(hoopRing, hoopDisc);
  g.add(hoopG);
  addArtFrame(0.22, 0.30, 3.642, 1.82, 3.47, Math.PI / 2, 'diploma', mats.oakFurniture, false);
  addArtFrame(0.22, 0.30, 3.642, 1.52, 3.74, Math.PI / 2, 'sketch', mats.oakFurniture, false);
  addArtFrame(0.28, 0.21, 3.642, 1.44, 3.47, Math.PI / 2, 'mountain', mats.oakFurniture, false);
  // 3. Tall botanical branch drawing on X = 3.22 wall north of shaft
  addArtFrame(0.42, 0.56, 3.225, 1.58, 2.98, Math.PI / 2, 'botanical_tall', mats.oakFurniture, false);
  // 4. Poster on Hallway/Living transition wall (X = 3.22, Z = 6.55)
  addArtFrame(0.46, 0.78, 3.23, 1.56, 6.55, Math.PI / 2, 'louisiana_gill', mats.oakFurniture, false);

  const S = APP.XZ || 1;
  g.scale.set(S, 1, S);
  scene.add(g);
  return g;
};
