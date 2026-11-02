export class TextureGenerator {
  static create16x16(drawFn) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return { texture: tex, canvas: c };
  }

  // Dense blossom clusters, so a canopy reads as flowers rather than flat coloured cubes.
  // Mipmaps stop this fine detail from shimmering in the distance.
  static createBlossomTexture({ base, petals, highlight, center }) {
    const size = 32;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const pick = cols => cols[Math.floor(Math.random() * cols.length)];
    const pixel = (x, y) => ctx.fillRect((x + size) % size, (y + size) % size, 1, 1);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        ctx.fillStyle = pick(base);
        ctx.fillRect(x, y, 1, 1);
      }
    }

    for (let i = 0; i < 75; i++) {
      const bx = Math.floor(Math.random() * size);
      const by = Math.floor(Math.random() * size);
      ctx.fillStyle = pick(petals);
      pixel(bx - 1, by); pixel(bx + 1, by); pixel(bx, by - 1); pixel(bx, by + 1);
      ctx.fillStyle = highlight;
      pixel(bx + 1, by - 1);
      ctx.fillStyle = center;
      pixel(bx, by);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    return { texture: tex, canvas: c };
  }

  // Left half: a five-petal flower seen from above, nearly white so vertex colours can tint it.
  // Right half: plain white, used for stems. Built as raw pixels so the transparent area keeps
  // the petal colour; a canvas would turn it black and leave dark fringes on distant flowers.
  static createFlowerTexture() {
    const width = 64;
    const height = 32;
    const data = new Uint8Array(width * height * 4);
    const center = 15.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        let rgb = [255, 240, 245];
        let alpha = 255;

        if (x < height) {
          const dx = x - center;
          const dy = y - center;
          const r = Math.hypot(dx, dy);
          const petalEdge = 15 * (0.5 + 0.5 * Math.pow(Math.abs(Math.cos(2.5 * Math.atan2(dy, dx))), 0.7));
          alpha = r <= petalEdge ? 255 : 0;
          if (r < 2.5) rgb = [255, 214, 79];
          else if (r < 5.5) rgb = [214, 110, 140];
          else if (r > petalEdge - 2) rgb = [255, 255, 255];
          else if ((x + y * 3) % 7 === 0) rgb = [255, 214, 226];
        } else {
          rgb = [255, 255, 255];
        }

        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = alpha;
      }
    }

    const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return { texture: tex };
  }

  static generateAll() {
    const atlas = {};

    atlas['flower'] = this.createFlowerTexture();

    // 1. Grass Top: Fresh vibrant green with micro variation
    atlas['grass_top'] = this.create16x16(ctx => {
      const cols = ['#4f9a2a', '#459024', '#57a52f', '#3f8520', '#4c9c28'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 2. Grass Side: Rich dark soil beneath fresh grass cap
    atlas['grass_side'] = this.create16x16(ctx => {
      const dCols = ['#3d2516', '#4a2e1c', '#331e11', '#52331f'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = dCols[Math.floor(Math.random() * dCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      const gCols = ['#4f9a2a', '#459024', '#57a52f'];
      for (let x = 0; x < 16; x++) {
        const h = 3 + Math.floor(Math.sin(x * 1.3) * 1.5 + Math.random() * 1.8);
        for (let y = 0; y < h; y++) {
          ctx.fillStyle = gCols[Math.floor(Math.random() * gCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 3. Dirt: Deep rich chocolate loam
    atlas['dirt'] = this.create16x16(ctx => {
      const cols = ['#3d2516', '#4a2e1c', '#331e11', '#52331f', '#2a180e'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 4. Stone: Soft weathered mountain slate
    atlas['stone'] = this.create16x16(ctx => {
      const cols = ['#686a73', '#777983', '#5d5f67', '#838692'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#464850';
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(8, 0, 1, 7);
      ctx.fillRect(4, 8, 1, 8);
    });

    // 5. Sand: Warm golden shoreline sand
    atlas['sand'] = this.create16x16(ctx => {
      const cols = ['#ddcb9d', '#d4c18f', '#e6d6ab', '#c9b480'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 6. Cherry Wood Log Side: Dark reddish-brown bark with subtle horizontal stripes (Cherry Lenticels)
    atlas['log_side'] = this.create16x16(ctx => {
      const baseCols = ['#3d2128', '#46272f', '#321920', '#4f2c35', '#2a141b'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = baseCols[Math.floor(Math.random() * baseCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Characteristic horizontal cherry bark lenticels
      const drawLenticel = (x, y, len) => {
        ctx.fillStyle = '#180a0e';
        ctx.fillRect(x, y, len, 1);
        ctx.fillStyle = '#653a43'; // warm highlight
        ctx.fillRect(x + 1, (y - 1 >= 0 ? y - 1 : y + 1), Math.max(1, len - 2), 1);
      };
      drawLenticel(2, 3, 5);
      drawLenticel(9, 6, 5);
      drawLenticel(1, 10, 4);
      drawLenticel(10, 12, 4);
      drawLenticel(5, 14, 3);
    });

    // 7. Cherry Wood Log Top: Salmon peach interior rings
    atlas['log_top'] = this.create16x16(ctx => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const d = Math.hypot(x - 7.5, y - 7.5);
          if (d > 7) ctx.fillStyle = '#25161d';
          else if (d > 4.5) ctx.fillStyle = '#bd796a';
          else if (d > 2.5) ctx.fillStyle = '#d38c7d';
          else ctx.fillStyle = '#a66456';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 8. Wood Planks: Warm cedar planks
    atlas['planks'] = this.create16x16(ctx => {
      const cols = ['#c79462', '#bc8755', '#d4a16f', '#af7c4a'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#6f4a24';
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(7, 0, 1, 7);
      ctx.fillRect(4, 8, 1, 7);
    });

    // 9-13. Sakura blossom canopies, from palest to deepest pink
    atlas['leaves_white'] = this.createBlossomTexture({
      base: ['#f7a8c4', '#f498ba', '#fab4cc'],
      petals: ['#ffdbe7', '#ffcfe0', '#fff0f5'],
      highlight: '#ffffff',
      center: '#e64980'
    });
    atlas['leaves_light'] = this.createBlossomTexture({
      base: ['#f27aa8', '#ea6a9c', '#f68fb6'],
      petals: ['#ffb3cd', '#ffc2d6', '#ffa4c4'],
      highlight: '#fff1f5',
      center: '#d6336c'
    });
    atlas['leaves_soft'] = this.createBlossomTexture({
      base: ['#ec78a4', '#e26a98', '#f18cb2'],
      petals: ['#ffb8d0', '#ffa8c5', '#ffcadb'],
      highlight: '#ffe9f0',
      center: '#c2255c'
    });
    atlas['leaves_deep'] = this.createBlossomTexture({
      base: ['#d6457e', '#c2366e', '#e0588c'],
      petals: ['#f783ac', '#f06595', '#faa2c1'],
      highlight: '#ffdeeb',
      center: '#a61e4d'
    });
    atlas['leaves_magenta'] = this.createBlossomTexture({
      base: ['#c2377a', '#ad2a6a', '#d14a8a'],
      petals: ['#ee6ba3', '#e8599a', '#f48ab8'],
      highlight: '#ffc9de',
      center: '#8a1a54'
    });

    // 14. Lantern Block: Wooden lattice with warm glowing flame
    atlas['lantern'] = this.create16x16(ctx => {
      ctx.fillStyle = '#26170e';
      ctx.fillRect(0, 0, 16, 16);
      const fCols = ['#ff8800', '#ffa726', '#ffca28', '#fff9c4'];
      for (let y = 2; y < 14; y++) {
        for (let x = 2; x < 14; x++) {
          ctx.fillStyle = fCols[Math.floor(Math.random() * fCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#1c0f08';
      ctx.fillRect(7, 2, 2, 12);
      ctx.fillRect(2, 7, 12, 2);
    });

    // 15. Hanging Paper Lantern Block: Japanese rice paper with warm vermilion trim
    atlas['paper_lantern'] = this.create16x16(ctx => {
      ctx.fillStyle = '#1c0d12';
      ctx.fillRect(0, 0, 16, 16);
      const pCols = ['#fffbeb', '#fef3c7', '#fde68a', '#ffedd5'];
      for (let y = 2; y < 14; y++) {
        for (let x = 2; x < 14; x++) {
          ctx.fillStyle = pCols[Math.floor(Math.random() * pCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(0, 14, 16, 2);
      ctx.fillRect(0, 0, 2, 16);
      ctx.fillRect(14, 0, 2, 16);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(7, 2, 2, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(5, 5, 6, 6);
    });

    // 16. Glass
    atlas['glass'] = this.create16x16(ctx => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16); ctx.fillRect(15, 0, 1, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(3, 3, 3, 1); ctx.fillRect(4, 4, 1, 2);
    });

    // 17. Water: Crystal blue lake water
    atlas['water'] = this.create16x16(ctx => {
      const cols = ['#29b6f6', '#039be5', '#0288d1', '#4fc3f7'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
    // Repeats so the texture can scroll, which makes the water appear to flow
    atlas['water'].texture.wrapS = THREE.RepeatWrapping;
    atlas['water'].texture.wrapT = THREE.RepeatWrapping;

    // 18. Torii Red: Vibrant Japanese vermilion
    atlas['torii_red'] = this.create16x16(ctx => {
      const cols = ['#c92a2a', '#d63333', '#b52020', '#e03e3e'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, 15, 16, 1); ctx.fillRect(15, 0, 1, 16);
    });

    // 19. Slate Roof: Charcoal pagoda tiles
    atlas['roof_slate'] = this.create16x16(ctx => {
      const cols = ['#2d3238', '#383d45', '#24282d', '#424953'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#17191d';
      ctx.fillRect(0, 7, 16, 1); ctx.fillRect(0, 15, 16, 1);
    });

    // 20. Ground Petal Carpet Top (Grass speckled with fallen cherry petals)
    atlas['carpet_top'] = this.create16x16(ctx => {
      const gCols = ['#4f9a2a', '#459024', '#57a52f', '#3f8520', '#4c9c28'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = gCols[Math.floor(Math.random() * gCols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      const pCols = ['#ffb7ce', '#ffffff', '#f472b6', '#db2777', '#fbcfe8'];
      const petals = [
        [2, 3], [3, 3], [7, 2], [8, 3], [12, 4], [13, 5],
        [4, 8], [5, 9], [9, 8], [10, 8], [2, 12], [3, 13],
        [7, 13], [8, 14], [13, 11], [14, 12], [11, 14]
      ];
      petals.forEach(([px, py]) => {
        ctx.fillStyle = pCols[Math.floor(Math.random() * pCols.length)];
        ctx.fillRect(px, py, 1, 1);
      });
    });

    // 21. Ground Pink Petals Floating Quad (Scattered on grass floor)
    atlas['ground_petals'] = this.create16x16(ctx => {
      ctx.clearRect(0, 0, 16, 16);
      const pCols = ['#ff8da7', '#ffb7ce', '#ffffff', '#f06292'];
      ctx.fillStyle = pCols[0]; ctx.fillRect(3, 4, 2, 2);
      ctx.fillStyle = pCols[1]; ctx.fillRect(2, 4, 1, 2); ctx.fillRect(5, 4, 1, 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(3, 3, 2, 1);
      ctx.fillStyle = pCols[1]; ctx.fillRect(11, 8, 2, 2);
      ctx.fillStyle = pCols[3]; ctx.fillRect(10, 8, 1, 2); ctx.fillRect(13, 8, 1, 2);
      ctx.fillStyle = pCols[0]; ctx.fillRect(7, 12, 2, 2);
      ctx.fillStyle = '#4c8a1e';
      ctx.fillRect(4, 6, 1, 1); ctx.fillRect(12, 10, 1, 1);
    });

    atlas['snow'] = this.create16x16(ctx => {
      const cols = ['#f6f8fc', '#ffffff', '#e8eef7', '#dfe7f3'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    atlas['volcanic_rock'] = this.create16x16(ctx => {
      const cols = ['#3b3a44', '#45434f', '#33323b', '#514e5b', '#2b2a32'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    return atlas;
  }
}
