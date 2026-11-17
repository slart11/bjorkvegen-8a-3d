// Entre, Bad, 3 Bedrooms, Bod, Terrace (21 m2) & Charlottenlund Exterior
window.APP = window.APP || {};

APP.furnishOtherRoomsAndExterior = function(scene, mats, arch) {
  const g = new THREE.Group();
  const H = APP.H;
  const S = APP.XZ || 1;
  const addArt = APP.addArtFrame;
  const addPlant = APP.addPlant;

  // ==================== 1. ENTRE / GANG (6 m²) ====================
  // Light cream rectangular runner rug & dark welcome mat
  const eRug = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.009, 1.42), mats.rugCream);
  eRug.position.set(3.92, 0.0065, 7.62);
  eRug.receiveShadow = true;
  const doorMat = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.01, 0.42), mats.chairCharcoal);
  doorMat.position.set(3.92, 0.007, 10.12);
  g.add(eRug, doorMat);

  // Very small slim white floating shelf on East hallway wall (under wavy mirror)
  const smallShelf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.42), mats.doorWhite);
  smallShelf.position.set(4.55, 1.18, 7.22);
  smallShelf.castShadow = true; smallShelf.receiveShadow = true;
  g.add(smallShelf);

  // Ribbed cream vase + pink peonies resting on small white shelf
  const eVase = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.072, 0.20, 16), mats.ceramicWhite);
  eVase.position.set(4.55, 1.29, 7.22);
  eVase.castShadow = true;
  g.add(eVase);
  const peonyMat = new THREE.MeshStandardMaterial({ color: 0xe8a4ad, roughness: 0.75 });
  for (let i = 0; i < 6; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 6), peonyMat);
    fl.position.set(4.55 + Math.cos(i * 1.1) * 0.04, 1.42 + (i % 2) * 0.035, 7.22 + Math.sin(i * 1.1) * 0.04);
    g.add(fl);
  }

  // Wavy organic mirror above oak console (X = 4.61, Z = 7.22, Y = 1.72)
  const mirShape = new THREE.Shape();
  mirShape.moveTo(0, -0.34);
  mirShape.bezierCurveTo(0.22, -0.32, 0.26, -0.06, 0.19, 0.12);
  mirShape.bezierCurveTo(0.14, 0.28, 0.22, 0.36, 0.0, 0.38);
  mirShape.bezierCurveTo(-0.20, 0.36, -0.24, 0.16, -0.18, -0.06);
  mirShape.bezierCurveTo(-0.14, -0.22, -0.18, -0.32, 0, -0.34);
  const mirMesh = new THREE.Mesh(new THREE.ShapeGeometry(mirShape), mats.mirror);
  mirMesh.rotation.y = -Math.PI / 2;
  mirMesh.position.set(4.615, 1.72, 7.22);
  g.add(mirMesh);

  // Recessed built-in white wardrobe (X = 4.63..5.20, Z = 9.06..10.35, Y = 0..2.38)
  const ward = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.38, 1.28), mats.doorWhite);
  ward.position.set(4.92, 1.19, 9.70);
  ward.castShadow = true; ward.receiveShadow = true;
  const wardSeam = new THREE.Mesh(new THREE.BoxGeometry(0.008, 2.34, 0.008), mats.steel);
  wardSeam.position.set(4.64, 1.19, 9.70);
  // Leather loop pulls
  for (const pz of [9.63, 9.77]) {
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.055, 0.016), mats.leatherCognac);
    pull.position.set(4.63, 1.12, pz);
    g.add(pull);
  }
  g.add(ward, wardSeam);
  arch.addBoxCollider(4.92, 9.70, 0.56, 1.30);

  // West hallway wall: Hanging white planter with pothos (Z=8.18)
  addPlant('hanging', 3.30, 1.72, 8.18, 0.88);

  // ==================== 2. BAD (5,5 m²) ====================
  // Concrete-look wetroom wall panels inside corner shower (X = 0..0.92, Z = 6.24..7.14)
  const shBack = new THREE.Mesh(new THREE.PlaneGeometry(0.92, H), mats.showerWall);
  shBack.position.set(0.46, H / 2, 6.245);
  const shSide = new THREE.Mesh(new THREE.PlaneGeometry(0.90, H), mats.showerWall);
  shSide.rotation.y = Math.PI / 2;
  shSide.position.set(0.005, H / 2, 6.69);
  g.add(shBack, shSide);

  // Curved corner glass shower enclosure (X = 0..0.90, Z = 6.24..7.14)
  const shMat = mats.glass;
  const shDoor1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.98, 0.52), shMat);
  shDoor1.position.set(0.89, 1.00, 6.50);
  const shDoor2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.98, 0.012), shMat);
  shDoor2.position.set(0.26, 1.00, 7.13);
  const shDoorAng = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.98, 0.012), shMat);
  shDoorAng.position.set(0.70, 1.00, 6.94);
  shDoorAng.rotation.y = Math.PI / 4;
  // White aluminum shower frame posts
  for (const [fx, fz] of [[0.89, 6.25], [0.89, 6.76], [0.51, 7.13], [0.02, 7.13]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.032, 2.00, 0.032), mats.trimWhite);
    post.position.set(fx, 1.00, fz);
    g.add(post);
  }
  const shCol = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.15, 10), mats.chrome);
  shCol.position.set(0.32, 1.48, 6.29);
  const shHead = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.016, 16), mats.chrome);
  shHead.position.set(0.32, 2.02, 6.46);
  g.add(shDoor1, shDoor2, shDoorAng, shCol, shHead);
  arch.addBoxCollider(0.45, 6.69, 0.90, 0.90);

  // White front-load washing machine (X = 0.04..0.66, Z = 7.38..8.00, Y = 0..0.85)
  const washer = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.85, 0.60), mats.kitchenGloss);
  washer.position.set(0.35, 0.425, 7.69);
  washer.castShadow = true; washer.receiveShadow = true;
  const wDoor = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.035, 22), mats.tvScreen);
  wDoor.rotation.z = Math.PI / 2;
  wDoor.position.set(0.655, 0.45, 7.69);
  const wRing = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.016, 8, 22), mats.chrome);
  wRing.rotation.y = Math.PI / 2;
  wRing.position.set(0.66, 0.45, 7.69);
  // Folded towels on washer
  const towelStack = new THREE.Mesh(APP.makeRoundedBox(0.28, 0.09, 0.34, 0.02, 2), mats.sandWall);
  towelStack.position.set(0.35, 0.895, 7.69);
  g.add(washer, wDoor, wRing, towelStack);
  arch.addBoxCollider(0.35, 7.69, 0.62, 0.62);

  // Floating glossy white 2-drawer vanity (X = 1.16..2.12, Z = 6.24..6.72, Y = 0.38..0.86)
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.46, 0.48), mats.kitchenGloss);
  vanity.position.set(1.64, 0.62, 6.48);
  vanity.castShadow = true; vanity.receiveShadow = true;
  const vSeam = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.008, 0.008), mats.steel);
  vSeam.position.set(1.64, 0.62, 6.722);
  const vFaucet = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.15, 12), mats.chrome);
  vFaucet.position.set(1.64, 0.92, 6.32);
  const vSpout = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.11), mats.chrome);
  vSpout.position.set(1.64, 0.98, 6.37);
  const soapBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 10), mats.leatherCognac);
  soapBottle.position.set(1.88, 0.92, 6.32);
  g.add(vanity, vSeam, vFaucet, vSpout, soapBottle);
  arch.addBoxCollider(1.64, 6.48, 0.98, 0.50);

  // LED Backlit Bathroom Mirror (X = 1.16..2.12, Z = 6.26, Y = 1.08..1.86)
  const bMir = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.76, 0.022), mats.mirror);
  bMir.position.set(1.64, 1.47, 6.255);
  g.add(bMir);
  const ledBarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const lx of [1.23, 2.05]) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.64), ledBarMat);
    bar.position.set(lx, 1.47, 6.268);
    g.add(bar);
  }

  // Green hand towel on hook & Wall-hung white toilet (X = 2.48..2.98, Z = 6.24..6.78)
  const gTowel = new THREE.Mesh(APP.makeRoundedBox(0.18, 0.42, 0.05, 0.015, 2), mats.sofaOlive);
  gTowel.position.set(2.26, 0.85, 6.27);
  g.add(gTowel);
  const wcBowl = new THREE.Mesh(APP.makeRoundedBox(0.36, 0.28, 0.50, 0.08, 3), mats.kitchenGloss);
  wcBowl.position.set(2.68, 0.31, 6.50);
  wcBowl.castShadow = true;
  const wcSeat = new THREE.Mesh(APP.makeRoundedBox(0.35, 0.04, 0.46, 0.02, 2), mats.kitchenGloss);
  wcSeat.position.set(2.68, 0.46, 6.51);
  const flushPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.014), mats.kitchenGloss);
  flushPlate.position.set(2.68, 0.98, 6.248);
  g.add(wcBowl, wcSeat, flushPlate);
  arch.addBoxCollider(2.68, 6.50, 0.40, 0.52);

  // Bath mat & Pink bathrobe hanging behind door
  const bathMat = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.01, 0.54), mats.rugCream);
  bathMat.position.set(1.64, 0.007, 7.18);
  const robe = new THREE.Mesh(APP.makeRoundedBox(0.12, 0.92, 0.28, 0.04, 2), new THREE.MeshStandardMaterial({ color: 0xb6746e, roughness: 0.9 }));
  robe.position.set(3.02, 1.32, 7.86);
  g.add(bathMat, robe);

  // ==================== 3. SOVEROM 1 (10,5 m² MASTER) ====================
  // Double bed against North wall (X = 1.00..2.65, Z = 2.74..4.76)
  const mBedBase = new THREE.Mesh(APP.makeRoundedBox(1.64, 0.36, 2.02, 0.03, 2), mats.rugTaupe);
  mBedBase.position.set(1.82, 0.22, 3.76);
  mBedBase.castShadow = true; mBedBase.receiveShadow = true;
  const mDuvet = new THREE.Mesh(APP.makeRoundedBox(1.70, 0.18, 1.56, 0.05, 3), mats.rugTaupe);
  mDuvet.position.set(1.82, 0.46, 3.96);
  mDuvet.castShadow = true;
  const mThrow = new THREE.Mesh(APP.makeRoundedBox(1.72, 0.04, 0.55, 0.02, 2), mats.rugCream);
  mThrow.position.set(1.82, 0.55, 4.46);
  g.add(mBedBase, mDuvet, mThrow);
  // Pillows
  for (const px of [1.44, 2.20]) {
    const pBack = new THREE.Mesh(APP.makeRoundedBox(0.68, 0.36, 0.16, 0.04, 2), mats.ceramicWhite);
    pBack.position.set(px, 0.62, 2.86);
    pBack.rotation.x = 0.25;
    const pFront = new THREE.Mesh(APP.makeRoundedBox(0.56, 0.28, 0.14, 0.04, 2), mats.sandWall);
    pFront.position.set(px, 0.58, 3.04);
    pFront.rotation.x = 0.35;
    g.add(pBack, pFront);
  }
  arch.addBoxCollider(1.82, 3.76, 1.70, 2.04);

  // Black metal nightstand & wall reading sconces
  const ns = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.36), mats.darkMetal);
  ns.position.set(2.86, 0.42, 2.94); ns.castShadow = true;
  g.add(ns);
  for (const lx of [2.66, 3.04]) {
    for (const lz of [2.76, 3.10]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.48, 0.018), mats.darkMetal);
      leg.position.set(lx, 0.24, lz);
      g.add(leg);
    }
  }
  for (const sx of [0.85, 2.84]) {
    const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.08, 12), mats.darkMetal);
    sconce.position.set(sx, 1.06, 2.78);
    sconce.rotation.x = 0.35;
    g.add(sconce);
  }

  // Real artwork above master bed
  addArt(0.52, 0.70, 1.62, 1.48, 2.725, 0, 'master_blue', mats.darkMetal, false);
  addArt(0.32, 0.40, 2.18, 1.44, 2.725, 0, 'master_bw', mats.darkMetal, false);

  // White floor-to-ceiling wardrobe along South wall (X = 0.65..2.45, Z = 5.52..6.12)
  const mWard = new THREE.Mesh(new THREE.BoxGeometry(1.80, 2.38, 0.58), mats.doorWhite);
  mWard.position.set(1.55, 1.19, 5.83);
  mWard.castShadow = true; mWard.receiveShadow = true;
  g.add(mWard);
  arch.addBoxCollider(1.55, 5.83, 1.82, 0.60);

  // Round light-grey rug
  const mRug = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.01, 32), mats.rugLightGrey);
  mRug.position.set(1.85, 0.005, 5.14);
  mRug.receiveShadow = true;
  g.add(mRug);

  // ==================== 4. SOVEROM 2 (6,5 m² SV) ====================
  // Single bed positioned directly underneath the West window (X = 0.06..1.02, Z = 8.35..10.29)
  const swBedFrame = new THREE.Mesh(APP.makeRoundedBox(0.96, 0.34, 1.94, 0.03, 2), mats.oakFurniture);
  swBedFrame.position.set(0.54, 0.19, 9.32);
  swBedFrame.castShadow = true; swBedFrame.receiveShadow = true;
  const swMattress = new THREE.Mesh(APP.makeRoundedBox(0.92, 0.14, 1.88, 0.03, 2), mats.ceramicWhite);
  swMattress.position.set(0.54, 0.38, 9.32);
  const swDuvet = new THREE.Mesh(APP.makeRoundedBox(0.96, 0.14, 1.42, 0.04, 3), mats.rugTaupe);
  swDuvet.position.set(0.54, 0.46, 9.08);
  swDuvet.castShadow = true;
  const swThrow = new THREE.Mesh(APP.makeRoundedBox(0.98, 0.04, 0.45, 0.02, 2), mats.rugCream);
  swThrow.position.set(0.54, 0.54, 8.64);
  const swPillow = new THREE.Mesh(APP.makeRoundedBox(0.62, 0.14, 0.36, 0.04, 2), mats.ceramicWhite);
  swPillow.position.set(0.54, 0.51, 10.02);
  swPillow.rotation.x = -0.18;
  const swHeadboard = new THREE.Mesh(APP.makeRoundedBox(0.98, 0.62, 0.06, 0.02, 2), mats.oakFurniture);
  swHeadboard.position.set(0.54, 0.31, 10.28);
  swHeadboard.castShadow = true;
  g.add(swBedFrame, swMattress, swDuvet, swThrow, swPillow, swHeadboard);
  arch.addBoxCollider(0.54, 9.32, 1.00, 1.96);

  // Aapo Huhta framed poster + Oak wall shelf with books on South wall
  addArt(0.54, 0.76, 1.82, 1.44, 10.34, Math.PI, 'huhta', mats.darkMetal, false);
  const swShelf = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.028, 0.18), mats.oakFurniture);
  swShelf.position.set(1.82, 1.98, 10.25);
  swShelf.castShadow = true;
  g.add(swShelf);
  for (let i = 0; i < 9; i++) {
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.17 + (i % 3) * 0.02, 0.13),
      i % 3 === 0 ? mats.terracottaPot : (i % 3 === 1 ? mats.darkMetal : mats.sofaOlive));
    bk.position.set(1.49 + i * 0.034, 2.08, 10.25);
    g.add(bk);
  }

  // Brass 2-arm floor lamp in SE corner
  const flStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 1.56, 10), mats.brass);
  flStem.position.set(2.76, 0.78, 10.06);
  const flBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), mats.brass);
  flBase.position.set(2.76, 0.01, 10.06);
  const shade1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 12), mats.ceramicWhite);
  shade1.position.set(2.68, 1.56, 9.98); shade1.rotation.z = 0.5;
  const shade2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 12), mats.ceramicWhite);
  shade2.position.set(2.82, 1.52, 9.96); shade2.rotation.z = -0.4;
  g.add(flStem, flBase, shade1, shade2);

  // Round light-grey rug in center of room (no sofa or table)
  const swRug = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.01, 28), mats.rugLightGrey);
  swRug.position.set(1.92, 0.005, 9.25);
  g.add(swRug);

  // Tilted TV + white electrical breaker cabinet on North wall (Z = 8.18)
  const swTv = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.028), mats.tvScreen);
  swTv.position.set(1.38, 1.62, 8.21);
  swTv.rotation.x = 0.18;
  const breaker = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.52, 0.04), mats.trimWhite);
  breaker.position.set(1.38, 1.14, 8.18);
  g.add(swTv, breaker);
  addPlant('smallHerb', 0.06, 0.91, 9.52, 0.72);

  // ==================== 5. SOVEROM 3 (6,5 m² Ø) & BOD (3 m²) ====================
  // Single bed in NE corner (X = 5.56..7.52, Z = 6.66..7.62)
  const eBed = new THREE.Mesh(APP.makeRoundedBox(1.94, 0.38, 0.94, 0.03, 2), mats.rugCream);
  eBed.position.set(6.54, 0.22, 7.14);
  eBed.castShadow = true; eBed.receiveShadow = true;
  const ePillow = new THREE.Mesh(APP.makeRoundedBox(0.45, 0.16, 0.62, 0.04, 2), new THREE.MeshStandardMaterial({ color: 0xdfb8b4, roughness: 0.88 }));
  ePillow.position.set(7.24, 0.48, 7.14);
  g.add(eBed, ePillow);
  arch.addBoxCollider(6.54, 7.14, 1.98, 0.98);

  // Two small blush prints above bed on North wall (Z = 6.65)
  addArt(0.24, 0.32, 6.82, 1.46, 6.655, 0, 'east_blush', mats.oakFurniture, false);
  addArt(0.24, 0.32, 7.12, 1.46, 6.655, 0, 'east_blush', mats.oakFurniture, false);

  // Round oak nightstand under window (7.25, 7.98) + pink mushroom lamp
  const eNsTop = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 20), mats.oakFurniture);
  eNsTop.position.set(7.25, 0.48, 7.98); eNsTop.castShadow = true;
  const eNsLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.46, 12, 1, true), mats.oakFurniture);
  eNsLeg.position.set(7.25, 0.24, 7.98);
  const mushBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.15, 12), peonyMat);
  mushBase.position.set(7.25, 0.56, 7.98);
  const mushCap = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), peonyMat);
  mushCap.position.set(7.25, 0.61, 7.98);
  g.add(eNsTop, eNsLeg, mushBase, mushCap);

  // Cream shag rug & wall shelves right of window
  const eastRug = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.014, 0.78), mats.rugCream);
  eastRug.position.set(6.28, 0.007, 8.15);
  g.add(eastRug);
  for (const sy of [1.45, 1.72]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.42), mats.trimWhite);
    sh.position.set(7.46, sy, 8.62);
    g.add(sh);
  }

  // Inside Bod (3 m²): Shelf, hanging coats, technical/ventilation cabinet (X=5.32..7.50, Z=9.06..10.34)
  const bodShelf = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.028, 0.34), mats.trimWhite);
  bodShelf.position.set(6.65, 1.88, 10.15);
  const bodRail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.50, 8), mats.chrome);
  bodRail.rotation.z = Math.PI / 2;
  bodRail.position.set(6.65, 1.76, 10.10);
  g.add(bodShelf, bodRail);
  for (let i = 0; i < 6; i++) {
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.28),
      i % 2 === 0 ? mats.darkMetal : mats.chairCharcoal);
    coat.position.set(6.20 + i * 0.14, 1.30, 10.10);
    g.add(coat);
  }
  const ventUnit = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.72, 0.32), mats.kitchenGloss);
  ventUnit.position.set(5.65, 1.48, 10.15);
  g.add(ventUnit);

  // ==================== 6. TERRASSE (21 m²) & EXTERIOR ====================
  // Wooden deck floor outside dining, diagonal wall & living window wall
  const deckShape = new THREE.Shape();
  deckShape.moveTo(5.80, 0.70);   // corresponds to Z = -0.70
  deckShape.lineTo(9.45, 0.70);
  deckShape.bezierCurveTo(9.85, 0.10, 9.95, -1.20, 9.95, -2.50);
  deckShape.lineTo(9.95, -6.65);
  deckShape.lineTo(8.03, -6.65);
  deckShape.lineTo(8.03, -2.82);
  deckShape.lineTo(7.52, -2.82);
  deckShape.lineTo(5.80, -1.10);
  deckShape.closePath();

  const deckGeo = new THREE.ShapeGeometry(deckShape);
  const dPos = deckGeo.attributes.position, dUv = deckGeo.attributes.uv;
  for (let i = 0; i < dPos.count; i++) dUv.setXY(i, dPos.getX(i) / 3.5, dPos.getY(i) / 3.5);
  const deckMesh = new THREE.Mesh(deckGeo, mats.deckWood);
  deckMesh.rotation.x = -Math.PI / 2;
  deckMesh.position.y = -0.02;
  deckMesh.receiveShadow = true;
  g.add(deckMesh);

  // Horizontal wooden slat railing around outer terrace edge (p11_img0, p11_img1, p11_img2)
  function addSlatFence(x1, z1, x2, z2, h = 0.96, hEnd = null) {
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
    const rotY = Math.atan2(-dz, dx);
    const fg = new THREE.Group();
    fg.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
    fg.rotation.y = rotY;
    const hMax = hEnd !== null ? Math.max(h, hEnd) : h;
    // Posts
    const posts = Math.max(2, Math.ceil(L / 1.4) + 1);
    for (let i = 0; i < posts; i++) {
      const t = i / (posts - 1);
      const ph = hEnd !== null ? (h + (hEnd - h) * t) : h;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, ph, 0.055), mats.fenceBeige);
      post.position.set(-L / 2 + t * L, ph / 2 - 0.02, 0);
      post.castShadow = true;
      fg.add(post);
    }
    // Horizontal slats
    const numSlats = Math.floor(hMax / 0.085);
    for (let s = 0; s < numSlats; s++) {
      const sy = 0.06 + s * 0.085;
      if (hEnd !== null) {
        // Sloping privacy screen (levegg, p11_img0)
        const sLen = L * Math.min(1, Math.max(0.15, (h - sy) / (h - hEnd + 0.01)));
        if (sy < hEnd) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(L, 0.055, 0.022), mats.fenceBeige);
          slat.position.set(0, sy, 0); slat.castShadow = true; fg.add(slat);
        } else if (sy < h) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(sLen, 0.055, 0.022), mats.fenceBeige);
          slat.position.set(-L / 2 + sLen / 2, sy, 0); slat.castShadow = true; fg.add(slat);
        }
      } else {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(L, 0.055, 0.022), mats.fenceBeige);
        slat.position.set(0, sy, 0); slat.castShadow = true; fg.add(slat);
      }
    }
    // Top rail
    if (hEnd === null) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(L + 0.04, 0.04, 0.08), mats.fenceBeige);
      cap.position.set(0, h - 0.02, 0); cap.castShadow = true;
      fg.add(cap);
    }
    g.add(fg);
    arch.colliders.push({ kind: 'seg', x1: x1 * S, z1: z1 * S, x2: x2 * S, z2: z2 * S, pad: 0.08 * S, enabled: true });
  }
  addSlatFence(5.90, -0.68, 9.45, -0.68, 0.96);
  addSlatFence(9.45, -0.68, 9.93, 2.20, 0.96);
  // East lawn-facing railing split for 1.10m opening out onto the front grass (Z = 4.35 .. 5.45, p11_img0/p11_img1/p11_img2)
  addSlatFence(9.93, 2.20, 9.93, 4.35, 0.96);
  addSlatFence(9.93, 5.45, 9.93, 6.62, 0.96);
  // Sloping privacy screen (levegg) at South end of terrace (Z = 6.62, X = 8.13..9.93)
  addSlatFence(8.13, 6.62, 9.93, 6.62, 1.92, 0.96);

  // Wooden deck edge trim (kantbord) & step plank down to lawn at the opening (Z = 4.35..5.45)
  const deckRimEast = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 4.46), mats.deckWood);
  deckRimEast.position.set(9.95, -0.10, 4.42);
  const deckRimSouth = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.16, 0.05), mats.deckWood);
  deckRimSouth.position.set(8.98, -0.10, 6.64);
  const stepPlank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 1.10), mats.deckWood);
  stepPlank.position.set(10.07, -0.11, 4.90);
  stepPlank.receiveShadow = true; stepPlank.castShadow = true;
  g.add(deckRimEast, deckRimSouth, stepPlank);

  // Outdoor dining table & white chairs on terrace (positioned North of opening, p11_img1/p11_img2)
  const otTop = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.028, 1.48), mats.trimWhite);
  otTop.position.set(8.92, 0.72, 2.55); otTop.castShadow = true; otTop.receiveShadow = true;
  g.add(otTop);
  for (const dx of [-0.38, 0.38]) {
    for (const dz of [-0.66, 0.66]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.72, 0.035), mats.trimWhite);
      l.position.set(8.92 + dx, 0.35, 2.55 + dz);
      g.add(l);
    }
  }
  for (const [cx, cz, ry] of [[8.46, 2.55, Math.PI / 2], [9.38, 2.55, -Math.PI / 2]]) {
    const ch = new THREE.Group();
    ch.position.set(cx, -0.02, cz); ch.rotation.y = ry;
    const cs = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), mats.trimWhite);
    cs.position.y = 0.44;
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.04), mats.trimWhite);
    cb.position.set(0, 0.66, -0.20);
    ch.add(cs, cb);
    g.add(ch);
  }
  // Covered grill / corner storage tucked neatly at South wall behind levegg (keeps opening clear)
  const grill = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.88, 16), mats.darkMetal);
  grill.position.set(8.52, 0.42, 6.22); grill.castShadow = true;
  const terrPot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.34, 14), mats.terracotta);
  terrPot.position.set(9.65, 0.15, 6.28);
  g.add(grill, terrPot);

  // 2nd Floor of 4-mannsbolig above ceiling (Y = 2.45..5.15) + 2nd floor balcony overhang (p11_img0, p11_img1)
  const upperGroup = new THREE.Group();
  const upperBox = new THREE.Mesh(new THREE.BoxGeometry(8.25, 2.75, 10.65), mats.sidingBeige);
  upperBox.position.set(3.92, 3.85, 5.18);
  upperBox.castShadow = true;
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(8.55, 0.14, 10.95), mats.darkMetal);
  roofCap.position.set(3.92, 5.28, 5.18);
  // 2nd floor wooden balcony overhang above North dining half of terrace only (Z = -0.68 .. 2.82, p11_img1)
  const balcFloor = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 3.50), mats.deckWood);
  balcFloor.position.set(8.88, 2.54, 1.07);
  balcFloor.castShadow = true;
  const balcRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.96, 3.50), mats.fenceBeige);
  balcRail.position.set(9.93, 3.08, 1.07);
  upperGroup.add(upperBox, roofCap, balcFloor, balcRail);
  upperGroup.scale.set(S, 1, S);
  scene.add(upperGroup);

  // Adjacent half of 4-mannsbolig (SEK 1 to the South, Z = 10.65..21.5)
  const sek1 = new THREE.Mesh(new THREE.BoxGeometry(8.25, 5.25, 10.8), mats.sidingWhite);
  sek1.position.set(3.92, 2.60, 16.05);
  sek1.castShadow = true; sek1.receiveShadow = true;
  g.add(sek1);
  arch.colliders.push({ kind: 'box', minX: -0.25 * S, maxX: 8.08 * S, minZ: 10.60 * S, maxZ: 21.55 * S, enabled: true });
  // Terrace dining table collider
  arch.colliders.push({ kind: 'box', minX: 8.42 * S, maxX: 9.42 * S, minZ: 1.75 * S, maxZ: 3.35 * S, enabled: true });

  // ==================== SURROUNDING GROUND, HEDGE & NEIGHBORS ====================
  // Green lawn
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), mats.lawn);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(4, -0.18, 4);
  lawn.receiveShadow = true;
  g.add(lawn);

  // Gravel courtyard/driveway on North side (Z = -14 .. -1.2)
  const gravel = new THREE.Mesh(new THREE.PlaneGeometry(34, 13), mats.gravel);
  gravel.rotation.x = -Math.PI / 2;
  gravel.position.set(6, -0.16, -7.5);
  gravel.receiveShadow = true;
  g.add(gravel);

  // Trimmed green hedge along East side (p11_img1, p15_img0, p17_img0)
  const hedgeEast = new THREE.Mesh(APP.makeRoundedBox(1.15, 1.95, 28, 0.18, 2), mats.hedge);
  hedgeEast.position.set(13.2, 0.80, 6.0);
  hedgeEast.castShadow = true; hedgeEast.receiveShadow = true;
  g.add(hedgeEast);
  arch.colliders.push({ kind: 'box', minX: 12.55 * S, maxX: 13.85 * S, minZ: -8.5 * S, maxZ: 20.5 * S, enabled: true });

  // White neighbor house across the North courtyard (visible out Kitchen & Dining windows! p1_img0, p16_img0, p19_img0)
  const nHouse = new THREE.Mesh(new THREE.BoxGeometry(9.5, 4.6, 6.8), mats.sidingWhite);
  nHouse.position.set(3.2, 2.1, -14.2);
  nHouse.castShadow = true; nHouse.receiveShadow = true;
  // Red-trimmed pitched roof
  const nRoof = new THREE.Mesh(new THREE.ConeGeometry(6.8, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0x8b3a2e, roughness: 0.78 }));
  nRoof.position.set(3.2, 5.7, -14.2);
  nRoof.rotation.y = Math.PI / 4;
  // Dark blue-grey front door & heat pump on neighbor house (p1_img0, p16_img0)
  const nDoor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x38424d, roughness: 0.5 }));
  nDoor.position.set(4.5, 1.05, -10.78);
  const heatPump = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.58, 0.34), mats.ceramicWhite);
  heatPump.position.set(1.2, 1.35, -10.65);
  // Parked dark red car in driveway with wheels & windshield (visible in p17_img0!)
  const carRedMat = new THREE.MeshStandardMaterial({ color: 0x8d2420, roughness: 0.25, metalness: 0.45 });
  const carBody = new THREE.Mesh(APP.makeRoundedBox(1.85, 0.68, 4.1, 0.12, 2), carRedMat);
  carBody.position.set(0.4, 0.48, -5.8);
  carBody.rotation.y = 0.15;
  carBody.castShadow = true;
  const carCab = new THREE.Mesh(APP.makeRoundedBox(1.55, 0.54, 2.0, 0.12, 2), carRedMat);
  carCab.position.set(0.4, 1.00, -5.8);
  carCab.rotation.y = 0.15;
  const carGroup = new THREE.Group();
  carGroup.position.set(0.4, 0, -5.8);
  carGroup.rotation.y = 0.15;
  for (const wx of [-0.88, 0.88]) {
    for (const wz of [-1.25, 1.25]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), mats.darkMetal);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(wx, 0.16, wz);
      carGroup.add(wh);
    }
  }
  g.add(nHouse, nRoof, nDoor, heatPump, carBody, carCab, carGroup);

  // White neighbor house close on West side (visible outside SW/Master/Bath windows, p20_img0)
  const wNeighbor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5.2, 12.0), mats.sidingWhite);
  wNeighbor.position.set(-7.6, 2.4, 6.5);
  g.add(wNeighbor);

  // Neighboring building across East street (visible outside East bedroom window, p22_img0)
  const eNeighbor = new THREE.Mesh(new THREE.BoxGeometry(7.0, 5.8, 12.0), mats.sidingBeige);
  eNeighbor.position.set(22.0, 2.7, 8.0);
  g.add(eNeighbor);

  // Distant Trondheimsfjorden & Fosen hills on far North horizon
  const fjord = new THREE.Mesh(new THREE.PlaneGeometry(240, 80),
    new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.28, metalness: 0.2 }));
  fjord.rotation.x = -Math.PI / 2;
  fjord.position.set(0, -0.5, -80);
  const hills = new THREE.Mesh(new THREE.ConeGeometry(85, 16, 7),
    new THREE.MeshStandardMaterial({ color: 0x4f6875, roughness: 0.95 }));
  hills.scale.set(2.5, 1, 0.5);
  hills.position.set(10, 6, -125);
  g.add(fjord, hills);

  g.scale.set(S, 1, S);
  scene.add(g);
  return { group: g, upperGroup };
};
