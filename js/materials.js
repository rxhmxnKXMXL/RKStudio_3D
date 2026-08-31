/**
 * Advanced Physically Based Rendering (PBR) Materials & Shader Engine
 * Features:
 * 1. Two-Stage Automotive Clearcoat Enamel (MeshPhysicalMaterial)
 * 2. Precision Hydraulic Mirror Chrome
 * 3. Bump-Mapped Aluminum Diamond Treadplate & Toolboxes
 * 4. High-Grip Radial Tire Tread Bump Mapping
 * 5. High-Voltage 1000V Insulated Translucent Fiberglass
 * 6. Reflective Caution Chevrons & Fleet Typography
 */

class MaterialManager {
  constructor() {
    this.textureCache = {};
    this.canvasGenerators = {
      diamond: this.generateDiamondPlateTexture.bind(this),
      hazard: this.generateHazardTexture.bind(this),
      tire: this.generateTireTreadTexture.bind(this),
      toolbox: this.generateToolboxTexture.bind(this),
      carbon: this.generateCarbonTexture.bind(this),
    };
  }

  getOrCreateTexture(name) {
    if (this.textureCache[name]) return this.textureCache[name];
    if (this.canvasGenerators[name]) {
      const tex = this.canvasGenerators[name]();
      this.textureCache[name] = tex;
      return tex;
    }
    return null;
  }

  createMaterial(preset, colorHex = '#f8fafc', customProps = {}) {
    const color = new THREE.Color(colorHex);

    switch (preset) {
      case 'glossy': // Two-Stage Automotive / Industrial Fleet Enamel
        return new THREE.MeshPhysicalMaterial({
          color: color,
          roughness: 0.14,
          metalness: 0.08,
          clearcoat: 1.0, // High-gloss clear lacquer layer
          clearcoatRoughness: 0.04,
          reflectivity: 0.95,
          envMapIntensity: 1.6,
          ...customProps,
        });

      case 'matte': // Heavy-Duty Powder Coat
        return new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.78,
          metalness: 0.15,
          envMapIntensity: 0.8,
          ...customProps,
        });

      case 'diamond': { // Heavy Aluminum Diamond Plate
        const tex = this.getOrCreateTexture('diamond');
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#94a3b8'),
          bumpMap: tex,
          bumpScale: 0.08,
          roughness: 0.28,
          metalness: 0.88,
          envMapIntensity: 1.8,
          ...customProps,
        });
      }

      case 'hazard': { // Reflective Safety Yellow / Black Chevrons
        const tex = this.getOrCreateTexture('hazard');
        return new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.35,
          metalness: 0.1,
          envMapIntensity: 1.2,
          ...customProps,
        });
      }

      case 'brushed': // Galvanized Structural Steel
        return new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.38,
          metalness: 0.85,
          envMapIntensity: 1.5,
          ...customProps,
        });

      case 'chrome': // Precision Hydraulic Chrome Cylinder Rods
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ffffff'),
          roughness: 0.02,
          metalness: 0.98,
          envMapIntensity: 2.5, // Crisp HDR reflection
          ...customProps,
        });

      case 'tire': { // Deep Black Radial Heavy Rubber Tire
        const tex = this.getOrCreateTexture('tire');
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#141416'),
          bumpMap: tex,
          bumpScale: 0.12,
          roughness: 0.84,
          metalness: 0.05,
          envMapIntensity: 0.4,
          ...customProps,
        });
      }

      case 'glass': // Commercial Tinted Automotive Cabin Glass
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#0f172a'),
          transmission: 0.88, // Realistic optical transparency
          opacity: 1.0,
          transparent: true,
          roughness: 0.03,
          ior: 1.52,
          thickness: 0.5,
          reflectivity: 0.9,
          envMapIntensity: 2.0,
          ...customProps,
        });

      case 'fiberglass': // 1000V Rated Insulated Translucent High-Voltage Bucket
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#f8fafc'),
          roughness: 0.22,
          metalness: 0.02,
          clearcoat: 0.6,
          transmission: 0.15,
          thickness: 1.2,
          envMapIntensity: 1.4,
          ...customProps,
        });

      case 'gold': // Reflective High-Vis Caution Gold
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ca8a04'),
          roughness: 0.18,
          metalness: 0.75,
          envMapIntensity: 1.8,
          ...customProps,
        });

      case 'toolbox': { // Utility Storage Box Door Texture
        const tex = this.getOrCreateTexture('toolbox');
        return new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.25,
          metalness: 0.8,
          envMapIntensity: 1.5,
          ...customProps,
        });
      }

      default:
        return new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.25,
          metalness: 0.1,
          ...customProps,
        });
    }
  }

  /* =========================================================================
     PROCEDURAL TEXTURE CANVASES
     ========================================================================= */
  generateDiamondPlateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < 512; y += 32) {
      for (let x = 0; x < 512; x += 32) {
        ctx.save();
        ctx.translate(x + 16, y + 16);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(x + 32, y + 32);
        ctx.rotate(-Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  generateHazardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#facc15'; // High-Vis Yellow
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#18181b'; // Deep Black
    const stripeWidth = 64;
    for (let x = -512; x < 1024; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - 512, 512);
      ctx.lineTo(x - 512, 512);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }

  generateTireTreadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#202020';
    for (let y = 0; y < 512; y += 18) {
      ctx.fillRect(0, y, 512, 6);
    }

    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < 512; y += 36) {
      for (let x = 0; x < 512; x += 40) {
        ctx.fillRect(x + 4, y + 4, 28, 10);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 8);
    return texture;
  }

  generateToolboxTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 256);

    // Beveled Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 244);

    // Chrome T-Handle Latch
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(230, 110, 52, 36);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(230, 110, 52, 36);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  generateCarbonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  applyLogoTexture(material, imageSource) {
    if (!material) return;
    const tex = new THREE.Texture(imageSource);
    tex.needsUpdate = true;
    material.map = tex;
    material.needsUpdate = true;
  }

  applyEngravedText(material, text) {
    if (!material || !text) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = material.color ? '#' + material.color.getHexString() : '#ffffff';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 72px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;
    material.needsUpdate = true;
  }
}

window.MaterialManager = MaterialManager;
