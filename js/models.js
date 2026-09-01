/**
 * MANDROSSA & ENMAX OFFICIAL 5-PROTOTYPE 3D ENGINE
 * High-Fidelity PBR Rendering, Automatic Node Materialization & Kinematics
 */

class ModelManager {
  constructor(sceneController, materialManager) {
    this.sceneCtrl = sceneController;
    this.matMgr = materialManager;
    this.currentModelKey = 'emgd24';
    this.customizableParts = [];
    this.explodedParts = [];
    this.explosionProgress = 0;
    this.gltfLoader = new THREE.GLTFLoader();

    // Kinematic State & Pivot References
    this.kinematics = {
      slewDeg: 0,
      elevationDeg: 0,
      extensionPct: 0,
      jibDeg: 0,
      isAutoDemoRunning: false,
      pivots: {}
    };

    this.catalog = {
      emgd24: {
        name: 'ENMAX EMGD24 Negative Reach Platform (400kg)',
        shortName: 'EMGD24 (400kg)',
        file: 'assets/models/ENMAX_EMGD24_HD.glb',
        primaryColor: '#0284c7', // Vibrant DBKL Sky Blue / Cyan
        accentColor: '#38bdf8'
      },
      emgk24: {
        name: 'ENMAX EMGK24 Insulated Utility Skylift (1000V)',
        shortName: 'EMGK24 (1000V)',
        file: 'assets/models/ENMAX_EMGK24_HD.glb',
        primaryColor: '#ea580c', // TNB Utility Orange
        accentColor: '#f97316'
      },
      em160zb4: {
        name: 'ENMAX EM160ZB4 Knuckle Crane (8-Ton Hook)',
        shortName: 'EM160ZB4 (8-Ton Crane)',
        file: 'assets/models/ENMAX_EM160ZB4_HD.glb',
        primaryColor: '#dc2626', // Crimson Red
        accentColor: '#ef4444'
      },
      embl10a: {
        name: 'ENMAX EMBL-10A Trailer Articulating Spider Boom',
        shortName: 'EMBL-10A Trailer Boom',
        file: 'assets/models/ENMAX_EMBL10A_HD.glb',
        primaryColor: '#eab308', // High-Vis Industrial Yellow
        accentColor: '#facc15'
      },
      emgk23: {
        name: 'ENMAX EMGK23 Heavy Duty Platform (800kg)',
        shortName: 'EMGK23 (800kg)',
        file: 'assets/models/ENMAX_EMGK23_HD.glb',
        primaryColor: '#f97316', // Heavy Duty Orange
        accentColor: '#fb923c'
      }
    };
  }

  clearModel(onComplete) {
    this.currentModelKey = null;
    const group = this.sceneCtrl.currentModelGroup;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    this.customizableParts = [];
    this.explodedParts = [];
    this.explosionProgress = 0;
    this.kinematics.pivots = {};

    const emptyOverlay = document.getElementById('empty-state-overlay');
    if (emptyOverlay) emptyOverlay.classList.remove('hidden');

    const clearBtn = document.getElementById('btn-clear-scene');
    if (clearBtn) clearBtn.style.display = 'none';

    if (this.sceneCtrl && this.sceneCtrl.controls) {
      this.sceneCtrl.controls.target.set(0, 1.2, 0);
      this.sceneCtrl.camera.position.set(7.5, 4.0, 8.0);
      this.sceneCtrl.controls.update();
    }

    if (onComplete) onComplete([]);
  }

  loadModel(modelKey, onComplete) {
    if (!modelKey || modelKey === 'empty') {
      this.clearModel(onComplete);
      return;
    }

    const item = this.catalog[modelKey];
    if (!item || !item.file) {
      console.warn('Model key not found:', modelKey);
      return;
    }

    this.currentModelKey = modelKey;
    const group = this.sceneCtrl.currentModelGroup;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    this.customizableParts = [];
    this.explodedParts = [];
    this.explosionProgress = 0;
    this.kinematics.pivots = {};

    const emptyOverlay = document.getElementById('empty-state-overlay');
    if (emptyOverlay) emptyOverlay.classList.add('hidden');

    const clearBtn = document.getElementById('btn-clear-scene');
    if (clearBtn) clearBtn.style.display = 'inline-flex';

    this.gltfLoader.load(
      item.file,
      (gltf) => {
        const loadedScene = gltf.scene || gltf.scenes[0];

        // 1. Compute Exact Bounding Box & Ground Alignment
        const box = new THREE.Box3().setFromObject(loadedScene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center on X and Z, and place tangent bottom at Y = 0.000 (ground floor)
        loadedScene.position.x = -center.x;
        loadedScene.position.y = -box.min.y;
        loadedScene.position.z = -center.z;

        const rootWrapper = new THREE.Group();
        rootWrapper.add(loadedScene);
        group.add(rootWrapper);

        // 2. Traverse Nodes & Setup PBR Materials & Kinematic Pivots
        this.setupModelHierarchy(loadedScene, item);

        this.captureOriginalPositions(rootWrapper);

        // 3. Reset Kinematics (Keep CAD Resting Geometry Assembled)
        this.setKinematics({
          slew: 0,
          elevation: 0,
          extension: 0,
          jib: 0
        });

        // 4. Position Camera
        if (this.sceneCtrl && this.sceneCtrl.controls) {
          const maxDim = Math.max(size.x, size.y, size.z);
          const camDist = Math.max(6.5, maxDim * 1.15);
          this.sceneCtrl.controls.target.set(0, size.y * 0.38, 0);
          this.sceneCtrl.camera.position.set(camDist * 0.85, camDist * 0.52, camDist * 0.95);
          this.sceneCtrl.controls.update();
        }

        if (onComplete) onComplete(this.customizableParts);
      },
      undefined,
      (err) => {
        console.error(`Error loading model ${item.file}:`, err);
        if (onComplete) onComplete([]);
      }
    );
  }

  setupModelHierarchy(loadedScene, catalogItem) {
    let partIndex = 1;

    loadedScene.traverse((child) => {
      // Get human-friendly node name from parent or mesh
      const rawName = (child.parent && child.parent.name && !child.parent.name.startsWith('world') && !child.parent.name.startsWith('Scene'))
        ? child.parent.name
        : (child.name || '');
      
      const lower = rawName.toLowerCase();

      // Find Kinematic Nodes
      if (lower === 'slew' || lower.includes('slew')) {
        this.kinematics.pivots.slew = child;
      } else if (lower === 'boom0' || lower.includes('boom0')) {
        this.kinematics.pivots.elevation = child;
      } else if (lower === 'boom1' || lower.includes('boom1')) {
        this.kinematics.pivots.extension = child;
      } else if (lower === 'boom2' || lower.includes('boom2')) {
        this.kinematics.pivots.jib = child;
      } else if (lower.includes('basket') || lower.includes('cage')) {
        if (!this.kinematics.pivots.basket) {
          this.kinematics.pivots.basket = child;
        }
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Determine Human-Friendly Part Name
        const partName = this.formatPartName(rawName, partIndex++);

        // Assign PBR Material based on component role
        const { preset, color } = this.determineComponentMaterial(rawName, catalogItem.primaryColor);
        const pbrMat = this.matMgr.createMaterial(preset, color);
        child.material = pbrMat;

        // Assign LEGO Exploded Vector based on node name and position
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        
        let explodeVec = new THREE.Vector3(0, 0, 0);
        if (lower.includes('cab')) {
          explodeVec = new THREE.Vector3(3.2, 0.5, 0);
        } else if (lower.includes('wheel') || lower.includes('rim')) {
          explodeVec = new THREE.Vector3(0, 0, worldPos.z > 0 ? 2.0 : -2.0);
        } else if (lower.includes('boom') || lower.includes('cable')) {
          explodeVec = new THREE.Vector3(0, 2.2, 0);
        } else if (lower.includes('basket') || lower.includes('rail')) {
          explodeVec = new THREE.Vector3(-3.0, 1.5, 0);
        } else if (lower.includes('leg') || lower.includes('pad') || lower.includes('cross')) {
          explodeVec = new THREE.Vector3(worldPos.x > 0 ? 1.5 : -1.5, 0, worldPos.z > 0 ? 2.2 : -2.2);
        } else if (lower.includes('ped') || lower.includes('slew')) {
          explodeVec = new THREE.Vector3(0, 1.2, 0);
        } else {
          explodeVec = new THREE.Vector3(0, 0.8, 0);
        }
        child.userData.explodeVector = explodeVec;

        this.registerPart(child, partName, preset, color);
      }
    });
  }

  formatPartName(rawName, fallbackIdx) {
    if (!rawName) return `Component ${fallbackIdx}`;
    const clean = rawName.toLowerCase();
    if (clean.includes('cab')) return 'Truck Cabin & Bodywork';
    if (clean.includes('chassis')) return 'Heavy Subframe Rails';
    if (clean.includes('body')) return 'Catwalk Deck & Body Panels';
    if (clean.includes('wheel')) return 'Commercial Truck Wheel';
    if (clean.includes('rim')) return 'Steel Wheel Rim (Chrome)';
    if (clean.includes('slew')) return 'Turntable Slew Pedestal';
    if (clean.includes('ped')) return 'Turntable Column Uprights';
    if (clean.includes('boom0')) return 'Telescopic Main Boom (Stage 1)';
    if (clean.includes('boom1')) return 'Inner Telescopic Boom (Stage 2)';
    if (clean.includes('boom2')) return 'Articulated Negative Jib (Stage 3)';
    if (clean.includes('boom3')) return 'Knuckle Crane Extension (Stage 4)';
    if (clean.includes('basket_floor')) return 'Platform Floor & Toe-Board';
    if (clean.includes('basket_back')) return 'Platform Safety Guard';
    if (clean.includes('rail')) return 'Tubular Safety Railings';
    if (clean.includes('basket')) return 'Work Platform Basket';
    if (clean.includes('cable')) return '8-Ton Crane Hoist Cable & Hook';
    if (clean.includes('leg')) return 'Hydraulic Outrigger Leg';
    if (clean.includes('pad')) return 'Outrigger Ground Swivel Pad';
    if (clean.includes('cross')) return 'Outrigger Crossbeam Beam';
    if (clean.includes('drawbar')) return 'Trailer Tow Drawbar Hitch';
    if (clean.includes('frame')) return 'Road Trailer Frame Chassis';
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }

  determineComponentMaterial(rawName, primaryColorHex) {
    if (!rawName) return { preset: 'glossy', color: primaryColorHex };
    const clean = rawName.toLowerCase();

    // 1. Cab & Body Panels -> High-Gloss Automotive Clearcoat (Primary Brand Color)
    if (clean.includes('cab') || clean.includes('body') || clean.includes('frame')) {
      return { preset: 'glossy', color: primaryColorHex };
    }
    // 2. Main Boom Sections -> Crisp Glossy White with High Specular
    if (clean.includes('boom0') || clean.includes('boom1')) {
      return { preset: 'glossy', color: '#f8fafc' };
    }
    // 3. Jib, Pedestal, Slew -> Accent Brand Color
    if (clean.includes('boom2') || clean.includes('boom3') || clean.includes('slew') || clean.includes('ped')) {
      return { preset: 'glossy', color: primaryColorHex };
    }
    // 4. Rubber Wheels -> Deep Textured Rubber
    if (clean.includes('wheel')) {
      return { preset: 'tire', color: '#141416' };
    }
    // 5. Rims & Cables -> Gleaming Hydraulic Chrome
    if (clean.includes('rim') || clean.includes('cable')) {
      return { preset: 'chrome', color: '#ffffff' };
    }
    // 6. Undercarriage Chassis, Legs, Pads -> Structural Dark Charcoal
    if (clean.includes('chassis') || clean.includes('leg') || clean.includes('pad') || clean.includes('cross')) {
      return { preset: 'matte', color: '#1e2430' };
    }
    // 7. Work Platform & Railings -> Brushed Aluminum / Galvanized Steel
    if (clean.includes('basket') || clean.includes('rail')) {
      return { preset: 'brushed', color: '#cbd5e1' };
    }
    return { preset: 'glossy', color: primaryColorHex };
  }

  /* =========================================================================
     5-AXIS FORWARD KINEMATICS MOTION CONTROLLER
     ========================================================================= */
  setKinematics({ slew, elevation, extension, jib }) {
    if (slew !== undefined) {
      this.kinematics.slewDeg = slew;
      if (this.kinematics.pivots.slew) {
        this.kinematics.pivots.slew.rotation.y = THREE.MathUtils.degToRad(slew);
      }
    }

    if (elevation !== undefined) {
      this.kinematics.elevationDeg = elevation;
      if (this.kinematics.pivots.elevation) {
        this.kinematics.pivots.elevation.rotation.z = THREE.MathUtils.degToRad(elevation);
      }
    }

    if (extension !== undefined) {
      this.kinematics.extensionPct = extension;
      if (this.kinematics.pivots.extension) {
        const maxExtendDist = 2.4;
        this.kinematics.pivots.extension.position.x = (extension / 100) * maxExtendDist;
      }
    }

    if (jib !== undefined) {
      this.kinematics.jibDeg = jib;
      if (this.kinematics.pivots.jib) {
        this.kinematics.pivots.jib.rotation.z = THREE.MathUtils.degToRad(jib);
      }
    }

    // Auto-Leveling for Work Platform Basket
    if (this.kinematics.pivots.basket) {
      const totalArmAngle = THREE.MathUtils.degToRad(this.kinematics.elevationDeg + this.kinematics.jibDeg);
      this.kinematics.pivots.basket.rotation.z = -totalArmAngle;
    }

    this.updateKinematicsUI();
  }

  updateKinematicsUI() {
    const slewSlider = document.getElementById('kin-slew-slider');
    const slewVal = document.getElementById('kin-slew-val');
    const elevSlider = document.getElementById('kin-elev-slider');
    const elevVal = document.getElementById('kin-elev-val');
    const extSlider = document.getElementById('kin-ext-slider');
    const extVal = document.getElementById('kin-ext-val');
    const jibSlider = document.getElementById('kin-jib-slider');
    const jibVal = document.getElementById('kin-jib-val');

    if (slewSlider) slewSlider.value = this.kinematics.slewDeg;
    if (slewVal) slewVal.textContent = `${Math.round(this.kinematics.slewDeg)}°`;

    if (elevSlider) elevSlider.value = this.kinematics.elevationDeg;
    if (elevVal) elevVal.textContent = `${Math.round(this.kinematics.elevationDeg)}°`;

    if (extSlider) extSlider.value = this.kinematics.extensionPct;
    if (extVal) extVal.textContent = `${Math.round(this.kinematics.extensionPct)}%`;

    if (jibSlider) jibSlider.value = this.kinematics.jibDeg;
    if (jibVal) jibVal.textContent = `${Math.round(this.kinematics.jibDeg)}°`;
  }

  toggleAutoKinematicCycle() {
    this.kinematics.isAutoDemoRunning = !this.kinematics.isAutoDemoRunning;
    const demoBtn = document.getElementById('btn-kin-demo');
    if (demoBtn) {
      demoBtn.classList.toggle('active', this.kinematics.isAutoDemoRunning);
      demoBtn.textContent = this.kinematics.isAutoDemoRunning ? '⏹️ Stop Motion Cycle' : '▶️ Run Working Motion Cycle';
    }

    if (this.kinematics.isAutoDemoRunning) {
      const startTime = performance.now();
      const runCycle = (now) => {
        if (!this.kinematics.isAutoDemoRunning) return;
        const elapsed = (now - startTime) / 1000.0;
        
        const slew = Math.sin(elapsed * 0.5) * 45;
        const elev = 12 + (Math.sin(elapsed * 0.8) + 1) * 22;
        const ext = ((Math.sin(elapsed * 0.6) + 1) / 2) * 75;
        const jib = Math.sin(elapsed * 0.9) * 35 - 15;

        this.setKinematics({ slew, elevation: elev, extension: ext, jib });
        requestAnimationFrame(runCycle);
      };
      requestAnimationFrame(runCycle);
    }
  }

  /* =========================================================================
     LEGO DISASSEMBLY & REWIRING ENGINE
     ========================================================================= */
  captureOriginalPositions(rootGroup) {
    this.explodedParts = [];
    rootGroup.traverse((obj) => {
      if (obj.userData && obj.userData.explodeVector) {
        this.explodedParts.push({
          object: obj,
          origPos: obj.position.clone(),
          vector: obj.userData.explodeVector.clone(),
        });
      }
    });
  }

  setExplosionProgress(progress) {
    this.explosionProgress = Math.max(0, Math.min(1, progress));
    this.explodedParts.forEach((item) => {
      item.object.position.x = item.origPos.x + item.vector.x * this.explosionProgress;
      item.object.position.y = item.origPos.y + item.vector.y * this.explosionProgress;
      item.object.position.z = item.origPos.z + item.vector.z * this.explosionProgress;
    });
  }

  animateExplosion(targetProgress, duration = 750, onComplete) {
    const startProgress = this.explosionProgress;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const currentVal = startProgress + (targetProgress - startProgress) * ease;
      this.setExplosionProgress(currentVal);

      const slider = document.getElementById('explode-slider');
      const valDisplay = document.getElementById('explode-val');
      if (slider) slider.value = Math.round(currentVal * 100);
      if (valDisplay) valDisplay.textContent = Math.round(currentVal * 100) + '%';

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  loadCustomGLTF(file, onComplete, onError) {
    const group = this.sceneCtrl.currentModelGroup;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    this.customizableParts = [];
    this.explodedParts = [];
    this.explosionProgress = 0;

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;
      this.gltfLoader.parse(
        contents,
        '',
        (gltf) => {
          const loadedScene = gltf.scene || gltf.scenes[0];

          const box = new THREE.Box3().setFromObject(loadedScene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const targetDim = 7.0;
          const scaleFactor = maxDim > 0 ? (targetDim / maxDim) : 1.0;

          loadedScene.scale.setScalar(scaleFactor);
          loadedScene.position.x = -center.x * scaleFactor;
          loadedScene.position.y = -box.min.y * scaleFactor;
          loadedScene.position.z = -center.z * scaleFactor;

          const rootWrapper = new THREE.Group();
          rootWrapper.add(loadedScene);
          group.add(rootWrapper);

          let partIndex = 1;
          loadedScene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              const partName = child.name || `Component ${partIndex++}`;
              const defaultColor = child.material && child.material.color ? '#' + child.material.color.getHexString() : '#f8fafc';
              
              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);
              child.userData.explodeVector = new THREE.Vector3(
                worldPos.x > 0 ? 1.5 : -1.5,
                worldPos.y > 1.5 ? 1.5 : 0.2,
                worldPos.z > 0 ? 1.5 : -1.5
              );

              this.registerPart(child, partName, 'glossy', defaultColor);
            }
          });

          this.captureOriginalPositions(rootWrapper);

          const emptyOverlay = document.getElementById('empty-state-overlay');
          if (emptyOverlay) emptyOverlay.classList.add('hidden');

          const clearBtn = document.getElementById('btn-clear-scene');
          if (clearBtn) clearBtn.style.display = 'inline-flex';

          if (this.sceneCtrl && this.sceneCtrl.controls) {
            this.sceneCtrl.controls.target.set(0, 1.4, 0);
            this.sceneCtrl.camera.position.set(6.8, 3.8, 7.4);
            this.sceneCtrl.controls.update();
          }

          if (onComplete) onComplete(this.customizableParts);
        },
        (err) => {
          console.error('Error parsing GLTF:', err);
          if (onError) onError(err);
        }
      );
    };

    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      if (onError) onError(err);
    };

    reader.readAsArrayBuffer(file);
  }

  registerPart(mesh, name, defaultPreset, defaultColorHex) {
    this.customizableParts.push({
      id: mesh.uuid,
      name: name,
      mesh: mesh,
      materialPreset: defaultPreset,
      colorHex: defaultColorHex,
    });
  }

  getCurrentModelDisplayName() {
    const item = this.catalog[this.currentModelKey];
    return item ? item.name : 'Custom 3D Model';
  }
}

window.ModelManager = ModelManager;
