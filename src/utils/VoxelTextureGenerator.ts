import * as THREE from 'three';

/**
 * Generates crisp HD Minecraft-style stylized textures (Faithful / RTX Aesthetic)
 * using HTML5 Canvas. Zero external assets required.
 */
export class VoxelTextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Helper to create a canvas texture with crisp NearestFilter
   */
  private static createTexture(
    width: number,
    height: number,
    drawer: (ctx: CanvasRenderingContext2D) => void
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    drawer(ctx);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * 1. Grass Block Top: Vibrant warm meadow lime-green matching Minecraft 1.20 Cherry Grove
   */
  public static getGrassTop(): THREE.CanvasTexture {
    if (this.cache.has('grass_top')) return this.cache.get('grass_top')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const baseColors = ['#6eb827', '#77c42b', '#65aa23', '#7ecb2e', '#5ba01e'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const rand = Math.random();
          let color = baseColors[Math.floor(Math.random() * baseColors.length)];
          if (rand > 0.92) color = '#88d736'; // sun highlight
          else if (rand < 0.08) color = '#4e8d18'; // crevice shadow
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
    });

    this.cache.set('grass_top', tex);
    return tex;
  }

  /**
   * 2. Grass Block Side: Rich brown loam dirt with hanging pixel grass fringe
   */
  public static getGrassSide(): THREE.CanvasTexture {
    if (this.cache.has('grass_side')) return this.cache.get('grass_side')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      // Dirt base
      const dirtColors = ['#866043', '#795439', '#8f6749', '#6d4b32', '#976f50'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const rand = Math.random();
          let color = dirtColors[Math.floor(Math.random() * dirtColors.length)];
          if (rand > 0.94) color = '#a67d5c'; // stone pebble
          else if (rand < 0.06) color = '#573a25'; // dark soil
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Hanging grass blades
      const grassColors = ['#5ca632', '#65b337', '#71c03e', '#4f9429'];
      for (let x = 0; x < 32; x++) {
        const overhang = 4 + Math.floor(Math.sin(x * 1.5) * 2 + Math.random() * 3);
        for (let y = 0; y < overhang; y++) {
          ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
        // Shadow under grass edge
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(x, overhang, 1, 1);
      }
    });

    this.cache.set('grass_side', tex);
    return tex;
  }

  /**
   * 3. Dirt Block: Rich loamy soil with fine pebbles
   */
  public static getDirt(): THREE.CanvasTexture {
    if (this.cache.has('dirt')) return this.cache.get('dirt')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const dirtColors = ['#866043', '#795439', '#8f6749', '#6d4b32', '#976f50'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const rand = Math.random();
          let color = dirtColors[Math.floor(Math.random() * dirtColors.length)];
          if (rand > 0.95) color = '#ab8361';
          else if (rand < 0.05) color = '#573a25';
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    this.cache.set('dirt', tex);
    return tex;
  }

  /**
   * 4. Sand Block: Golden beach sand with subtle wavy ripples
   */
  public static getSand(): THREE.CanvasTexture {
    if (this.cache.has('sand')) return this.cache.get('sand')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const sandColors = ['#dbcb9e', '#d2c091', '#e2d3a7', '#c9b787', '#ebdcaf'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const wave = Math.sin((x + y * 0.5) * 0.4) * 0.5;
          let idx = Math.floor(Math.random() * sandColors.length);
          if (wave > 0.2 && Math.random() > 0.4) idx = Math.min(idx + 1, sandColors.length - 1);
          ctx.fillStyle = sandColors[idx];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    this.cache.set('sand', tex);
    return tex;
  }

  /**
   * 5. Stone / Cobblestone Block: Sharp chiseled stone with edge seams
   */
  public static getStone(): THREE.CanvasTexture {
    if (this.cache.has('stone')) return this.cache.get('stone')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const stoneColors = ['#7c7c7c', '#727272', '#868686', '#696969', '#919191'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const rand = Math.random();
          let color = stoneColors[Math.floor(Math.random() * stoneColors.length)];
          if (rand > 0.94) color = '#a3a3a3'; // mineral highlight
          else if (rand < 0.06) color = '#545454'; // crack
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Cobblestone mortar contours
      ctx.fillStyle = 'rgba(40,40,40,0.35)';
      ctx.fillRect(0, 16, 32, 1);
      ctx.fillRect(16, 0, 1, 16);
      ctx.fillRect(8, 16, 1, 16);
    });

    this.cache.set('stone', tex);
    return tex;
  }

  /**
   * 6. Snow Block: Pure crystalline snowy white with gentle blue glints
   */
  public static getSnow(): THREE.CanvasTexture {
    if (this.cache.has('snow')) return this.cache.get('snow')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const snowColors = ['#f4f8fb', '#ebf2f8', '#ffffff', '#e2ecf5', '#dbe7f2'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const rand = Math.random();
          let color = snowColors[Math.floor(Math.random() * snowColors.length)];
          if (rand > 0.96) color = '#ffffff'; // sparkle
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    this.cache.set('snow', tex);
    return tex;
  }

  /**
   * 7. Cherry Blossom Wood Log (Side): Japanese Sakura dark bark with gentle grain
   */
  public static getCherryLogSide(): THREE.CanvasTexture {
    if (this.cache.has('cherry_log_side')) return this.cache.get('cherry_log_side')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const barkColors = ['#442327', '#3a1e21', '#4d292e', '#32181b', '#573036'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const colIdx = Math.floor(Math.random() * barkColors.length);
          ctx.fillStyle = barkColors[colIdx];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Vertical bark grooves
      ctx.fillStyle = 'rgba(20, 8, 10, 0.4)';
      for (let i = 4; i < 32; i += 7) {
        ctx.fillRect(i, 0, 1, 32);
      }
    });

    this.cache.set('cherry_log_side', tex);
    return tex;
  }

  /**
   * 8. Cherry Blossom Wood Log (Top/Bottom): Concentric wood rings with pinkish heartwood
   */
  public static getCherryLogTop(): THREE.CanvasTexture {
    if (this.cache.has('cherry_log_top')) return this.cache.get('cherry_log_top')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const cx = 15.5;
      const cy = 15.5;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > 14.5) {
            ctx.fillStyle = '#442327'; // outer bark
          } else {
            const ring = Math.floor(dist * 0.7) % 2;
            ctx.fillStyle = ring === 0 ? '#b6697a' : '#c9788a'; // pink heartwood rings
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    this.cache.set('cherry_log_top', tex);
    return tex;
  }

  /**
   * 9. Cherry Blossom Leaves: Dense tiny 4-petal pink flower blossoms (Authentic Minecraft 1.20)
   */
  public static getCherryLeaves(): THREE.CanvasTexture {
    if (this.cache.has('cherry_leaves')) return this.cache.get('cherry_leaves')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      // Pink base foliage
      const baseColors = ['#f497af', '#ea8aa8', '#f28ba6', '#dd7894'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = baseColors[Math.floor(Math.random() * baseColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw clusters of tiny 4-petal cherry flowers
      const flowerPetal = '#ffbdd0';
      const flowerHighlight = '#ffffff';
      const flowerShadow = '#d46581';
      const leafGreen = '#65aa23';

      for (let i = 0; i < 38; i++) {
        const cx = Math.floor(Math.random() * 28) + 2;
        const cy = Math.floor(Math.random() * 28) + 2;

        // 4 petals: top, bottom, left, right
        ctx.fillStyle = flowerPetal;
        ctx.fillRect(cx - 1, cy, 1, 1);
        ctx.fillRect(cx + 1, cy, 1, 1);
        ctx.fillRect(cx, cy - 1, 1, 1);
        ctx.fillRect(cx, cy + 1, 1, 1);

        // Center highlight
        ctx.fillStyle = flowerHighlight;
        ctx.fillRect(cx, cy, 1, 1);

        // Petal edge shadow
        ctx.fillStyle = flowerShadow;
        ctx.fillRect(cx - 1, cy + 1, 1, 1);

        // Little green leaf sprig
        if (Math.random() > 0.5) {
          ctx.fillStyle = leafGreen;
          ctx.fillRect(cx + 1, cy - 1, 1, 1);
        }
      }

      // Occasional transparent cutouts for sunlight filtering through
      for (let i = 0; i < 16; i++) {
        const rx = Math.floor(Math.random() * 30);
        const ry = Math.floor(Math.random() * 30);
        ctx.clearRect(rx, ry, 2, 2);
      }
    });

    this.cache.set('cherry_leaves', tex);
    return tex;
  }

  /**
   * 10. Oak Leaves: Lush green foliage blocks
   */
  public static getOakLeaves(): THREE.CanvasTexture {
    if (this.cache.has('oak_leaves')) return this.cache.get('oak_leaves')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      ctx.clearRect(0, 0, 32, 32);
      const greenColors = ['#388e3c', '#2e7d32', '#43a047', '#1b5e20', '#4caf50'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (Math.random() > 0.16) {
            ctx.fillStyle = greenColors[Math.floor(Math.random() * greenColors.length)];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    this.cache.set('oak_leaves', tex);
    return tex;
  }

  /**
   * 11. Oak Log (Side & Top)
   */
  public static getOakLogSide(): THREE.CanvasTexture {
    if (this.cache.has('oak_log_side')) return this.cache.get('oak_log_side')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const colors = ['#6e5536', '#60482d', '#795f3e', '#533c23'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = 'rgba(30,20,10,0.35)';
      for (let i = 5; i < 32; i += 8) ctx.fillRect(i, 0, 1, 32);
    });

    this.cache.set('oak_log_side', tex);
    return tex;
  }

  public static getOakLogTop(): THREE.CanvasTexture {
    if (this.cache.has('oak_log_top')) return this.cache.get('oak_log_top')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const cx = 15.5, cy = 15.5;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > 14.5) ctx.fillStyle = '#60482d';
          else {
            const ring = Math.floor(dist * 0.7) % 2;
            ctx.fillStyle = ring === 0 ? '#b89464' : '#a38153';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    this.cache.set('oak_log_top', tex);
    return tex;
  }

  /**
   * 12. Japanese Torii Crimson Lacquer Block
   */
  public static getToriiCrimson(): THREE.CanvasTexture {
    if (this.cache.has('torii_crimson')) return this.cache.get('torii_crimson')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const reds = ['#bc2e25', '#cf342b', '#aa271f', '#d94138'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = reds[Math.floor(Math.random() * reds.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Crisp block border
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
    });

    this.cache.set('torii_crimson', tex);
    return tex;
  }

  /**
   * 13. Dark Slate Roof Tile Block
   */
  public static getDarkSlate(): THREE.CanvasTexture {
    if (this.cache.has('dark_slate')) return this.cache.get('dark_slate')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const darks = ['#1f2429', '#272d33', '#191d21', '#30373e'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = darks[Math.floor(Math.random() * darks.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Tile lines
      ctx.fillStyle = '#14171a';
      ctx.fillRect(0, 15, 32, 2);
    });

    this.cache.set('dark_slate', tex);
    return tex;
  }

  /**
   * 14. Stone Bricks (for bridges and shrines)
   */
  public static getStoneBricks(): THREE.CanvasTexture {
    if (this.cache.has('stone_bricks')) return this.cache.get('stone_bricks')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const grays = ['#757575', '#808080', '#6b6b6b', '#8a8a8a'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = grays[Math.floor(Math.random() * grays.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Brick borders
      ctx.fillStyle = '#4d4d4d';
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(15, 0, 2, 15);
      ctx.fillRect(7, 16, 2, 16);
      ctx.fillRect(23, 16, 2, 16);
    });

    this.cache.set('stone_bricks', tex);
    return tex;
  }

  /**
   * 15. Minecraft Beacon / Prismarine Core Texture
   */
  public static getBeaconTexture(): THREE.CanvasTexture {
    if (this.cache.has('beacon_tex')) return this.cache.get('beacon_tex')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      // Obsidian border
      ctx.fillStyle = '#16111f';
      ctx.fillRect(0, 0, 32, 32);

      // Cyan crystal core
      const cyans = ['#4ef2bb', '#38d9a9', '#63e6be', '#20c997', '#96f2d7'];
      for (let y = 4; y < 28; y++) {
        for (let x = 4; x < 28; x++) {
          ctx.fillStyle = cyans[Math.floor(Math.random() * cyans.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Glowing white inner core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 12, 8, 8);
    });

    this.cache.set('beacon_tex', tex);
    return tex;
  }

  /**
   * 16. Minecraft Lantern / Soul Torch Texture
   */
  public static getLanternTexture(): THREE.CanvasTexture {
    if (this.cache.has('lantern_tex')) return this.cache.get('lantern_tex')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      // Iron frame
      ctx.fillStyle = '#323639';
      ctx.fillRect(0, 0, 32, 32);

      // Glowing flame inside
      const flameColors = ['#ff922b', '#ffa94d', '#ffd43b', '#ffe066', '#fff3bf'];
      for (let y = 6; y < 26; y++) {
        for (let x = 6; x < 26; x++) {
          ctx.fillStyle = flameColors[Math.floor(Math.random() * flameColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Iron crossbars
      ctx.fillStyle = '#212529';
      ctx.fillRect(14, 6, 4, 20);
      ctx.fillRect(6, 14, 20, 4);
    });

    this.cache.set('lantern_tex', tex);
    return tex;
  }

  /**
   * 17. Flower Texture (Poppy / Sakura Flower / Dandelion)
   */
  public static getFlowerTexture(type: 'poppy' | 'dandelion' | 'orchid' | 'cherry_petal' | 'tall_grass'): THREE.CanvasTexture {
    const key = `flower_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const tex = this.createTexture(32, 32, (ctx) => {
      ctx.clearRect(0, 0, 32, 32);

      if (type === 'cherry_petal') {
        // Authentic Minecraft 1.20 Pink Petal Flower on grass (as seen in photo)
        // Little green stems
        ctx.fillStyle = '#65aa23';
        ctx.fillRect(8, 20, 2, 12);
        ctx.fillRect(20, 22, 2, 10);

        // Flower 1 (Left)
        ctx.fillStyle = '#fca5bb';
        ctx.fillRect(5, 16, 8, 3);
        ctx.fillRect(7, 14, 4, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 17, 2, 2);

        // Flower 2 (Right)
        ctx.fillStyle = '#f78da7';
        ctx.fillRect(17, 19, 8, 3);
        ctx.fillRect(19, 17, 4, 7);
        ctx.fillStyle = '#ffccd5';
        ctx.fillRect(20, 20, 2, 2);
      } else if (type === 'tall_grass') {
        // Minecraft tall grass blades
        ctx.fillStyle = '#77c42b';
        ctx.fillRect(12, 10, 2, 22);
        ctx.fillRect(15, 6, 2, 26);
        ctx.fillRect(18, 14, 2, 18);
        ctx.fillStyle = '#8ce034';
        ctx.fillRect(16, 6, 1, 14);
      } else {
        // Green stem
        ctx.fillStyle = '#4f9429';
        ctx.fillRect(15, 12, 2, 20);
        ctx.fillRect(13, 20, 2, 4);
        ctx.fillRect(17, 24, 2, 3);

        if (type === 'poppy') {
          ctx.fillStyle = '#e03131';
          ctx.fillRect(11, 4, 10, 10);
          ctx.fillStyle = '#ff6b6b';
          ctx.fillRect(13, 6, 6, 6);
          ctx.fillStyle = '#212529';
          ctx.fillRect(15, 8, 2, 2);
        } else if (type === 'dandelion') {
          ctx.fillStyle = '#fcc419';
          ctx.fillRect(12, 6, 8, 8);
          ctx.fillStyle = '#ffe066';
          ctx.fillRect(14, 8, 4, 4);
        } else {
          ctx.fillStyle = '#339af0';
          ctx.fillRect(10, 4, 12, 10);
          ctx.fillStyle = '#74c0fc';
          ctx.fillRect(13, 6, 6, 6);
        }
      }
    });

    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 18. Minecraft Square Sun Texture
   */
  public static getSunTexture(): THREE.CanvasTexture {
    if (this.cache.has('sun_tex')) return this.cache.get('sun_tex')!;

    const tex = this.createTexture(64, 64, (ctx) => {
      ctx.clearRect(0, 0, 64, 64);
      // Outer golden halo
      ctx.fillStyle = 'rgba(255, 200, 70, 0.35)';
      ctx.fillRect(0, 0, 64, 64);

      // Main square sun body
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(12, 12, 40, 40);

      // Bright incandescent core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 20, 24, 24);
    });

    this.cache.set('sun_tex', tex);
    return tex;
  }

  /**
   * 19. Minecraft Square Moon Texture
   */
  public static getMoonTexture(): THREE.CanvasTexture {
    if (this.cache.has('moon_tex')) return this.cache.get('moon_tex')!;

    const tex = this.createTexture(64, 64, (ctx) => {
      ctx.clearRect(0, 0, 64, 64);
      // Outer soft blue halo
      ctx.fillStyle = 'rgba(180, 215, 255, 0.25)';
      ctx.fillRect(0, 0, 64, 64);

      // Moon body
      ctx.fillStyle = '#e7f5ff';
      ctx.fillRect(12, 12, 40, 40);

      // Craters
      ctx.fillStyle = '#a5d8ff';
      ctx.fillRect(18, 18, 10, 8);
      ctx.fillRect(34, 22, 12, 12);
      ctx.fillRect(22, 34, 8, 10);
    });

    this.cache.set('moon_tex', tex);
    return tex;
  }

  /**
   * 20. Minecraft 1.20 Pink Petal Carpet (Thảm Cánh Hoa Anh Đào Rơi Trên Cỏ)
   */
  public static getPinkPetalCarpet(): THREE.CanvasTexture {
    if (this.cache.has('petal_carpet')) return this.cache.get('petal_carpet')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      ctx.clearRect(0, 0, 32, 32);
      const pinks = ['#fbbad0', '#f8a5c2', '#fccde0', '#ffccd5', '#ffffff'];

      // Draw scattered flower petals
      const petalPositions = [
        { x: 4, y: 5 }, { x: 8, y: 7 }, { x: 5, y: 9 },
        { x: 18, y: 4 }, { x: 22, y: 8 },
        { x: 12, y: 16 }, { x: 15, y: 19 }, { x: 9, y: 22 },
        { x: 24, y: 18 }, { x: 27, y: 22 }, { x: 22, y: 25 },
        { x: 4, y: 26 }, { x: 8, y: 28 }, { x: 16, y: 27 }
      ];

      petalPositions.forEach((pt) => {
        const col = pinks[Math.floor(Math.random() * pinks.length)];
        ctx.fillStyle = col;
        ctx.fillRect(pt.x, pt.y, 2, 2);
        ctx.fillStyle = '#ff758f'; // petal heart
        ctx.fillRect(pt.x + 1, pt.y, 1, 1);
      });
    });

    this.cache.set('petal_carpet', tex);
    return tex;
  }

  /**
   * 21. Cherry Blossom Wood Planks (Sàn Gỗ Anh Đào Hồng Nhạt)
   */
  public static getCherryPlanks(): THREE.CanvasTexture {
    if (this.cache.has('cherry_planks')) return this.cache.get('cherry_planks')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const plankColors = ['#e8a9b7', '#df9ea9', '#ebb2bf', '#d4919e'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = plankColors[Math.floor(Math.random() * plankColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Plank horizontal borders
      ctx.fillStyle = 'rgba(120, 50, 65, 0.45)';
      ctx.fillRect(0, 7, 32, 1);
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(0, 23, 32, 1);
      ctx.fillRect(0, 31, 32, 1);
      // Vertical nail / plank seams
      ctx.fillRect(16, 0, 1, 7);
      ctx.fillRect(8, 8, 1, 7);
      ctx.fillRect(24, 16, 1, 7);
      ctx.fillRect(12, 24, 1, 7);
    });

    this.cache.set('cherry_planks', tex);
    return tex;
  }

  /**
   * 22. Japanese Tatami Straw Mat (Chiếu Tatami)
   */
  public static getTatami(): THREE.CanvasTexture {
    if (this.cache.has('tatami')) return this.cache.get('tatami')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      const strawColors = ['#c8be87', '#bfb57e', '#d2c892', '#b7ad75'];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          ctx.fillStyle = strawColors[Math.floor(Math.random() * strawColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Straw weave lines
      ctx.fillStyle = 'rgba(90, 80, 40, 0.25)';
      for (let y = 0; y < 32; y += 2) {
        ctx.fillRect(0, y, 32, 1);
      }
      // Dark fabric borders on left & right
      ctx.fillStyle = '#2b2d42';
      ctx.fillRect(0, 0, 3, 32);
      ctx.fillRect(29, 0, 3, 32);
    });

    this.cache.set('tatami', tex);
    return tex;
  }

  /**
   * 23. Japanese Shoji Paper Screen (Vách Giấy Shoji Gỗ)
   */
  public static getShoji(): THREE.CanvasTexture {
    if (this.cache.has('shoji')) return this.cache.get('shoji')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      // Translucent rice paper background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 32, 32);

      // Wooden grid lines
      ctx.fillStyle = '#442327';
      ctx.fillRect(0, 0, 32, 2);
      ctx.fillRect(0, 30, 32, 2);
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillRect(30, 0, 2, 32);

      // Inner lattice
      ctx.fillRect(0, 10, 32, 1);
      ctx.fillRect(0, 20, 32, 1);
      ctx.fillRect(10, 0, 1, 32);
      ctx.fillRect(20, 0, 1, 32);
    });

    this.cache.set('shoji', tex);
    return tex;
  }

  /**
   * 24. Lotus Pad & Flower (Hoa Sen & Lá Sen Hồ Zen)
   */
  public static getLotus(): THREE.CanvasTexture {
    if (this.cache.has('lotus')) return this.cache.get('lotus')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      ctx.clearRect(0, 0, 32, 32);

      // Green lily pad
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(16, 16, 13, 0, Math.PI * 1.85); // pad with notch
      ctx.lineTo(16, 16);
      ctx.fill();

      // Pad veins
      ctx.strokeStyle = '#40916c';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Blooming Lotus flower in center
      ctx.fillStyle = '#ff758f';
      ctx.fillRect(13, 13, 6, 6);
      ctx.fillStyle = '#ffccd5';
      ctx.fillRect(14, 14, 4, 4);
      ctx.fillStyle = '#ffd166'; // yellow stamen
      ctx.fillRect(15, 15, 2, 2);
    });

    this.cache.set('lotus', tex);
    return tex;
  }

  /**
   * 25. High-Definition Falling Sakura Petal Sprite
   */
  public static getPetalParticle(): THREE.CanvasTexture {
    if (this.cache.has('petal_particle')) return this.cache.get('petal_particle')!;

    const tex = this.createTexture(32, 32, (ctx) => {
      ctx.clearRect(0, 0, 32, 32);

      // Stylized curved cherry blossom petal
      const grad = ctx.createRadialGradient(16, 12, 2, 16, 16, 14);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffb3c6');
      grad.addColorStop(0.7, '#ff758f');
      grad.addColorStop(1, 'rgba(255, 117, 143, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(16, 16, 10, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Delicate notch at top of petal
      ctx.clearRect(14, 2, 4, 4);
    });

    this.cache.set('petal_particle', tex);
    return tex;
  }
}
