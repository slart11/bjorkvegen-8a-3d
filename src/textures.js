// Procedural PBR Textures, Material Library & Geometry Helpers
window.APP = window.APP || {};

APP.createMaterialLibrary = function(renderer) {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const texLoader = new THREE.TextureLoader();

  function finalizeTex(canvas, rx, ry, isColor) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = maxAniso;
    if (isColor) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // Deterministic pseudo-random for consistent wood/tile grain
  function rng(seed) {
    let s = seed >>> 0;
    return function() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // 1. 3-stavs eikeparkett (3-strip oak parquet)
  function makeOakParquet(rx, ry) {
    const W = 512, H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    const bg = b.getContext('2d');
    const rand = rng(42);

    const strips = 6; // 2 boards of 3 strips across W
    const sw = W / strips;
    for (let s = 0; s < strips; s++) {
      const offset = Math.floor(rand() * H);
      const segs = 3;
      const segH = H / segs;
      for (let k = -1; k <= segs; k++) {
        const y0 = k * segH + (offset % segH);
        const h = segH;
        const tone = (rand() - 0.5) * 18;
        const r = Math.min(255, Math.max(0, 206 + tone));
        const gr = Math.min(255, Math.max(0, 165 + tone * 0.85));
        const bl = Math.min(255, Math.max(0, 114 + tone * 0.65));
        g.fillStyle = `rgb(${r|0},${gr|0},${bl|0})`;
        g.fillRect(s * sw, y0, sw, h);

        bg.fillStyle = `rgb(${155 + (tone|0)},${155 + (tone|0)},${155 + (tone|0)})`;
        bg.fillRect(s * sw, y0, sw, h);

        // Wood grain streaks
        for (let i = 0; i < 24; i++) {
          const gx = s * sw + rand() * sw;
          const alpha = 0.04 + rand() * 0.08;
          g.fillStyle = rand() > 0.5 ? `rgba(115,76,38,${alpha})` : `rgba(236,204,158,${alpha * 0.8})`;
          g.fillRect(gx, y0, 1 + rand() * 2, h);
        }
        // End joint seam
        g.fillStyle = 'rgba(110,75,42,0.35)';
        g.fillRect(s * sw, y0, sw, 1.5);
        bg.fillStyle = 'rgb(70,70,70)';
        bg.fillRect(s * sw, y0, sw, 2);
      }
      // Vertical seam
      g.fillStyle = 'rgba(105,70,38,0.38)';
      g.fillRect(s * sw, 0, 1.3, H);
      bg.fillStyle = 'rgb(80,80,80)';
      bg.fillRect(s * sw, 0, 1.5, H);
    }

    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, rx, ry, true),
      bumpMap: finalizeTex(b, rx, ry, false),
      bumpScale: 0.004,
      roughness: 0.42,
      metalness: 0.02,
      envMapIntensity: 0.75
    });
  }

  // 2. Tile material (Entre dark slate / Bath grey / Bath white wall)
  function makeTileMat(baseHex, groutHex, cols, rows, rx, ry, rough, bumpAmt) {
    const W = 512, H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    const bg = b.getContext('2d');
    const rand = rng(baseHex.charCodeAt(1) * 13);

    g.fillStyle = groutHex; g.fillRect(0, 0, W, H);
    bg.fillStyle = 'rgb(75,75,75)'; bg.fillRect(0, 0, W, H);

    const col = new THREE.Color(baseHex);
    const tw = W / cols, th = H / rows;
    const pad = Math.max(2, Math.round(W * 0.006));

    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        const v = (rand() - 0.5) * 0.04;
        const rr = Math.min(255, Math.max(0, Math.round((col.r + v) * 255)));
        const gg = Math.min(255, Math.max(0, Math.round((col.g + v) * 255)));
        const bb = Math.min(255, Math.max(0, Math.round((col.b + v) * 255)));
        g.fillStyle = `rgb(${rr},${gg},${bb})`;
        g.fillRect(q * tw + pad, r * th + pad, tw - pad * 2, th - pad * 2);

        bg.fillStyle = 'rgb(200,200,200)';
        bg.fillRect(q * tw + pad, r * th + pad, tw - pad * 2, th - pad * 2);

        // Subtle stone speckle
        for (let k = 0; k < 55; k++) {
          const sx = q * tw + pad + rand() * (tw - pad * 2);
          const sy = r * th + pad + rand() * (th - pad * 2);
          g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
          g.fillRect(sx, sy, 2 + rand() * 5, 2 + rand() * 4);
        }
      }
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, rx, ry, true),
      bumpMap: finalizeTex(b, rx, ry, false),
      bumpScale: bumpAmt,
      roughness: rough,
      metalness: 0.04,
      envMapIntensity: 0.85
    });
  }

  // 3. Matte painted wall with delicate roller micro-texture
  function makeWallMat(hex, rough = 0.88) {
    const S = 256;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = S; b.height = S;
    const bg = b.getContext('2d');
    const rand = rng(99);
    g.fillStyle = hex; g.fillRect(0, 0, S, S);
    bg.fillStyle = 'rgb(128,128,128)'; bg.fillRect(0, 0, S, S);
    for (let i = 0; i < 1800; i++) {
      const x = rand() * S, y = rand() * S;
      g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)';
      g.fillRect(x, y, 3, 3);
      const bv = 118 + Math.floor(rand() * 20);
      bg.fillStyle = `rgb(${bv},${bv},${bv})`;
      bg.fillRect(x, y, 2, 2);
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, 3, 3, true),
      bumpMap: finalizeTex(b, 4, 4, false),
      bumpScale: 0.0018,
      roughness: rough,
      metalness: 0.0,
      envMapIntensity: 0.45
    });
  }

  // 3b. Textured limewash (kalkmaling) accent wall for TV wall
  function makeKalkWallMat(hex) {
    const S = 512;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = S; b.height = S;
    const bg = b.getContext('2d');
    const rand = rng(313);
    g.fillStyle = hex; g.fillRect(0, 0, S, S);
    bg.fillStyle = 'rgb(128,128,128)'; bg.fillRect(0, 0, S, S);
    for (let i = 0; i < 420; i++) {
      const x = rand() * S, y = rand() * S;
      const rad = 16 + rand() * 52;
      const grad = g.createRadialGradient(x, y, 2, x, y, rad);
      const light = rand() > 0.48;
      const a = 0.03 + rand() * 0.06;
      grad.addColorStop(0, light ? `rgba(218,205,168,${a})` : `rgba(82,72,50,${a})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      const bv = light ? 142 : 112;
      bg.fillStyle = `rgba(${bv},${bv},${bv},0.14)`;
      bg.beginPath(); bg.arc(x, y, rad * 0.7, 0, Math.PI * 2); bg.fill();
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, 1.4, 1.2, true),
      bumpMap: finalizeTex(b, 1.8, 1.5, false),
      bumpScale: 0.0035,
      roughness: 0.94,
      metalness: 0.0,
      envMapIntensity: 0.32
    });
  }

  // 4. Vertical tongue-and-groove panel wall (for both 6.5m2 bedrooms)
  function makePanelWallMat(hex) {
    const W = 512, H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    const bg = b.getContext('2d');
    const col = new THREE.Color(hex);
    const r = Math.round(col.r * 255), gr = Math.round(col.g * 255), bl = Math.round(col.b * 255);
    g.fillStyle = `rgb(${r},${gr},${bl})`; g.fillRect(0, 0, W, H);
    bg.fillStyle = 'rgb(200,200,200)'; bg.fillRect(0, 0, W, H);

    const grooves = 12;
    const gw = W / grooves;
    for (let i = 0; i < grooves; i++) {
      const x = i * gw;
      g.fillStyle = 'rgba(95,82,64,0.22)';
      g.fillRect(x, 0, 3, H);
      g.fillStyle = 'rgba(255,255,255,0.20)';
      g.fillRect(x + 3, 0, 2, H);
      bg.fillStyle = 'rgb(70,70,70)';
      bg.fillRect(x, 0, 4, H);
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, 2.6, 1, true),
      bumpMap: finalizeTex(b, 2.6, 1, false),
      bumpScale: 0.008,
      roughness: 0.72,
      metalness: 0.0,
      envMapIntensity: 0.5
    });
  }

  // 5. Deck wood planks (Terrasse 21 m2)
  function makeDeckMat() {
    const W = 512, H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    const bg = b.getContext('2d');
    const rand = rng(77);
    const planks = 8;
    const ph = H / planks;
    for (let p = 0; p < planks; p++) {
      const y = p * ph;
      const t = (rand() - 0.5) * 20;
      g.fillStyle = `rgb(${(156 + t)|0},${(112 + t*0.8)|0},${(72 + t*0.6)|0})`;
      g.fillRect(0, y + 2, W, ph - 4);
      bg.fillStyle = 'rgb(190,190,190)';
      bg.fillRect(0, y + 2, W, ph - 4);
      for (let i = 0; i < 30; i++) {
        g.fillStyle = rand() > 0.5 ? 'rgba(70,45,20,0.08)' : 'rgba(220,180,130,0.06)';
        g.fillRect(0, y + 3 + rand() * (ph - 6), W, 1 + rand() * 2);
      }
      g.fillStyle = '#382a1e';
      g.fillRect(0, y, W, 3);
      bg.fillStyle = 'rgb(40,40,40)';
      bg.fillRect(0, y, W, 3);
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, 3.2, 3.2, true),
      bumpMap: finalizeTex(b, 3.2, 3.2, false),
      bumpScale: 0.009,
      roughness: 0.78,
      metalness: 0.02
    });
  }

  // 6. Exterior horizontal wood siding (liggende kledning)
  function makeSidingMat(hex) {
    const W = 256, H = 256;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    const bg = b.getContext('2d');
    g.fillStyle = hex; g.fillRect(0, 0, W, H);
    bg.fillStyle = 'rgb(195,195,195)'; bg.fillRect(0, 0, W, H);
    const boards = 10;
    const bh = H / boards;
    for (let i = 0; i < boards; i++) {
      const y = i * bh;
      const grad = g.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, 'rgba(255,255,255,0.08)');
      grad.addColorStop(0.82, 'rgba(0,0,0,0.02)');
      grad.addColorStop(1, 'rgba(0,0,0,0.22)');
      g.fillStyle = grad;
      g.fillRect(0, y, W, bh);
      bg.fillStyle = 'rgb(60,60,60)';
      bg.fillRect(0, y + bh - 2, W, 2);
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, 2, 2, true),
      bumpMap: finalizeTex(b, 2, 2, false),
      bumpScale: 0.012,
      roughness: 0.76
    });
  }

  // 7. Woven fabric / rug texture
  function makeFabricMat(hex, rough = 0.92, rx = 4, ry = 4, bump = 0.005) {
    const S = 256;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    const b = document.createElement('canvas'); b.width = S; b.height = S;
    const bg = b.getContext('2d');
    const rand = rng(hex.charCodeAt(1) * 31);
    g.fillStyle = hex; g.fillRect(0, 0, S, S);
    bg.fillStyle = 'rgb(128,128,128)'; bg.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 2) {
      for (let x = 0; x < S; x += 2) {
        const d = (rand() - 0.5) * 0.14;
        g.fillStyle = d > 0 ? `rgba(255,255,255,${d})` : `rgba(0,0,0,${-d})`;
        g.fillRect(x, y, 2, 2);
        const bv = 128 + Math.round(d * 400);
        bg.fillStyle = `rgb(${bv},${bv},${bv})`;
        bg.fillRect(x, y, 2, 2);
      }
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, rx, ry, true),
      bumpMap: finalizeTex(b, rx, ry, false),
      bumpScale: bump,
      roughness: rough,
      metalness: 0.0,
      envMapIntensity: 0.35
    });
  }

  // 8. Lawn & gravel textures
  function makeNoiseGround(hex1, hex2, rx, ry) {
    const S = 256;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    const rand = rng(515);
    g.fillStyle = hex1; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = rand() > 0.5 ? hex2 : 'rgba(0,0,0,0.09)';
      g.fillRect(rand() * S, rand() * S, 2 + rand() * 3, 2 + rand() * 3);
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeTex(c, rx, ry, true),
      roughness: 0.95,
      metalness: 0
    });
  }

  // Load embedded artwork texture from window.ART_DATA
  function getArtMat(key, fallbackHex = '#dddddd') {
    const dataUrl = (window.ART_DATA && window.ART_DATA[key]) ? window.ART_DATA[key] : null;
    if (!dataUrl) {
      return new THREE.MeshStandardMaterial({ color: fallbackHex, roughness: 0.6 });
    }
    const tex = texLoader.load(dataUrl);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = maxAniso;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.45,
      metalness: 0.02,
      envMapIntensity: 0.45
    });
  }

  // Procedural sky & studio bounce PMREM for crisp PBR reflections
  function buildEnvMap() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(20, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xdbeafe, side: THREE.BackSide })
    );
    envScene.add(sky);
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff8e7 })
    );
    sunDisc.position.set(10, 9, 5);
    envScene.add(sunDisc);
    const warmBounce = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshBasicMaterial({ color: 0xd6c3a5, side: THREE.DoubleSide })
    );
    warmBounce.rotation.x = -Math.PI / 2;
    warmBounce.position.y = -4;
    envScene.add(warmBounce);
    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
  }

  const mats = {
    envMap: buildEnvMap(),
    oakFloor: makeOakParquet(4.5, 4.5),
    oakFurniture: makeOakParquet(1.5, 1.5),
    entreTile: makeTileMat('#35373a', '#242629', 4, 4, 1.3, 3.2, 0.68, 0.004),
    bathFloorTile: makeTileMat('#575b60', '#3d4045', 4, 4, 2.2, 1.4, 0.62, 0.005),
    bathWallTile: makeTileMat('#f0f1ee', '#c5c8c4', 2, 4, 2.5, 1.6, 0.32, 0.004),
    showerWall: makeTileMat('#666a6f', '#4e5257', 2, 3, 1.2, 1.4, 0.62, 0.006),
    sandWall: makeWallMat('#c4b798', 0.90),
    kalkWall: makeKalkWallMat('#b4a582'),
    terracottaWall: makeWallMat('#b38468', 0.90),
    whiteWall: makeWallMat('#f0eee9', 0.88),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf6f5f0, roughness: 0.94, envMapIntensity: 0.25 }),
    panelWall: makePanelWallMat('#e3dbc9'),
    trimWhite: new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.45, envMapIntensity: 0.45 }),
    doorWhite: new THREE.MeshStandardMaterial({ color: 0xf0efeb, roughness: 0.42, envMapIntensity: 0.45 }),
    frontDoor: new THREE.MeshStandardMaterial({ color: 0x62584d, roughness: 0.48, envMapIntensity: 0.5 }),
    kitchenGloss: new THREE.MeshStandardMaterial({ color: 0xf3f3f0, roughness: 0.20, metalness: 0.04, envMapIntensity: 0.85 }),
    counterTop: new THREE.MeshStandardMaterial({ color: 0xefeeea, roughness: 0.28, metalness: 0.02, envMapIntensity: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.30, metalness: 0.86, envMapIntensity: 1.05 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd0d6dc, roughness: 0.14, metalness: 0.94, envMapIntensity: 1.1 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc8a464, roughness: 0.28, metalness: 0.85, envMapIntensity: 1.1 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x202327, roughness: 0.4, metalness: 0.65, envMapIntensity: 0.7 }),
    tvScreen: new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.08, metalness: 0.35, envMapIntensity: 1.25 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xdff0f8, transparent: true, opacity: 0.22,
      roughness: 0.05, metalness: 0.05, reflectivity: 0.9, side: THREE.DoubleSide
    }),
    frostedGlass: new THREE.MeshPhysicalMaterial({
      color: 0xeef5f8, transparent: true, opacity: 0.72,
      roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide
    }),
    mirror: new THREE.MeshStandardMaterial({ color: 0x9aa8b5, roughness: 0.04, metalness: 0.92, envMapIntensity: 1.15 }),
    sofaOlive: makeFabricMat('#535c3b', 0.92, 6, 6, 0.006),
    chairCharcoal: makeFabricMat('#3d4043', 0.88, 3, 3, 0.005),
    sofaGrey: makeFabricMat('#928e85', 0.92, 5, 5, 0.006),
    rugTaupe: makeFabricMat('#8a837a', 0.96, 8, 6, 0.009),
    rugLightGrey: makeFabricMat('#c4c2bc', 0.95, 6, 6, 0.008),
    rugCream: makeFabricMat('#dfd9cd', 0.95, 4, 4, 0.008),
    leatherBlack: makeFabricMat('#1f2022', 0.38, 2, 2, 0.003),
    leatherCognac: makeFabricMat('#a56032', 0.44, 3, 3, 0.004),
    teak: new THREE.MeshStandardMaterial({ color: 0x9b5a2e, roughness: 0.45, envMapIntensity: 0.6 }),
    walnut: new THREE.MeshStandardMaterial({ color: 0x5c3c24, roughness: 0.42, envMapIntensity: 0.6 }),
    taupeLamp: new THREE.MeshStandardMaterial({ color: 0x9c9283, roughness: 0.45, metalness: 0.15 }),
    terracottaPot: new THREE.MeshStandardMaterial({ color: 0xb66a4b, roughness: 0.82 }),
    leafGreen: new THREE.MeshStandardMaterial({ color: 0x3b6935, roughness: 0.62, side: THREE.DoubleSide }),
    leafDark: new THREE.MeshStandardMaterial({ color: 0x2c4f28, roughness: 0.62, side: THREE.DoubleSide }),
    ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xf4f2ed, roughness: 0.32, envMapIntensity: 0.7 }),
    blindDark: new THREE.MeshStandardMaterial({ color: 0x383b40, roughness: 0.8 }),
    deckWood: makeDeckMat(),
    sidingBeige: makeSidingMat('#c8bca6'),
    sidingWhite: makeSidingMat('#efede7'),
    fenceBeige: new THREE.MeshStandardMaterial({ color: 0xd5cebf, roughness: 0.75 }),
    lawn: makeNoiseGround('#4b7a34', '#5c8d40', 18, 18),
    hedge: makeNoiseGround('#355e24', '#477832', 6, 2),
    gravel: makeNoiseGround('#9c988f', '#b5b0a6', 14, 14),
    getArtMat
  };
  return mats;
};

// Soft rounded box helper for cushions, mattresses, furniture
APP.makeRoundedBox = function(w, h, d, radius = 0.03, segs = 3) {
  const r = Math.min(radius, w * 0.45, h * 0.45, d * 0.45);
  const hw = w / 2 - r, hh = h / 2 - r;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hh - r);
  shape.lineTo(hw, -hh - r);
  shape.quadraticCurveTo(hw + r, -hh - r, hw + r, -hh);
  shape.lineTo(hw + r, hh);
  shape.quadraticCurveTo(hw + r, hh + r, hw, hh + r);
  shape.lineTo(-hw, hh + r);
  shape.quadraticCurveTo(-hw - r, hh + r, -hw - r, hh);
  shape.lineTo(-hw - r, -hh);
  shape.quadraticCurveTo(-hw - r, -hh - r, -hw, -hh - r);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, d - 2 * r),
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: segs,
    curveSegments: segs
  });
  geo.center();
  return geo;
};
