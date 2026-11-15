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
    } else {
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
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.13, 14), mats.ceramicWhite);
      pot.position.y = 0; pot.castShadow = true;
      pg.add(pot);
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
  // Tall integrated fridge/freezer (X=0..0.60, Z=1.96..2.60)
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.60, 2.38, 0.62), mats.kitchenGloss);
  fridge.position.set(0.30, 1.19, 2.29);
  fridge.castShadow = true; fridge.receiveShadow = true;
  g.add(fridge);
  arch.addBoxCollider(0.30, 2.29, 0.62, 0.64);
  // Fridge door seam & bottom/top grilles
  const fSeam = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.008, 0.61), mats.darkMetal);
  fSeam.position.set(0.602, 0.90, 2.29);
  const fVentBot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.56), mats.steel);
  fVentBot.position.set(0.602, 0.06, 2.29);
  const fVentTop = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, 0.56), mats.steel);
  fVentTop.position.set(0.602, 2.34, 2.29);
  g.add(fSeam, fVentBot, fVentTop);

  // West wall lower cabinets (X=0..0.60, Z=0.00..1.98)
  const kLowWest = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.87, 1.98), mats.kitchenGloss);
  kLowWest.position.set(0.30, 0.435, 0.99);
  kLowWest.castShadow = true; kLowWest.receiveShadow = true;
  const kTopWest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.032, 2.00), mats.counterTop);
  kTopWest.position.set(0.31, 0.886, 1.00);
  kTopWest.receiveShadow = true;
  g.add(kLowWest, kTopWest);
  arch.addBoxCollider(0.31, 1.00, 0.64, 2.00);

  // Kickplate along West & North cabinets
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

  // Cabinet door/drawer groove lines on glossy white fronts
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
  // Horizontal drawer seams on right-hand base drawers (X=1.90..3.16)
  for (const yLine of [0.36, 0.62]) {
    const hSeam = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.005, 0.005), mats.steel);
    hSeam.position.set(2.53, yLine, 0.602);
    g.add(hSeam);
  }

  // Upper cabinets along West wall (X=0..0.34, Z=0.64..1.98, Y=1.48..2.40)
  const kUpWest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.90, 1.34), mats.kitchenGloss);
  kUpWest.position.set(0.17, 1.93, 1.31);
  kUpWest.castShadow = true; kUpWest.receiveShadow = true;
  g.add(kUpWest);

  // Integrated black Microwave inside upper cabinet (Z=1.42..1.96, Y=1.48..1.86)
  const micro = new THREE.Mesh(new THREE.BoxGeometry(0.355, 0.36, 0.54), mats.darkMetal);
  micro.position.set(0.18, 1.67, 1.69);
  const microGlass = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.25, 0.40), mats.tvScreen);
  microGlass.position.set(0.36, 1.68, 1.71);
  g.add(micro, microGlass);

  // Glass backsplash behind West counter
  const splash = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.55, 1.34), mats.glass);
  splash.position.set(0.008, 1.18, 1.31);
  g.add(splash);

  // Black kitchen sink & gooseneck tap (X=0.30, Z=1.08)
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

  // Cylindrical Brushed Stainless Range Hood (X=1.59, Z=0.30, Y=1.58..2.42)
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.84, 24), mats.steel);
  hood.position.set(1.59, 2.00, 0.30);
  hood.castShadow = true;
  g.add(hood);

  // Kitchen Countertop Details (p18_img0, p18_img2, p19_img0)
  // Stand mixer near fridge (X=0.34, Z=1.72)
  const mixerBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.18), mats.steel);
  mixerBody.position.set(0.34, 1.03, 1.72);
  const mixerBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.13, 14), mats.chrome);
  mixerBowl.position.set(0.41, 0.97, 1.72);
  g.add(mixerBody, mixerBowl);
  // Utensil crock, mortar & pestle, cutting board near stove
  const crock = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.052, 0.15, 12), mats.darkMetal);
  crock.position.set(1.18, 0.98, 0.22);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.20), mats.oakFurniture);
  board.position.set(1.06, 1.04, 0.10);
  board.rotation.y = 0.25;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.05, 0.07, 14), mats.ceramicWhite);
  bowl.position.set(0.84, 0.94, 0.28);
  g.add(crock, board, bowl);
  // Open cookbook, herb pots & two taper candles under kitchen window (X=2.1..3.0, Z=0.35)
  const cookbook = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.24), mats.ceramicWhite);
  cookbook.position.set(2.38, 0.915, 0.42);
  cookbook.rotation.y = 0.18;
  g.add(cookbook);
  addPlant('smallHerb', 2.75, 0.90, 0.20, 0.95);
  addPlant('smallHerb', 2.94, 0.90, 0.22, 0.9);
  for (const cx of [2.98, 3.06]) {
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.06, 10), mats.terracottaPot);
    holder.position.set(cx, 0.93, 0.36);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.18, 8), mats.ceramicWhite);
    candle.position.set(cx, 1.05, 0.36);
    g.add(holder, candle);
  }

  // Kitchen 3 oak wall shelves on Z=2.60 wall (p18_img1)
  for (const [sx, sy] of [[1.05, 1.38], [1.45, 1.58], [1.05, 1.78]]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.024, 0.13), mats.oakFurniture);
    shelf.position.set(sx, sy, 2.53);
    shelf.castShadow = true;
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.11, 10), mats.terracottaPot);
    jar.position.set(sx - 0.08, sy + 0.065, 2.53);
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.10), mats.sofaOlive);
    book.position.set(sx + 0.08, sy + 0.085, 2.53);
    g.add(shelf, jar, book);
  }

  // Kitchen runner rug
  const kRug = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.008, 1.45), mats.rugTaupe);
  kRug.position.set(1.38, 0.004, 1.55);
  kRug.receiveShadow = true;
  g.add(kRug);

  // ==================== 2. DINING NOOK ====================
  // Rug under dining table
  const dRug = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.009, 1.48), mats.rugLightGrey);
  dRug.position.set(4.56, 0.0045, 0.44);
  dRug.receiveShadow = true;
  g.add(dRug);

  // Round white pedestal table (R=0.56, H=0.74 at (4.58, 0.44))
  const dTableX = 4.58, dTableZ = 0.44;
  const tblTop = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.028, 36), mats.kitchenGloss);
  tblTop.position.set(dTableX, 0.73, dTableZ);
  tblTop.castShadow = true; tblTop.receiveShadow = true;
  const tblStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.70, 18), mats.kitchenGloss);
  tblStem.position.set(dTableX, 0.36, dTableZ);
  tblStem.castShadow = true;
  const tblBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.022, 28), mats.kitchenGloss);
  tblBase.position.set(dTableX, 0.015, dTableZ);
  g.add(tblTop, tblStem, tblBase);
  arch.addBoxCollider(dTableX, dTableZ, 1.02, 1.02);

  // Tableware: blue glass vase + wildflowers, sculptural white candle holder, bowl, open magazine
  const glassVase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.048, 0.17, 14),
    new THREE.MeshPhysicalMaterial({ color: 0xaad4e6, transparent: true, opacity: 0.65, roughness: 0.12 })
  );
  glassVase.position.set(dTableX - 0.18, 0.83, dTableZ - 0.08);
  g.add(glassVase);
  for (let i = 0; i < 8; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), i % 2 ? mats.ceramicWhite : new THREE.MeshStandardMaterial({ color: 0xf4c2c2 }));
    fl.position.set(dTableX - 0.18 + Math.cos(i) * 0.05, 0.96 + (i % 3) * 0.03, dTableZ - 0.08 + Math.sin(i) * 0.05);
    g.add(fl);
  }
  const cHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.12, 14), mats.ceramicWhite);
  cHolder.position.set(dTableX + 0.16, 0.80, dTableZ + 0.04);
  const dCandle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), mats.ceramicWhite);
  dCandle.position.set(dTableX + 0.16, 0.94, dTableZ + 0.04);
  const dBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.055, 0.065, 16), mats.ceramicWhite);
  dBowl.position.set(dTableX + 0.02, 0.775, dTableZ - 0.12);
  g.add(cHolder, dCandle, dBowl);

  // 4 Black Leather Chrome Cantilever Chairs around dining table
  function addCantileverChair(cx, cz, rotY, hasBlanket) {
    const cg = new THREE.Group();
    cg.position.set(cx, 0, cz);
    cg.rotation.y = rotY;
    // Chrome sled runners & upright legs
    for (const sx of [-0.21, 0.21]) {
      const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.46, 8), mats.chrome);
      bot.rotation.x = Math.PI / 2;
      bot.position.set(sx, 0.012, 0);
      const frontLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.44, 8), mats.chrome);
      frontLeg.position.set(sx, 0.23, 0.21);
      const seatBar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.42, 8), mats.chrome);
      seatBar.rotation.x = Math.PI / 2;
      seatBar.position.set(sx, 0.44, 0.0);
      const backPost = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.36, 8), mats.chrome);
      backPost.position.set(sx, 0.62, -0.21);
      cg.add(bot, frontLeg, seatBar, backPost);
    }
    const seat = new THREE.Mesh(APP.makeRoundedBox(0.45, 0.065, 0.44, 0.02, 2), mats.leatherBlack);
    seat.position.set(0, 0.465, 0.01);
    seat.castShadow = true; seat.receiveShadow = true;
    const back = new THREE.Mesh(APP.makeRoundedBox(0.45, 0.34, 0.06, 0.02, 2), mats.leatherBlack);
    back.position.set(0, 0.72, -0.21);
    back.rotation.x = -0.10;
    back.castShadow = true;
    cg.add(seat, back);

    if (hasBlanket) {
      const throwB = new THREE.Mesh(APP.makeRoundedBox(0.34, 0.26, 0.085, 0.015, 2), mats.sandWall);
      throwB.position.set(0.02, 0.77, -0.21);
      throwB.rotation.x = -0.10;
      cg.add(throwB);
    }
    g.add(cg);
  }
  addCantileverChair(dTableX - 0.56, dTableZ + 0.16, Math.PI * 0.42, true);
  addCantileverChair(dTableX + 0.12, dTableZ + 0.56, Math.PI * 0.96, false);
  addCantileverChair(dTableX + 0.56, dTableZ - 0.12, -Math.PI * 0.55, false);
  addCantileverChair(dTableX - 0.16, dTableZ - 0.54, -0.12, false);

  // Matte taupe dome pendant lamp over dining table
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.88, 6), mats.ceramicWhite);
  cord.position.set(dTableX, 1.98, dTableZ);
  const domeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.09, 14), mats.taupeLamp);
  domeCap.position.set(dTableX, 1.62, dTableZ);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({ color: 0x9c9283, roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide })
  );
  dome.position.set(dTableX, 1.40, dTableZ);
  dome.castShadow = true;
  g.add(cord, domeCap, dome);

  // 3 terracotta herb pots on dining windowsill (Z = -0.45)
  for (const px of [4.25, 4.55, 4.85]) {
    addPlant('smallHerb', px, 0.90, -0.46, 1.0);
  }

  // ==================== 3. TV WALL (45° DIAGONAL) ====================
  // Wall inner face runs from (5.80, 1.20) to (7.52, 2.92), midpoint (6.66, 2.06), inward normal (-0.707, 0.707)
  const tvGroup = new THREE.Group();
  tvGroup.position.set(6.66, 0, 2.06);
  tvGroup.rotation.y = -Math.PI / 4; // local +Z points inward toward living room (-0.707, 0.707)

  // Glossy off-white low media console (1.56m wide, 0.40m deep, 0.42m tall)
  const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.34, 0.40), mats.kitchenGloss);
  consoleBox.position.set(0, 0.25, 0.21);
  consoleBox.castShadow = true; consoleBox.receiveShadow = true;
  for (const lx of [-0.68, 0.68]) {
    for (const lz of [0.06, 0.36]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.08, 8), mats.trimWhite);
      leg.position.set(lx, 0.04, lz);
      tvGroup.add(leg);
    }
  }
  const amp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.10, 0.28), mats.darkMetal);
  amp.position.set(0, 0.22, 0.24);
  const tvLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.16, 12), mats.ceramicWhite);
  tvLamp.position.set(-0.46, 0.50, 0.22);
  const tvVase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.18, 12), mats.ceramicWhite);
  tvVase.position.set(-0.58, 0.51, 0.20);
  tvGroup.add(consoleBox, amp, tvLamp, tvVase);

  // 65" Wall-mounted flat screen TV
  const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.82, 0.032), mats.darkMetal);
  tvFrame.position.set(0, 1.36, 0.045);
  tvFrame.castShadow = true;
  const tvPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.41, 0.79), mats.tvScreen);
  tvPanel.position.set(0, 1.36, 0.063);
  tvGroup.add(tvFrame, tvPanel);
  g.add(tvGroup);
  arch.addBoxCollider(6.50, 2.22, 1.15, 1.15);

  // Potted fiddle/dracaena plant in white pot left of TV console + plant on right of console
  addPlant('fiddle', 5.88, 0, 1.48, 0.92);
  addPlant('smallHerb', 7.12, 0.42, 2.66, 1.05);
  // Hanging white planter near right living room window corner (p15_img0)
  addPlant('hanging', 7.86, 1.85, 3.05, 1.0);

  // ==================== 4. LIVING ROOM LOUNGE & SOFA ====================
  // Large taupe textured area rug
  const livRug = new THREE.Mesh(new THREE.BoxGeometry(2.70, 0.012, 2.15), mats.rugTaupe);
  livRug.position.set(6.48, 0.006, 5.05);
  livRug.receiveShadow = true;
  g.add(livRug);

  // Olive-green L-shaped sectional sofa (tucked along X=8.03 and Z=6.52)
  function addSofaPart(cx, cy, cz, w, h, d, r = 0.04) {
    const m = new THREE.Mesh(APP.makeRoundedBox(w, h, d, r, 3), mats.sofaOlive);
    m.position.set(cx, cy, cz);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  }
  // Base frame along South wall (Z = 5.56..6.50, X = 5.20..8.00)
  addSofaPart(6.60, 0.19, 6.03, 2.80, 0.34, 0.94, 0.04);
  // Seat cushions along South
  for (let i = 0; i < 3; i++) {
    addSofaPart(5.68 + i * 0.90, 0.39, 5.96, 0.87, 0.14, 0.80, 0.04);
  }
  // South backrest & left armrest
  addSofaPart(6.60, 0.58, 6.38, 2.80, 0.48, 0.22, 0.04);
  addSofaPart(5.30, 0.48, 6.03, 0.20, 0.42, 0.92, 0.04);

  // East/Window L-extension (X = 7.06..8.00, Z = 3.85..5.60)
  addSofaPart(7.53, 0.19, 4.72, 0.94, 0.34, 1.75, 0.04);
  addSofaPart(7.46, 0.39, 4.30, 0.80, 0.14, 0.85, 0.04);
  addSofaPart(7.46, 0.39, 5.15, 0.80, 0.14, 0.82, 0.04);
  // East backrest & north armrest
  addSofaPart(7.89, 0.58, 4.72, 0.22, 0.48, 1.75, 0.04);
  addSofaPart(7.53, 0.48, 3.95, 0.92, 0.42, 0.20, 0.04);

  // Backrest pillows
  for (const [px, pz, ry] of [[5.68, 6.20, 0], [6.58, 6.20, 0], [7.46, 6.18, -0.3], [7.68, 5.15, -Math.PI / 2], [7.68, 4.30, -Math.PI / 2]]) {
    const bp = new THREE.Mesh(APP.makeRoundedBox(0.76, 0.38, 0.16, 0.045, 2), mats.sofaOlive);
    bp.position.set(px, 0.63, pz);
    bp.rotation.y = ry;
    bp.rotation.x = -0.14;
    bp.castShadow = true;
    g.add(bp);
  }
  // Coral, cream & sage throw pillows
  const coralMat = new THREE.MeshStandardMaterial({ color: 0xc97b63, roughness: 0.9 });
  for (const [px, pz, ry, pmat] of [
    [7.55, 4.22, 0.5, coralMat],
    [7.52, 4.48, 0.8, mats.rugCream],
    [7.52, 5.75, 0.7, coralMat],
    [6.15, 6.08, 0.2, mats.rugCream],
    [5.55, 6.08, -0.35, coralMat]
  ]) {
    const tp = new THREE.Mesh(APP.makeRoundedBox(0.38, 0.36, 0.12, 0.04, 2), pmat);
    tp.position.set(px, 0.61, pz);
    tp.rotation.y = ry;
    tp.rotation.x = -0.22;
    tp.castShadow = true;
    g.add(tp);
  }
  arch.addBoxCollider(6.60, 6.03, 2.84, 0.98);
  arch.addBoxCollider(7.53, 4.72, 0.98, 1.80);

  // Sheer white floor-length curtains flanking large living-room window (X = 7.94)
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0xf7f6f2, transparent: true, opacity: 0.78, roughness: 0.9, side: THREE.DoubleSide });
  for (const cz of [4.30, 6.32]) {
    const curt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, H - 0.04, 12), curtainMat);
    curt.scale.set(0.5, 1, 1.4);
    curt.position.set(7.94, (H - 0.04) / 2, cz);
    g.add(curt);
  }

  // Square white coffee table with thin brushed chrome tubular frame (6.22, 4.92)
  const ctX = 6.22, ctZ = 4.92, ctS = 0.84, ctH = 0.42;
  const ctTop = new THREE.Mesh(new THREE.BoxGeometry(ctS, 0.028, ctS), mats.kitchenGloss);
  ctTop.position.set(ctX, ctH, ctZ);
  ctTop.castShadow = true; ctTop.receiveShadow = true;
  g.add(ctTop);
  for (const dx of [-ctS / 2 + 0.015, ctS / 2 - 0.015]) {
    for (const dz of [-ctS / 2 + 0.015, ctS / 2 - 0.015]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, ctH, 8), mats.chrome);
      leg.position.set(ctX + dx, ctH / 2, ctZ + dz);
      leg.castShadow = true;
      g.add(leg);
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, ctS, 8), mats.chrome);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(ctX + dx, 0.015, ctZ);
    g.add(bar);
  }
  // Coffee table decor: white ribbed vase + flowers, book, green candle
  const ctVase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.24, 14), mats.ceramicWhite);
  ctVase.position.set(ctX + 0.14, ctH + 0.13, ctZ - 0.12);
  ctVase.castShadow = true;
  const ctBook = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.30), mats.ceramicWhite);
  ctBook.position.set(ctX - 0.15, ctH + 0.025, ctZ + 0.10);
  ctBook.rotation.y = 0.22;
  const ctCandle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.20, 8), mats.leafGreen);
  ctCandle.position.set(ctX - 0.18, ctH + 0.13, ctZ + 0.12);
  g.add(ctVase, ctBook, ctCandle);
  for (let i = 0; i < 10; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), mats.ceramicWhite);
    fl.position.set(ctX + 0.14 + Math.cos(i * 0.8) * 0.08, ctH + 0.30 + (i % 3) * 0.03, ctZ - 0.12 + Math.sin(i * 0.8) * 0.08);
    g.add(fl);
  }
  arch.addBoxCollider(ctX, ctZ, ctS, ctS);

  // Cognac brown tufted leather floor pouf (5.88, 3.85)
  const pouf = new THREE.Mesh(APP.makeRoundedBox(0.68, 0.24, 0.68, 0.075, 4), mats.leatherCognac);
  pouf.position.set(5.88, 0.12, 3.85);
  pouf.rotation.y = 0.18;
  pouf.castShadow = true; pouf.receiveShadow = true;
  g.add(pouf);
  arch.addBoxCollider(5.88, 3.85, 0.68, 0.68);

  // Black wire hourglass side table (5.32, 5.20) with stacked books
  const wireTop = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.016, 22), mats.darkMetal);
  wireTop.position.set(5.32, 0.48, 5.20);
  wireTop.castShadow = true;
  const wireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 0.46, 14, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x22252a, wireframe: true }));
  wireBase.position.set(5.32, 0.24, 5.20);
  const sBook1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.30), mats.sandWall);
  sBook1.position.set(5.32, 0.505, 5.20); sBook1.rotation.y = 0.4;
  const sBook2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.28), mats.ceramicWhite);
  sBook2.position.set(5.32, 0.533, 5.20); sBook2.rotation.y = 0.32;
  g.add(wireTop, wireBase, sBook1, sBook2);

  // Round black-glass & chrome side table (4.85, 5.66) + coiled black globe lamp
  const glTop = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.014, 24), mats.tvScreen);
  glTop.position.set(4.85, 0.48, 5.66);
  const glStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.46, 10), mats.chrome);
  glStem.position.set(4.85, 0.24, 5.66);
  const glBase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 20), mats.chrome);
  glBase.position.set(4.85, 0.01, 5.66);
  const lampCoil = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 10, 18), mats.darkMetal);
  lampCoil.rotation.x = Math.PI / 2;
  lampCoil.position.set(4.85, 0.51, 5.66);
  const globeBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.072, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xffe4b5, emissive: 0xffb35c, emissiveIntensity: 1.4, roughness: 0.2 })
  );
  globeBulb.position.set(4.85, 0.62, 5.66);
  g.add(glTop, glStem, glBase, lampCoil, globeBulb);
  APP.lampGlobeMat = globeBulb.material;

  // Tall potted Dracaena marginata at hallway corner of sofa (4.76, 6.24)
  addPlant('dracaena', 4.76, 0, 6.24, 1.08);

  // Dark-grey upholstered armchair with warm teak armrests (3.62, 4.58)
  const armG = new THREE.Group();
  armG.position.set(3.62, 0, 4.58);
  armG.rotation.y = Math.PI * 0.44;
  const aSeat = new THREE.Mesh(APP.makeRoundedBox(0.56, 0.13, 0.56, 0.03, 2), mats.chairCharcoal);
  aSeat.position.set(0, 0.42, 0); aSeat.castShadow = true;
  const aBack = new THREE.Mesh(APP.makeRoundedBox(0.56, 0.44, 0.13, 0.03, 2), mats.chairCharcoal);
  aBack.position.set(0, 0.64, -0.22); aBack.rotation.x = -0.15; aBack.castShadow = true;
  const aPillow = new THREE.Mesh(APP.makeRoundedBox(0.36, 0.32, 0.10, 0.03, 2), mats.rugCream);
  aPillow.position.set(0, 0.58, -0.11); aPillow.rotation.x = -0.22;
  armG.add(aSeat, aBack, aPillow);
  for (const sx of [-0.30, 0.30]) {
    const legF = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.045), mats.teak);
    legF.position.set(sx, 0.28, 0.22); legF.castShadow = true;
    const legB = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.045), mats.teak);
    legB.position.set(sx, 0.22, -0.22); legB.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.038, 0.54), mats.teak);
    arm.position.set(sx, 0.56, 0.0); arm.castShadow = true;
    armG.add(legF, legB, arm);
  }
  g.add(armG);
  arch.addBoxCollider(3.62, 4.58, 0.68, 0.68);

  // ==================== LIVING ROOM & HALLWAY ARTWORK ====================
  // 1. LOUISIANA / DOIG poster + small green floral on Z = 6.52 wall behind sofa
  addArtFrame(0.74, 1.02, 5.56, 1.56, 6.50, Math.PI, 'doig', mats.chrome, false);
  addArtFrame(0.28, 0.38, 4.96, 1.84, 6.50, Math.PI, 'floral', mats.trimWhite, false);
  // 2. Green Peacock tapestry above armchair (X = 3.22 wall, facing +X)
  addArtFrame(0.86, 0.84, 3.23, 1.62, 4.55, Math.PI / 2, 'peacock', mats.darkMetal, true);
  // 3. Round clock on North face of shaft column (Z = 3.30, facing -Z toward kitchen)
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 24), mats.darkMetal);
  clockRim.rotation.x = Math.PI / 2;
  clockRim.position.set(3.43, 1.66, 3.29);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.125, 24), mats.ceramicWhite);
  clockFace.rotation.y = Math.PI;
  clockFace.position.set(3.43, 1.66, 3.275);
  g.add(clockRim, clockFace);
  // 4. LOUISIANA / GAURI GILL poster on X = 3.22 hallway/living wall (Z = 6.55)
  addArtFrame(0.46, 0.78, 3.23, 1.56, 6.55, Math.PI / 2, 'louisiana_gill', mats.oakFurniture, false);

  scene.add(g);
  return g;
};
