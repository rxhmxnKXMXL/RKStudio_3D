/**
 * Advanced Photorealistic 3D Scene Controller for Machinery & Vehicle Customizer
 * Features:
 * 1. PMREM Studio HDR Environment & Dynamic Radiance Reflections
 * 2. Realistic Ground Contact Shadow Plane (Radial Ambient Occlusion)
 * 3. 4-Point Commercial Automotive Studio Lighting (Key, Fill, Rim/Kicker, Undercarriage Bounce)
 * 4. ACESFilmicToneMapping with sRGB Color Encoding
 * 5. Smooth Damped OrbitControls & Camera View Presets
 */

class SceneController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pmremGenerator = null;
    this.currentModelGroup = null;
    this.contactShadowMesh = null;
    this.lights = {};
    this.isAutoRotating = false;
    this.gridHelper = null;
    this.onPartSelectedCallback = null;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a0d14'); // Premium deep charcoal studio background
    this.scene.fog = new THREE.FogExp2('#0a0d14', 0.025);

    // 2. Camera Setup (Calibrated 45° FOV Industrial Lens)
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(6.8, 3.8, 7.4);

    // 3. WebGL Renderer with High-End Color Pipeline
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Crisp Retina/4K
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ultra-soft shadows
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinema-grade color curve
    this.renderer.toneMappingExposure = 1.32;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls Setup with Smooth Damping
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.4, 0);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent going below ground
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 25.0;

    // 5. PMREM Studio HDR Environment Generation
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.setupStudioHDREnvironment('studio');

    // 6. Setup Multi-Point Studio Lighting
    this.setupStudioLighting();

    // 7. Ground Grid & Radial Contact Shadow Plane
    this.setupGroundElements();

    // 8. Main Model Container Group
    this.currentModelGroup = new THREE.Group();
    this.scene.add(this.currentModelGroup);

    // 9. Raycasting for Direct 3D Part Selection
    this.setupRaycasting();

    // 10. Resize Listener & Render Loop
    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  /* =========================================================================
     PROCEDURAL 32-BIT STUDIO HDR ENVIRONMENT GENERATOR
     ========================================================================= */
  setupStudioHDREnvironment(preset = 'studio') {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');

    if (preset === 'sunset') {
      // Warm golden hour outdoor sky
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.4, '#ea580c');
      grad.addColorStop(0.7, '#facc15');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, canvas.height);

      // Bright Sun Disc
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(size * 0.75, canvas.height * 0.45, 55, 0, Math.PI * 2);
      ctx.fill();
    } else if (preset === 'cyberpunk') {
      // Neon Cyberpunk Studio
      ctx.fillStyle = '#05050a';
      ctx.fillRect(0, 0, size, canvas.height);

      // Neon Cyan Softbox
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(size * 0.1, 40, size * 0.35, 120);

      // Neon Magenta Softbox
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(size * 0.55, 40, size * 0.35, 120);
    } else if (preset === 'light') {
      // Clean White Commercial Studio
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.7, '#cbd5e1');
      grad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, canvas.height);
    } else {
      // Standard Automotive Studio HDR (Overhead Softbox Banks)
      ctx.fillStyle = '#11141c';
      ctx.fillRect(0, 0, size, canvas.height);

      // Main Top Softbox Bank (Bright White Rectangular Diffuser)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(size * 0.25, 20, size * 0.5, 120, 16);
      ctx.fill();

      // Front Fill Softbox
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(size * 0.1, 160, size * 0.25, 90, 12);
      ctx.fill();

      // Rim Reflection Strip
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(size * 0.65, 160, size * 0.25, 90, 12);
      ctx.fill();

      // Floor Horizon Line
      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, canvas.height * 0.75, size, canvas.height * 0.25);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
    this.scene.environment = envMap;
    texture.dispose();
  }

  /* =========================================================================
     4-POINT COMMERCIAL AUTOMOTIVE LIGHTING
     ========================================================================= */
  setupStudioLighting() {
    // 1. Key Light (Top-Front-Right Main Specular Sun)
    const keyLight = new THREE.DirectionalLight('#fffdf5', 1.8);
    keyLight.position.set(6.5, 11.0, 6.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -6.5;
    keyLight.shadow.camera.right = 6.5;
    keyLight.shadow.camera.top = 6.5;
    keyLight.shadow.camera.bottom = -6.5;
    keyLight.shadow.bias = -0.00012;
    keyLight.shadow.radius = 2.5; // Soft shadow edges
    this.scene.add(keyLight);
    this.lights.key = keyLight;

    // 2. Fill Light (Front-Left Cool Softbox)
    const fillLight = new THREE.DirectionalLight('#e0f2fe', 0.95);
    fillLight.position.set(-6.5, 6.0, 4.5);
    this.scene.add(fillLight);
    this.lights.fill = fillLight;

    // 3. Rim / Kicker Light (Rear-Right Edge Definition)
    const rimLight = new THREE.DirectionalLight('#f8fafc', 1.4);
    rimLight.position.set(4.0, 7.0, -8.0);
    this.scene.add(rimLight);
    this.lights.rim = rimLight;

    // 4. Undercarriage Bounce Light (Prevents black shadows under chassis)
    const hemiLight = new THREE.HemisphereLight('#f1f5f9', '#0f172a', 0.65);
    this.scene.add(hemiLight);
    this.lights.hemi = hemiLight;
  }

  /* =========================================================================
     GROUND ELEMENTS & RADIAL AMBIENT OCCLUSION CONTACT SHADOW
     ========================================================================= */
  setupGroundElements() {
    // A. Ground Grid
    this.gridHelper = new THREE.GridHelper(24, 24, '#38bdf8', '#1e293b');
    this.gridHelper.position.y = 0.001;
    this.scene.add(this.gridHelper);

    // B. Procedural Radial Contact Shadow Texture
    const shadowSize = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = shadowSize;
    canvas.height = shadowSize;
    const ctx = canvas.getContext('2d');

    // Deep Elliptical Shadow directly under chassis & outriggers
    const grad = ctx.createRadialGradient(
      shadowSize / 2, shadowSize / 2, 40,
      shadowSize / 2, shadowSize / 2, shadowSize / 2.1
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(shadowSize / 2, shadowSize / 2, shadowSize * 0.42, shadowSize * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    const shadowTexture = new THREE.CanvasTexture(canvas);

    // C. Ground Contact Shadow Mesh Plane
    const shadowGeo = new THREE.PlaneGeometry(12.0, 9.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.y = 0.004; // Flush at ground
    this.scene.add(this.contactShadowMesh);
  }

  /* =========================================================================
     RAYCASTING FOR 3D DIRECT PART CLICK SELECTION
     ========================================================================= */
  setupRaycasting() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downTime = 0;

    this.container.addEventListener('pointerdown', () => {
      downTime = performance.now();
    });

    this.container.addEventListener('pointerup', (e) => {
      // Ignore click if it was a camera drag (> 220ms)
      if (performance.now() - downTime > 220) return;

      const rect = this.container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.currentModelGroup.children, true);

      if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;
        while (clickedMesh && !clickedMesh.userData.partName && clickedMesh.parent && clickedMesh.parent !== this.currentModelGroup) {
          clickedMesh = clickedMesh.parent;
        }

        if (clickedMesh && this.onPartSelectedCallback) {
          this.onPartSelectedCallback(clickedMesh);
        }
      }
    });
  }

  /* =========================================================================
     CAMERA & ENVIRONMENT PRESETS
     ========================================================================= */
  setCameraPreset(preset) {
    const target = new THREE.Vector3(0, 1.4, 0);
    let camPos;

    switch (preset) {
      case 'front':
        camPos = new THREE.Vector3(9.5, 1.8, 0);
        break;
      case 'side':
        camPos = new THREE.Vector3(0, 2.0, 9.5);
        break;
      case 'top':
        camPos = new THREE.Vector3(0.01, 14.0, 0.01);
        break;
      case 'iso':
      default:
        camPos = new THREE.Vector3(6.8, 3.8, 7.4);
        break;
    }

    this.animateCameraTo(camPos, target);
  }

  animateCameraTo(newPos, newTarget, duration = 650) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, newPos, ease);
      this.controls.target.lerpVectors(startTarget, newTarget, ease);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  setEnvironmentPreset(preset) {
    this.setupStudioHDREnvironment(preset);

    if (preset === 'sunset') {
      this.scene.background.set('#1e1b2e');
      this.scene.fog.color.set('#1e1b2e');
      this.lights.key.color.set('#fed7aa');
      this.lights.key.intensity = 2.2;
      this.lights.fill.color.set('#ea580c');
      this.renderer.toneMappingExposure = 1.4;
    } else if (preset === 'cyberpunk') {
      this.scene.background.set('#060814');
      this.scene.fog.color.set('#060814');
      this.lights.key.color.set('#06b6d4');
      this.lights.fill.color.set('#ec4899');
      this.renderer.toneMappingExposure = 1.45;
    } else if (preset === 'light') {
      this.scene.background.set('#f8fafc');
      this.scene.fog.color.set('#f8fafc');
      this.lights.key.color.set('#ffffff');
      this.lights.key.intensity = 1.6;
      this.renderer.toneMappingExposure = 1.15;
    } else {
      // Neutral Clean Studio
      this.scene.background.set('#0a0d14');
      this.scene.fog.color.set('#0a0d14');
      this.lights.key.color.set('#fffdf5');
      this.lights.key.intensity = 1.8;
      this.lights.fill.color.set('#e0f2fe');
      this.renderer.toneMappingExposure = 1.32;
    }
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    this.controls.autoRotate = this.isAutoRotating;
    this.controls.autoRotateSpeed = 1.6;
    return this.isAutoRotating;
  }

  toggleGrid() {
    if (this.gridHelper) {
      this.gridHelper.visible = !this.gridHelper.visible;
      return this.gridHelper.visible;
    }
    return false;
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.SceneController = SceneController;
