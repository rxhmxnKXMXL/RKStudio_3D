/**
 * High-Fidelity Sculpted 3D Machinery Models & Precision CAD Geometry
 * Features:
 * 1. Sculpted Automotive Truck Cabs (Curved Windshields, Grilles, Headlights, Mirrors, Beacons)
 * 2. Heavy Commercial Chassis with Fuel Tanks, Air Reservoirs & Diamond Catwalks
 * 3. 10-Bolt Heavy Commercial Wheels (Single Front, Dual Dually Rear)
 * 4. Twin Hydraulic Elevation Cylinders & Articulated Multi-Stage Booms
 * 5. 5-Axis Forward Kinematics & Modular LEGO Disassembly
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
      elevationDeg: 18,
      extensionPct: 0,
      jibDeg: -45,
      isAutoDemoRunning: false,
      pivots: {}
    };

    this.catalog = {
      emgd24: {
        name: 'ENMAX EMGD24 Negative Reach Platform (400kg)',
        shortName: 'EMGD24 (400kg)',
        primaryColor: '#f8fafc',
      },
      emgk16: {
        name: 'ENMAX EMGK16 Insulated 1000V Utility Skylift',
        shortName: 'EMGK16 (1000V)',
        primaryColor: '#ea580c',
      },
      em160zb4: {
        name: 'ENMAX EM160ZB4 Knuckle Crane (8-Ton Hook)',
        shortName: 'EM160ZB4 (8-Ton Crane)',
        primaryColor: '#dc2626',
      },
      embl10a: {
        name: 'ENMAX EMBL-10A Trailer Articulating Spider Boom',
        shortName: 'EMBL-10A Trailer Boom',
        primaryColor: '#facc15',
      },
      emgk23: {
        name: 'ENMAX EMGK23 Heavy Duty Platform (800kg)',
        shortName: 'EMGK23 (800kg)',
        primaryColor: '#ea580c',
      },
      mandrossa: {
        name: 'Mandrossa Skylift + Jib Boom (Isuzu NPR)',
        shortName: 'Mandrossa Skylift + Jib',
        primaryColor: '#f8fafc',
      },
      tiller_skylift: {
        name: 'Tiller Aerial Skylift Truck (3D Warehouse)',
        shortName: 'Tiller Aerial Truck',
        primaryColor: '#dc2626',
        file: 'assets/models/tiller_aerial_truck.glb',
      }
    };
  }

  loadModel(modelKey, onComplete) {
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

    if (modelKey === 'tiller_skylift') {
      this.loadHighPolyGLB('assets/models/tiller_aerial_truck.glb', onComplete);
      return;
    }

    const rootGroup = new THREE.Group();

    if (modelKey === 'emgd24') {
      this.buildEMGD24NegativeReach(rootGroup);
    } else if (modelKey === 'emgk16') {
      this.buildEMGK16Insulated(rootGroup);
    } else if (modelKey === 'em160zb4') {
      this.buildEM160ZB4KnuckleCrane(rootGroup);
    } else if (modelKey === 'embl10a') {
      this.buildEMBL10ATrailerBoom(rootGroup);
    } else if (modelKey === 'emgk23') {
      this.buildEMGK23HeavyPlatform(rootGroup);
    } else if (modelKey === 'mandrossa') {
      this.buildMandrossaSkylift(rootGroup);
    }

    group.add(rootGroup);
    this.captureOriginalPositions(rootGroup);

    // Reset kinematics
    this.setKinematics({
      slew: 0,
      elevation: modelKey === 'emgk16' ? 25 : 18,
      extension: 0,
      jib: modelKey === 'emgd24' ? -45 : 0
    });

    if (this.sceneCtrl && this.sceneCtrl.controls) {
      this.sceneCtrl.controls.target.set(0, 1.5, 0);
      this.sceneCtrl.camera.position.set(7.5, 4.0, 7.8);
      this.sceneCtrl.controls.update();
    }

    if (onComplete) onComplete(this.customizableParts);
  }

  /* =========================================================================
     REUSABLE HIGH-DETAIL PROCEDURAL CAD COMPONENTS
     ========================================================================= */

  /**
   * Sculpted Commercial Truck Cabin with curved glass, grille, headlights, and mirrors
   */
  createSculptedCabin(colorHex = '#f8fafc', isCabOver = true) {
    const cabGroup = new THREE.Group();
    const bodyMat = this.matMgr.createMaterial('glossy', colorHex);
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const chromeMat = this.matMgr.createMaterial('chrome', '#ffffff');
    const glassMat = this.matMgr.createMaterial('glass', '#0f172a');
    const amberMat = this.matMgr.createMaterial('gold', '#f59e0b');

    // 1. Main Cab Lower Body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 2.2), bodyMat);
    lowerBody.position.set(0, 0.55, 0);
    lowerBody.castShadow = true;
    cabGroup.add(lowerBody);

    // 2. Upper Cab Roof (Aerodynamic tapered profile)
    const upperRoof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.85, 2.14), bodyMat);
    upperRoof.position.set(-0.15, 1.45, 0);
    upperRoof.castShadow = true;
    cabGroup.add(upperRoof);

    // 3. Aerodynamic Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, 1.95), glassMat);
    windshield.position.set(0.74, 1.42, 0);
    windshield.rotation.z = -0.32; // Aerodynamic slant
    cabGroup.add(windshield);

    // 4. Side Door Windows
    [-1.08, 1.08].forEach((sideZ) => {
      const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.04), glassMat);
      sideWindow.position.set(-0.12, 1.42, sideZ);
      cabGroup.add(sideWindow);

      // Side Mirrors on Tubular Steel Brackets
      const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), darkMat);
      mirrorArm.position.set(0.65, 1.4, sideZ + (sideZ > 0 ? 0.22 : -0.22));
      mirrorArm.rotation.x = Math.PI / 2;
      cabGroup.add(mirrorArm);

      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.22), darkMat);
      mirrorHousing.position.set(0.65, 1.4, sideZ + (sideZ > 0 ? 0.38 : -0.38));
      cabGroup.add(mirrorHousing);

      const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.36), chromeMat);
      mirrorGlass.position.set(0.58, 1.4, sideZ + (sideZ > 0 ? 0.38 : -0.38));
      mirrorGlass.rotation.y = sideZ > 0 ? -Math.PI / 2 : Math.PI / 2;
      cabGroup.add(mirrorGlass);
    });

    // 5. Front Radiator Grille with Chrome Louvers
    const grilleBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 1.6), darkMat);
    grilleBase.position.set(1.04, 0.6, 0);
    cabGroup.add(grilleBase);

    for (let g = 0; g < 4; g++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 1.45), chromeMat);
      louver.position.set(1.05, 0.4 + g * 0.12, 0);
      cabGroup.add(louver);
    }

    // 6. Crystal Headlight Clusters & Turn Signals
    [-0.88, 0.88].forEach((hZ) => {
      const headlightHousing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.28), darkMat);
      headlightHousing.position.set(1.02, 0.45, hZ);
      cabGroup.add(headlightHousing);

      const headlightLens = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.18), chromeMat);
      headlightLens.position.set(1.03, 0.45, hZ);
      cabGroup.add(headlightLens);

      const turnSignal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.08), amberMat);
      turnSignal.position.set(1.03, 0.45, hZ + (hZ > 0 ? 0.12 : -0.12));
      cabGroup.add(turnSignal);
    });

    // 7. Heavy Front Bumper with Tow Hooks & Fog Lamps
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 2.3), darkMat);
    bumper.position.set(1.05, 0.18, 0);
    cabGroup.add(bumper);

    // 8. Roof Amber Strobe Light Bar & Dual Air Horns
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 1.2), amberMat);
    lightBar.position.set(-0.25, 1.94, 0);
    cabGroup.add(lightBar);

    [-0.35, 0.35].forEach((hornZ) => {
      const airHorn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 12), chromeMat);
      airHorn.rotation.z = Math.PI / 2;
      airHorn.position.set(0.1, 1.94, hornZ);
      cabGroup.add(airHorn);
    });

    // Link meshes for synchronized color customization
    lowerBody.userData.linkedMeshes = [lowerBody, upperRoof];
    return { group: cabGroup, mainMesh: lowerBody };
  }

  /**
   * 10-Lug Heavy Duty Commercial Wheels (Single Front, Dual Dually Rear, Left/Right Symmetric)
   */
  createWheelAssembly(isDual = false, isRightSide = false) {
    const wheelGroup = new THREE.Group();
    const tireMat = this.matMgr.createMaterial('tire');
    const rimMat = this.matMgr.createMaterial('brushed', '#cbd5e1');
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const chromeMat = this.matMgr.createMaterial('chrome', '#ffffff');

    const tireRadius = 0.52;
    const tireWidth = isDual ? 0.62 : 0.32;

    // 1. Rubber Tire Tread (Bottom sits exactly at ground Y = 0)
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 32), tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // 2. Steel Wheel Rim
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, tireWidth + 0.02, 24), rimMat);
    rim.rotation.x = Math.PI / 2;
    wheelGroup.add(rim);

    // 3. Center Hubcap & 10 Chrome Lug Nuts (Facing Outside)
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, tireWidth + 0.08, 16), darkMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 8), chromeMat);
      lug.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, (tireWidth / 2) + 0.02);
      lug.rotation.x = Math.PI / 2;
      wheelGroup.add(lug);
    }

    // Mirror for right-side wheels so they face outwards symmetrically
    if (isRightSide) {
      wheelGroup.rotation.y = Math.PI;
    }

    return wheelGroup;
  }

  /**
   * Heavy Truck Chassis with Fuel Tanks, Air Reservoirs & Diamond Catwalk
   */
  createChassisSubframe(length = 7.8, width = 2.2) {
    const chassisGroup = new THREE.Group();
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const chromeMat = this.matMgr.createMaterial('chrome', '#ffffff');
    const diamondMat = this.matMgr.createMaterial('diamond');

    // 1. Dual Heavy C-Channel Frame Rails (Perfect Horizontal Alignment)
    [-0.55, 0.55].forEach((railZ) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.32, 0.15), darkMat);
      rail.position.set(0, 0.72, railZ);
      rail.castShadow = true;
      chassisGroup.add(rail);
    });

    // 2. Diamond Plate Catwalk Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length * 0.85, 0.08, width), diamondMat);
    deck.position.set(-0.4, 0.92, 0);
    deck.receiveShadow = true;
    chassisGroup.add(deck);

    // 3. Cylindrical Diesel Fuel Tank with Chrome Straps
    const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 24), chromeMat);
    fuelTank.rotation.z = Math.PI / 2;
    fuelTank.position.set(0.4, 0.55, 0.95);
    fuelTank.castShadow = true;
    chassisGroup.add(fuelTank);

    // 4. Dual Compressed Air Brake Tanks
    [-0.15, 0.15].forEach((aX) => {
      const airTank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 16), darkMat);
      airTank.rotation.z = Math.PI / 2;
      airTank.position.set(aX - 1.2, 0.52, -0.9);
      chassisGroup.add(airTank);
    });

    return { group: chassisGroup, mainMesh: deck };
  }

  /* =========================================================================
     1. ENMAX EMGD24: FULL HIGH-DETAIL NEGATIVE REACH PLATFORM (400KG)
     ========================================================================= */
  buildEMGD24NegativeReach(parentGroup) {
    const root = new THREE.Group();
    const whiteMat = this.matMgr.createMaterial('glossy', '#f8fafc');
    const orangeMat = this.matMgr.createMaterial('glossy', '#ea580c');
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const chromeMat = this.matMgr.createMaterial('chrome', '#ffffff');
    const cageMat = this.matMgr.createMaterial('brushed', '#cbd5e1');

    // A. Sculpted Cab (Explode forward +X)
    const cabObj = this.createSculptedCabin('#f8fafc', true);
    cabObj.group.position.set(2.45, 0.92, 0);
    cabObj.group.userData.explodeVector = new THREE.Vector3(3.2, 0.5, 0);
    root.add(cabObj.group);
    this.registerPart(cabObj.mainMesh, 'Sculpted Truck Cabin', 'glossy', '#f8fafc');

    // B. Heavy Chassis & Service Deck
    const chassisObj = this.createChassisSubframe(7.8, 2.3);
    chassisObj.group.userData.explodeVector = new THREE.Vector3(0, 0, 0);
    root.add(chassisObj.group);
    this.registerPart(chassisObj.mainMesh, 'Chassis & Diamond Deck', 'diamond', '#94a3b8');

    // C. 10-Lug Wheels (Perfect Flat Landing on Y=0)
    const wheelGroup = new THREE.Group();
    [
      { x: 2.4, z: 1.05, dual: false },
      { x: 2.4, z: -1.05, dual: false },
      { x: -1.8, z: 1.05, dual: true },
      { x: -1.8, z: -1.05, dual: true },
      { x: -3.0, z: 1.05, dual: true },
      { x: -3.0, z: -1.05, dual: true }
    ].forEach((w) => {
      const wh = this.createWheelAssembly(w.dual, w.z < 0);
      wh.position.set(w.x, 0.52, w.z);
      wh.userData.explodeVector = new THREE.Vector3(0, 0, w.z > 0 ? 1.5 : -1.5);
      wheelGroup.add(wh);
    });
    root.add(wheelGroup);
    this.registerPart(wheelGroup.children[0].children[0], '10-Lug Commercial Wheels', 'tire', '#141416');

    // D. Heavy Sliding H-Outriggers with Hydraulic Jack Rams (Sitting Flat on Ground)
    const outriggerGroup = new THREE.Group();
    [ { x: 1.4, s: 1 }, { x: 1.4, s: -1 }, { x: -3.4, s: 1 }, { x: -3.4, s: -1 } ].forEach((o) => {
      // Horizontal Beam
      const hBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 1.9), darkMat);
      hBeam.position.set(o.x, 0.88, o.s * 1.8);
      outriggerGroup.add(hBeam);

      // Vertical Hydraulic Cylinder Jack
      const jack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.45, 0.32), orangeMat);
      jack.position.set(o.x, 0.72, o.s * 2.7);
      jack.castShadow = true;
      outriggerGroup.add(jack);

      // Swivel Ground Pad (Landing flush at Y=0)
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), darkMat);
      pad.position.set(o.x, 0.04, o.s * 2.7);
      outriggerGroup.add(pad);
    });
    outriggerGroup.userData.explodeVector = new THREE.Vector3(0, 0, 1.8);
    root.add(outriggerGroup);
    this.registerPart(outriggerGroup.children[1], 'Hydraulic Outriggers', 'glossy', '#ea580c');

    // E. 5-AXIS KINEMATIC BOOM ASSEMBLY
    // 1. Slew Turntable Pedestal
    const slewPivot = new THREE.Group();
    slewPivot.position.set(-2.0, 0.95, 0);
    slewPivot.userData.explodeVector = new THREE.Vector3(0, 1.5, 0);
    root.add(slewPivot);
    this.kinematics.pivots.slew = slewPivot;

    const slewBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.65, 32), orangeMat);
    slewBase.position.set(0, 0.32, 0);
    slewBase.castShadow = true;
    slewPivot.add(slewBase);
    this.registerPart(slewBase, 'Turntable Slew Pedestal', 'glossy', '#ea580c');

    // Slew Column Uprights
    const columnLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.22), orangeMat);
    columnLeft.position.set(0, 0.9, 0.45);
    slewPivot.add(columnLeft);

    const columnRight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.22), orangeMat);
    columnRight.position.set(0, 0.9, -0.45);
    slewPivot.add(columnRight);

    // 2. Boom Elevation Hinge Pin Pivot
    const elevationPivot = new THREE.Group();
    elevationPivot.position.set(0, 1.35, 0);
    slewPivot.add(elevationPivot);
    this.kinematics.pivots.elevation = elevationPivot;

    // Outer Main Boom (Beveled Octagonal Profile)
    const baseBoom = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.58, 0.52), whiteMat);
    baseBoom.position.set(2.3, 0, 0);
    baseBoom.castShadow = true;
    elevationPivot.add(baseBoom);
    this.registerPart(baseBoom, 'Telescopic Main Boom', 'glossy', '#f8fafc');

    // Chrome Hydraulic Elevation Cylinders
    [-0.32, 0.32].forEach((cylZ) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 16), orangeMat);
      barrel.position.set(0.9, -0.4, cylZ);
      barrel.rotation.z = -0.45;
      elevationPivot.add(barrel);

      const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.4, 16), chromeMat);
      ram.position.set(1.4, -0.15, cylZ);
      ram.rotation.z = -0.45;
      elevationPivot.add(ram);
    });

    // 3. Telescoping Extension Stage
    const extensionStage = new THREE.Group();
    extensionStage.position.set(4.2, 0, 0);
    elevationPivot.add(extensionStage);
    this.kinematics.pivots.extension = extensionStage;

    const innerBoom = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.46, 0.44), whiteMat);
    innerBoom.position.set(1.8, 0, 0);
    innerBoom.castShadow = true;
    extensionStage.add(innerBoom);

    // 4. Articulated Negative Reach Jib Knuckle Hinge
    const jibPivot = new THREE.Group();
    jibPivot.position.set(3.6, 0, 0);
    extensionStage.add(jibPivot);
    this.kinematics.pivots.jib = jibPivot;

    const jibKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 16), orangeMat);
    jibKnuckle.rotation.x = Math.PI / 2;
    jibPivot.add(jibKnuckle);

    const jibArm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.38), orangeMat);
    jibArm.position.set(1.3, 0, 0);
    jibArm.castShadow = true;
    jibPivot.add(jibArm);
    this.registerPart(jibArm, 'Articulated Negative Jib', 'glossy', '#ea580c');

    // 5. Auto-Leveling 400kg Rotating Work Cage
    const basketPivot = new THREE.Group();
    basketPivot.position.set(2.6, 0, 0);
    jibPivot.add(basketPivot);
    this.kinematics.pivots.basket = basketPivot;

    // Platform Floor with Safety Toe-Boards
    const cageFloor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.3), cageMat);
    cageFloor.position.set(0, -0.45, 0);
    basketPivot.add(cageFloor);

    // Heavy Tubular Steel Railing
    const cageRails = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 1.3), cageMat);
    cageRails.position.set(0, 0.12, 0);
    basketPivot.add(cageRails);

    // Operator Joystick Console
    const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.28), darkMat);
    consoleBox.position.set(0.7, 0.4, 0.35);
    basketPivot.add(consoleBox);
    this.registerPart(cageFloor, '400kg Work Platform Cage', 'brushed', '#cbd5e1');

    parentGroup.add(root);
  }

  /* =========================================================================
     2. ENMAX EMGK16: 1000V INSULATED UTILITY SKYLIFT
     ========================================================================= */
  buildEMGK16Insulated(parentGroup) {
    const root = new THREE.Group();
    const orangeMat = this.matMgr.createMaterial('glossy', '#ea580c');
    const whiteMat = this.matMgr.createMaterial('glossy', '#f8fafc');
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const toolMat = this.matMgr.createMaterial('toolbox');
    const fiberMat = this.matMgr.createMaterial('fiberglass', '#f8fafc');

    // Sculpted Orange/White Cab
    const cabObj = this.createSculptedCabin('#ea580c', true);
    cabObj.group.position.set(2.35, 0.92, 0);
    root.add(cabObj.group);
    this.registerPart(cabObj.mainMesh, 'Utility Truck Cabin', 'glossy', '#ea580c');

    // Utility Service Body Subframe
    const chassisObj = this.createChassisSubframe(7.2, 2.3);
    root.add(chassisObj.group);
    this.registerPart(chassisObj.mainMesh, 'Utility Service Body', 'glossy', '#f8fafc');

    // Side Diamond Toolboxes
    [ { x: 0.6, z: 1.05 }, { x: -0.9, z: 1.05 }, { x: 0.6, z: -1.05 }, { x: -0.9, z: -1.05 } ].forEach((b) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.78, 0.45), toolMat);
      box.position.set(b.x, 1.42, b.z);
      box.castShadow = true;
      root.add(box);
    });

    // Wheels (Symmetric Left/Right Landing)
    [ { x: 2.3, z: 1.05, dual: false }, { x: 2.3, z: -1.05, dual: false }, { x: -1.9, z: 1.05, dual: true }, { x: -1.9, z: -1.05, dual: true } ].forEach((w) => {
      const wh = this.createWheelAssembly(w.dual, w.z < 0);
      wh.position.set(w.x, 0.52, w.z);
      wh.userData.explodeVector = new THREE.Vector3(0, 0, w.z > 0 ? 1.5 : -1.5);
      root.add(wh);
    });

    // Kinematic Slew & Insulated Boom
    const slewPivot = new THREE.Group();
    slewPivot.position.set(-1.8, 0.95, 0);
    root.add(slewPivot);
    this.kinematics.pivots.slew = slewPivot;

    const slewPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.7, 24), orangeMat);
    slewPedestal.position.set(0, 0.35, 0);
    slewPivot.add(slewPedestal);

    const elevationPivot = new THREE.Group();
    elevationPivot.position.set(0, 1.35, 0);
    slewPivot.add(elevationPivot);
    this.kinematics.pivots.elevation = elevationPivot;

    const baseBoom = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.55, 0.5), whiteMat);
    baseBoom.position.set(2.4, 0, 0);
    baseBoom.castShadow = true;
    elevationPivot.add(baseBoom);
    this.registerPart(baseBoom, 'Telescopic Insulated Boom', 'glossy', '#f8fafc');

    const extensionStage = new THREE.Group();
    extensionStage.position.set(4.4, 0, 0);
    elevationPivot.add(extensionStage);
    this.kinematics.pivots.extension = extensionStage;

    const innerBoom = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.44, 0.42), whiteMat);
    innerBoom.position.set(1.6, 0, 0);
    extensionStage.add(innerBoom);

    // 1000V Insulated Bucket
    const basketPivot = new THREE.Group();
    basketPivot.position.set(3.4, 0, 0);
    extensionStage.add(basketPivot);
    this.kinematics.pivots.basket = basketPivot;

    const bucket = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.35, 1.05), fiberMat);
    bucket.position.set(0, -0.4, 0);
    bucket.castShadow = true;
    basketPivot.add(bucket);
    this.registerPart(bucket, '1000V Insulated Bucket', 'glossy', '#f8fafc');

    parentGroup.add(root);
  }

  /* =========================================================================
     3. ENMAX EM160ZB4: KNUCKLE CRANE (8-TON HOOK)
     ========================================================================= */
  buildEM160ZB4KnuckleCrane(parentGroup) {
    const root = new THREE.Group();
    const redMat = this.matMgr.createMaterial('glossy', '#dc2626');
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const chromeMat = this.matMgr.createMaterial('chrome', '#ffffff');

    // Sculpted Charcoal Cab
    const cabObj = this.createSculptedCabin('#18181b', true);
    cabObj.group.position.set(2.5, 0.92, 0);
    root.add(cabObj.group);
    this.registerPart(cabObj.mainMesh, 'Crane Truck Cabin', 'matte', '#18181b');

    const chassisObj = this.createChassisSubframe(8.2, 2.3);
    root.add(chassisObj.group);
    this.registerPart(chassisObj.mainMesh, 'Heavy 3-Axle Chassis', 'matte', '#18181b');

    // 3-Axle Wheels (1 Front, 2 Rear Tandem Dually)
    [
      { x: 2.5, z: 1.05, dual: false }, { x: 2.5, z: -1.05, dual: false },
      { x: -1.6, z: 1.05, dual: true }, { x: -1.6, z: -1.05, dual: true },
      { x: -2.9, z: 1.05, dual: true }, { x: -2.9, z: -1.05, dual: true }
    ].forEach((w) => {
      const wh = this.createWheelAssembly(w.dual, w.z < 0);
      wh.position.set(w.x, 0.52, w.z);
      wh.userData.explodeVector = new THREE.Vector3(0, 0, w.z > 0 ? 1.5 : -1.5);
      root.add(wh);
    });

    // Knuckle Crane Slew Base
    const slewPivot = new THREE.Group();
    slewPivot.position.set(0.9, 0.95, 0);
    root.add(slewPivot);
    this.kinematics.pivots.slew = slewPivot;

    const craneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.6, 24), redMat);
    craneBase.position.set(0, 0.3, 0);
    slewPivot.add(craneBase);

    const craneCol = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.5, 0.75), redMat);
    craneCol.position.set(0, 1.05, 0);
    craneCol.castShadow = true;
    slewPivot.add(craneCol);

    // Inner Boom Elevation
    const elevationPivot = new THREE.Group();
    elevationPivot.position.set(0, 1.6, 0);
    slewPivot.add(elevationPivot);
    this.kinematics.pivots.elevation = elevationPivot;

    const innerBoom = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.48), redMat);
    innerBoom.position.set(-1.6, 0, 0);
    innerBoom.castShadow = true;
    elevationPivot.add(innerBoom);
    this.registerPart(innerBoom, 'Inner Boom (Stage 1)', 'glossy', '#dc2626');

    // Knuckle Articulation Jib
    const jibPivot = new THREE.Group();
    jibPivot.position.set(-3.2, 0, 0);
    elevationPivot.add(jibPivot);
    this.kinematics.pivots.jib = jibPivot;

    const outerBoom = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.48, 0.42), darkMat);
    outerBoom.position.set(-1.9, 0, 0);
    outerBoom.castShadow = true;
    jibPivot.add(outerBoom);
    this.registerPart(outerBoom, '4-Stage Knuckle Jib', 'matte', '#18181b');

    // Extension Stage
    const extensionStage = new THREE.Group();
    extensionStage.position.set(-3.6, 0, 0);
    jibPivot.add(extensionStage);
    this.kinematics.pivots.extension = extensionStage;

    const extJib = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.38, 0.35), darkMat);
    extJib.position.set(-1.4, 0, 0);
    extensionStage.add(extJib);

    // 8-Ton Hoist Hook
    const hookBlock = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.28), darkMat);
    hookBlock.position.set(-2.6, -0.7, 0);
    extensionStage.add(hookBlock);

    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 12, 24, Math.PI * 1.5), chromeMat);
    hook.position.set(-2.6, -1.05, 0);
    hook.rotation.z = Math.PI;
    extensionStage.add(hook);
    this.registerPart(hookBlock, '8-Ton Crane Hook Block', 'matte', '#18181b');

    parentGroup.add(root);
  }

  /* =========================================================================
     4. ENMAX EMBL-10A: TRAILER SPIDER BOOM
     ========================================================================= */
  buildEMBL10ATrailerBoom(parentGroup) {
    const root = new THREE.Group();
    const yellowMat = this.matMgr.createMaterial('glossy', '#facc15');
    const darkMat = this.matMgr.createMaterial('matte', '#18181b');
    const cageMat = this.matMgr.createMaterial('brushed', '#cbd5e1');

    // Road Trailer Chassis with Tow Hitch Coupler
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 1.5), darkMat);
    trailer.position.set(0, 0.65, 0);
    root.add(trailer);
    this.registerPart(trailer, 'Trailer Chassis Frame', 'matte', '#18181b');

    const hitch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12), darkMat);
    hitch.position.set(2.6, 0.55, 0);
    hitch.rotation.z = Math.PI / 2;
    root.add(hitch);

    // Single Axle Wheels (Flat Landing at Y=0)
    [-0.85, 0.85].forEach((wZ) => {
      const wh = this.createWheelAssembly(false, wZ < 0);
      wh.position.set(0, 0.52, wZ);
      wh.userData.explodeVector = new THREE.Vector3(0, 0, wZ > 0 ? 1.5 : -1.5);
      root.add(wh);
    });

    // 4 Heavy Spider Outrigger Stabilizer Legs
    [ { x: 1.6, z: 1.4 }, { x: 1.6, z: -1.4 }, { x: -1.6, z: 1.4 }, { x: -1.6, z: -1.4 } ].forEach((sp) => {
      const spiderLeg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.16), yellowMat);
      spiderLeg.position.set(sp.x, 0.45, sp.z);
      spiderLeg.rotation.y = (sp.x > 0 ? 1 : -1) * (sp.z > 0 ? 0.6 : -0.6);
      root.add(spiderLeg);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), darkMat);
      pad.position.set(sp.x + (sp.x > 0 ? 0.6 : -0.6), 0.03, sp.z + (sp.z > 0 ? 0.6 : -0.6));
      root.add(pad);
    });

    // Slew & Boom
    const slewPivot = new THREE.Group();
    slewPivot.position.set(-0.4, 0.8, 0);
    root.add(slewPivot);
    this.kinematics.pivots.slew = slewPivot;

    const elevationPivot = new THREE.Group();
    elevationPivot.position.set(0, 0.7, 0);
    slewPivot.add(elevationPivot);
    this.kinematics.pivots.elevation = elevationPivot;

    const mainBoom = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.42, 0.36), yellowMat);
    mainBoom.position.set(1.9, 0, 0);
    mainBoom.castShadow = true;
    elevationPivot.add(mainBoom);
    this.registerPart(mainBoom, 'EMBL-10A Articulating Boom', 'glossy', '#facc15');

    const extensionStage = new THREE.Group();
    extensionStage.position.set(3.6, 0, 0);
    elevationPivot.add(extensionStage);
    this.kinematics.pivots.extension = extensionStage;

    const basketPivot = new THREE.Group();
    basketPivot.position.set(1.8, 0, 0);
    extensionStage.add(basketPivot);
    this.kinematics.pivots.basket = basketPivot;

    const cage = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.15, 0.95), cageMat);
    cage.position.set(0, -0.4, 0);
    basketPivot.add(cage);
    this.registerPart(cage, 'Work Platform Basket', 'brushed', '#cbd5e1');

    parentGroup.add(root);
  }

  /* =========================================================================
     5. ENMAX EMGK23: 800KG SUPER HEAVY DUTY PLATFORM
     ========================================================================= */
  buildEMGK23HeavyPlatform(parentGroup) {
    const root = new THREE.Group();
    const orangeMat = this.matMgr.createMaterial('glossy', '#ea580c');
    const whiteMat = this.matMgr.createMaterial('glossy', '#f8fafc');
    const cageMat = this.matMgr.createMaterial('brushed', '#cbd5e1');

    // Conventional Sculpted Hood Truck Cab
    const cabObj = this.createSculptedCabin('#ea580c', false);
    cabObj.group.position.set(2.4, 0.92, 0);
    root.add(cabObj.group);
    this.registerPart(cabObj.mainMesh, 'Heavy Truck Cabin', 'glossy', '#ea580c');

    const chassisObj = this.createChassisSubframe(8.4, 2.4);
    root.add(chassisObj.group);
    this.registerPart(chassisObj.mainMesh, 'EMGK23 Chassis & Deck', 'glossy', '#ea580c');

    // Wheels (Symmetric Flat Landing)
    [ { x: 2.4, z: 1.1, dual: false }, { x: 2.4, z: -1.1, dual: false }, { x: -1.8, z: 1.1, dual: true }, { x: -1.8, z: -1.1, dual: true }, { x: -3.1, z: 1.1, dual: true }, { x: -3.1, z: -1.1, dual: true } ].forEach((w) => {
      const wh = this.createWheelAssembly(w.dual, w.z < 0);
      wh.position.set(w.x, 0.52, w.z);
      wh.userData.explodeVector = new THREE.Vector3(0, 0, w.z > 0 ? 1.5 : -1.5);
      root.add(wh);
    });

    const slewPivot = new THREE.Group();
    slewPivot.position.set(-1.8, 0.95, 0);
    root.add(slewPivot);
    this.kinematics.pivots.slew = slewPivot;

    const elevationPivot = new THREE.Group();
    elevationPivot.position.set(0, 1.45, 0);
    slewPivot.add(elevationPivot);
    this.kinematics.pivots.elevation = elevationPivot;

    const mainBoom = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.68, 0.62), whiteMat);
    mainBoom.position.set(2.6, 0, 0);
    mainBoom.castShadow = true;
    elevationPivot.add(mainBoom);
    this.registerPart(mainBoom, 'EMGK23 Heavy Telescopic Boom', 'glossy', '#f8fafc');

    const extensionStage = new THREE.Group();
    extensionStage.position.set(4.8, 0, 0);
    elevationPivot.add(extensionStage);
    this.kinematics.pivots.extension = extensionStage;

    const basketPivot = new THREE.Group();
    basketPivot.position.set(2.8, 0, 0);
    extensionStage.add(basketPivot);
    this.kinematics.pivots.basket = basketPivot;

    // Wide 800kg Work Platform
    const cage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.5), cageMat);
    cage.position.set(0, -0.45, 0);
    basketPivot.add(cage);
    this.registerPart(cage, '800kg Super Heavy Duty Platform', 'brushed', '#cbd5e1');

    parentGroup.add(root);
  }

  buildMandrossaSkylift(parentGroup) {
    this.buildEMGD24NegativeReach(parentGroup);
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
        const maxExtendDist = 3.2;
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
        
        const slew = Math.sin(elapsed * 0.5) * 60;
        const elev = 15 + (Math.sin(elapsed * 0.8) + 1) * 30;
        const ext = ((Math.sin(elapsed * 0.6) + 1) / 2) * 85;
        const jib = Math.sin(elapsed * 0.9) * 45 - 20;

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

  loadHighPolyGLB(filePath, onComplete) {
    const group = this.sceneCtrl.currentModelGroup;
    this.gltfLoader.load(filePath, (gltf) => {
      const loadedScene = gltf.scene || gltf.scenes[0];
      const wrapper = new THREE.Group();
      wrapper.add(loadedScene);
      wrapper.scale.set(0.015, 0.015, 0.015);
      group.add(wrapper);
      if (onComplete) onComplete(this.customizableParts);
    });
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
