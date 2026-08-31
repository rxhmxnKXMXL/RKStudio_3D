/**
 * Main Application Coordinator for Equipment 3D Customizer
 * Features:
 * 1. 5-Axis Forward Kinematics (Slew, Elevation, Telescoping, Jib Articulation, Basket Auto-Leveling)
 * 2. Modular LEGO Disassembly / Exploded View & Rewiring Engine
 * 3. AI Fleet Copilot (Gemini 2.5 Flash)
 */

class CustomizerApp {
  constructor() {
    this.sceneCtrl = null;
    this.matMgr = null;
    this.modelMgr = null;
    this.embedMgr = null;
    this.aiAssistant = null;
    this.selectedPart = null;
    this.isExploded = false;

    this.init();
  }

  init() {
    // 1. Initialize Subsystems
    this.matMgr = new MaterialManager();
    this.sceneCtrl = new SceneController('canvas-container');
    this.modelMgr = new ModelManager(this.sceneCtrl, this.matMgr);
    this.embedMgr = new EmbedAndExportManager(this);
    this.aiAssistant = new AIAssistant(this);
    window.aiAssistant = this.aiAssistant;

    // 2. Setup 3D Part Selection Callback
    this.sceneCtrl.onPartSelectedCallback = (mesh) => {
      const part = this.modelMgr.customizableParts.find((p) => {
        if (p.mesh === mesh || p.id === mesh.uuid) return true;
        if (p.mesh.userData && p.mesh.userData.linkedMeshes) {
          return p.mesh.userData.linkedMeshes.includes(mesh);
        }
        return false;
      });
      if (part) {
        this.selectPart(part);
      }
    };

    // 3. Bind UI Elements
    this.bindSecurityLock();
    this.bindModelTabs();
    this.bindCameraPresets();
    this.bindLightingPresets();
    this.bindControlActions();
    this.bindCustomizerControls();
    this.bindExplodedViewControls();
    this.bindKinematicControls();
    this.bindModals();
    this.bindCustomFileUpload();

    // 4. Check Security & Auto-Unlock for Google Sites Embed
    this.checkSecurityAndAutoUnlock();

    // 5. Load EMGD24 by Default
    this.loadModel('emgd24');

    // Hide loader
    setTimeout(() => {
      const loader = document.getElementById('loader-overlay');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => (loader.style.display = 'none'), 500);
      }
    }, 600);
  }

  /* =========================================================================
     PASSCODE SECURITY & GOOGLE SITES EMBED AUTO-BYPASS
     ========================================================================= */
  checkSecurityAndAutoUnlock() {
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbed = urlParams.get('embed') === 'true';
    const authKey = urlParams.get('auth') || urlParams.get('key');
    const isInsideIframe = (window.self !== window.top);
    const isSessionUnlocked = sessionStorage.getItem('mandrossa_unlocked') === 'true';

    // Auto-bypass if:
    // 1. Embedded on Google Sites iframe (window.self !== window.top)
    // 2. URL has secure embed key (?embed=true or ?auth=mandrossa2026)
    // 3. User previously entered the password in this session
    if (isInsideIframe || isEmbed || authKey === 'mandrossa2026' || isSessionUnlocked) {
      this.unlockApp(true);
    }
  }

  bindSecurityLock() {
    const lockOverlay = document.getElementById('lock-overlay');
    const passInput = document.getElementById('passcode-input');
    const unlockBtn = document.getElementById('btn-unlock-submit');
    const errorMsg = document.getElementById('lock-error-msg');
    const lockCard = document.getElementById('lock-card-box');

    const handleUnlockAttempt = () => {
      const enteredCode = (passInput.value || '').trim();
      if (enteredCode === 'mandrossa2026') {
        sessionStorage.setItem('mandrossa_unlocked', 'true');
        this.unlockApp(false);
      } else {
        if (errorMsg) errorMsg.textContent = '⚠️ Invalid Passcode. Access Restricted.';
        if (lockCard) {
          lockCard.classList.remove('shake');
          void lockCard.offsetWidth; // Trigger reflow
          lockCard.classList.add('shake');
        }
        passInput.value = '';
        passInput.focus();
      }
    };

    if (unlockBtn) unlockBtn.addEventListener('click', handleUnlockAttempt);
    if (passInput) {
      passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleUnlockAttempt();
        }
      });
    }
  }

  unlockApp(isSilent = false) {
    const lockOverlay = document.getElementById('lock-overlay');
    if (lockOverlay) {
      lockOverlay.classList.add('unlocked');
    }
    if (!isSilent) {
      this.showToast('🔓 Mandrossa 3D Engine Initialized!');
    }
  }

  loadModel(modelKey) {
    this.showToast(`Loading 3D machinery...`);
    this.isExploded = false;
    this.updateExplodeUI(0);

    this.modelMgr.loadModel(modelKey, (parts) => {
      this.populatePartsList(parts);
      if (parts.length > 0) {
        this.selectPart(parts[0]);
      }
      const displayName = this.modelMgr.getCurrentModelDisplayName();
      this.showToast(`Loaded: ${displayName}`);
    });
  }

  /* =========================================================================
     5-AXIS KINEMATICS & MOTION CONTROLS BINDINGS
     ========================================================================= */
  bindKinematicControls() {
    const slewSlider = document.getElementById('kin-slew-slider');
    const elevSlider = document.getElementById('kin-elev-slider');
    const extSlider = document.getElementById('kin-ext-slider');
    const jibSlider = document.getElementById('kin-jib-slider');
    const demoBtn = document.getElementById('btn-kin-demo');

    if (slewSlider) {
      slewSlider.addEventListener('input', (e) => {
        this.modelMgr.setKinematics({ slew: parseFloat(e.target.value) });
      });
    }

    if (elevSlider) {
      elevSlider.addEventListener('input', (e) => {
        this.modelMgr.setKinematics({ elevation: parseFloat(e.target.value) });
      });
    }

    if (extSlider) {
      extSlider.addEventListener('input', (e) => {
        this.modelMgr.setKinematics({ extension: parseFloat(e.target.value) });
      });
    }

    if (jibSlider) {
      jibSlider.addEventListener('input', (e) => {
        this.modelMgr.setKinematics({ jib: parseFloat(e.target.value) });
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        this.modelMgr.toggleAutoKinematicCycle();
      });
    }
  }

  populatePartsList(parts) {
    const container = document.getElementById('part-chips-container');
    container.innerHTML = '';

    parts.forEach((part, index) => {
      const chip = document.createElement('button');
      chip.className = `part-chip ${index === 0 ? 'active' : ''}`;
      chip.textContent = part.name;
      chip.dataset.partId = part.id;
      chip.onclick = () => this.selectPart(part);
      container.appendChild(chip);
    });
  }

  selectPart(part) {
    this.selectedPart = part;

    document.querySelectorAll('.part-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.partId === part.id);
    });

    const indicator = document.getElementById('active-part-name');
    if (indicator) indicator.textContent = part.name;

    const hex = part.colorHex || '#f8fafc';
    const hexInput = document.getElementById('hex-color-input');
    const colorPicker = document.getElementById('color-picker-input');
    if (hexInput) hexInput.value = hex.toUpperCase();
    if (colorPicker) colorPicker.value = hex;

    document.querySelectorAll('.material-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.material === part.materialPreset);
    });

    const roughSlider = document.getElementById('roughness-slider');
    const roughVal = document.getElementById('roughness-val');
    const metalSlider = document.getElementById('metalness-slider');
    const metalVal = document.getElementById('metalness-val');

    if (part.mesh.material) {
      const r = Math.round((part.mesh.material.roughness || 0.18) * 100);
      const m = Math.round((part.mesh.material.metalness || 0.15) * 100);
      if (roughSlider) roughSlider.value = r;
      if (roughVal) roughVal.textContent = r + '%';
      if (metalSlider) metalSlider.value = m;
      if (metalVal) metalVal.textContent = m + '%';
    }
  }

  applyMaterialToSelectedPart(presetName) {
    if (!this.selectedPart) return;

    this.selectedPart.materialPreset = presetName;
    const colorHex = this.selectedPart.colorHex || '#f8fafc';
    const newMat = this.matMgr.createMaterial(presetName, colorHex);

    const targetMeshes = (this.selectedPart.mesh.userData && this.selectedPart.mesh.userData.linkedMeshes)
      ? this.selectedPart.mesh.userData.linkedMeshes
      : [this.selectedPart.mesh];

    targetMeshes.forEach((mesh) => {
      mesh.material = newMat.clone();
      mesh.material.needsUpdate = true;
    });

    document.querySelectorAll('.material-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.material === presetName);
    });

    this.selectPart(this.selectedPart);
  }

  applyColorToSelectedPart(colorHex) {
    if (!this.selectedPart) return;

    this.selectedPart.colorHex = colorHex;
    const targetMeshes = (this.selectedPart.mesh.userData && this.selectedPart.mesh.userData.linkedMeshes)
      ? this.selectedPart.mesh.userData.linkedMeshes
      : [this.selectedPart.mesh];

    targetMeshes.forEach((mesh) => {
      if (mesh.material) {
        mesh.material.color.set(colorHex);
        mesh.material.needsUpdate = true;
      }
    });

    const hexInput = document.getElementById('hex-color-input');
    const colorPicker = document.getElementById('color-picker-input');
    if (hexInput) hexInput.value = colorHex.toUpperCase();
    if (colorPicker) colorPicker.value = colorHex;

    document.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === colorHex.toLowerCase());
    });
  }

  /* =========================================================================
     LEGO EXPLODE CONTROLS
     ========================================================================= */
  bindExplodedViewControls() {
    const toggleExplodeBtn = document.getElementById('btn-toggle-explode');
    const quickExplodeBtn = document.getElementById('btn-quick-explode');
    const explodeAllBtn = document.getElementById('btn-explode-all');
    const assembleAllBtn = document.getElementById('btn-assemble-all');
    const explodeSlider = document.getElementById('explode-slider');

    const handleToggle = () => {
      this.isExploded = !this.isExploded;
      const target = this.isExploded ? 1.0 : 0.0;
      this.modelMgr.animateExplosion(target, 700, () => {
        this.updateExplodeUI(target);
        this.showToast(this.isExploded ? '🧩 Model disassembled into separated parts!' : '🔗 Model rewired into 1 solid unit!');
      });
    };

    if (toggleExplodeBtn) toggleExplodeBtn.addEventListener('click', handleToggle);
    if (quickExplodeBtn) quickExplodeBtn.addEventListener('click', handleToggle);

    if (explodeAllBtn) {
      explodeAllBtn.addEventListener('click', () => {
        this.isExploded = true;
        this.modelMgr.animateExplosion(1.0, 700, () => {
          this.updateExplodeUI(1.0);
          this.showToast('🧩 Model disassembled into separated parts!');
        });
      });
    }

    if (assembleAllBtn) {
      assembleAllBtn.addEventListener('click', () => {
        this.isExploded = false;
        this.modelMgr.animateExplosion(0.0, 700, () => {
          this.updateExplodeUI(0.0);
          this.showToast('🔗 Model rewired into 1 complete machine!');
        });
      });
    }

    if (explodeSlider) {
      explodeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) / 100;
        this.modelMgr.setExplosionProgress(val);
        this.isExploded = val > 0.5;
        this.updateExplodeUI(val);
      });
    }
  }

  updateExplodeUI(progress) {
    const textEl = document.getElementById('explode-btn-text');
    const valEl = document.getElementById('explode-val');
    const slider = document.getElementById('explode-slider');
    const toggleBtn = document.getElementById('btn-toggle-explode');
    const quickBtn = document.getElementById('btn-quick-explode');

    const percent = Math.round(progress * 100);
    if (slider) slider.value = percent;

    if (valEl) {
      if (percent === 0) valEl.textContent = '0% (Assembled)';
      else if (percent === 100) valEl.textContent = '100% (Separated)';
      else valEl.textContent = `${percent}% (Exploded)`;
    }

    if (textEl) {
      textEl.textContent = progress > 0.5 ? 'Rewire / Assemble' : 'Separate Parts';
    }

    if (toggleBtn) {
      toggleBtn.style.borderColor = progress > 0.5 ? 'var(--accent-primary)' : '#f59e0b';
      toggleBtn.style.color = progress > 0.5 ? 'var(--accent-primary)' : '#fbbf24';
    }

    if (quickBtn) {
      quickBtn.classList.toggle('active', progress > 0.5);
    }
  }

  /* =========================================================================
     STANDARD EVENT BINDINGS
     ========================================================================= */
  bindModelTabs() {
    document.querySelectorAll('.model-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const model = e.currentTarget.dataset.model;
        if (model === 'custom-upload') {
          document.getElementById('custom-model-file-input').click();
          return;
        }

        document.querySelectorAll('.model-tab-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.loadModel(model);
      });
    });
  }

  bindCameraPresets() {
    document.querySelectorAll('.cam-preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.sceneCtrl.setCameraPreset(view);
        document.querySelectorAll('.cam-preset-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
  }

  bindLightingPresets() {
    document.querySelectorAll('.env-preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const env = e.currentTarget.dataset.env;
        this.sceneCtrl.setEnvironmentPreset(env);
        document.querySelectorAll('.env-preset-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
  }

  bindControlActions() {
    const autoRotateBtn = document.getElementById('btn-auto-rotate');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        const active = this.sceneCtrl.toggleAutoRotate();
        autoRotateBtn.classList.toggle('active', active);
      });
    }

    const gridBtn = document.getElementById('btn-toggle-grid');
    if (gridBtn) {
      gridBtn.addEventListener('click', () => {
        const visible = this.sceneCtrl.toggleGrid();
        gridBtn.classList.toggle('active', visible);
      });
    }

    const resetBtn = document.getElementById('btn-reset-view');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.sceneCtrl.setCameraPreset('iso');
        this.showToast('Camera view reset');
      });
    }

    const snapBtn = document.getElementById('btn-snapshot');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => this.embedMgr.downloadSnapshot());
    }

    const glbBtn = document.getElementById('btn-export-glb');
    if (glbBtn) {
      glbBtn.addEventListener('click', () => this.embedMgr.exportGLB());
    }

    const fullBtn = document.getElementById('btn-fullscreen');
    if (fullBtn) {
      fullBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  bindCustomizerControls() {
    document.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        this.applyColorToSelectedPart(color);
      });
    });

    const colorPicker = document.getElementById('color-picker-input');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.applyColorToSelectedPart(e.target.value);
      });
    }

    const hexInput = document.getElementById('hex-color-input');
    if (hexInput) {
      hexInput.addEventListener('change', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          this.applyColorToSelectedPart(val);
        }
      });
    }

    document.querySelectorAll('.material-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const mat = e.currentTarget.dataset.material;
        this.applyMaterialToSelectedPart(mat);
      });
    });

    const roughSlider = document.getElementById('roughness-slider');
    if (roughSlider) {
      roughSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) / 100;
        document.getElementById('roughness-val').textContent = e.target.value + '%';
        if (this.selectedPart && this.selectedPart.mesh.material) {
          this.selectedPart.mesh.material.roughness = val;
          this.selectedPart.mesh.material.needsUpdate = true;
        }
      });
    }

    const metalSlider = document.getElementById('metalness-slider');
    if (metalSlider) {
      metalSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) / 100;
        document.getElementById('metalness-val').textContent = e.target.value + '%';
        if (this.selectedPart && this.selectedPart.mesh.material) {
          this.selectedPart.mesh.material.metalness = val;
          this.selectedPart.mesh.material.needsUpdate = true;
        }
      });
    }

    const logoInput = document.getElementById('decal-file-input');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && this.selectedPart) {
          const img = new Image();
          img.onload = () => {
            this.matMgr.applyLogoTexture(this.selectedPart.mesh.material, img);
            this.showToast('Fleet logo applied to ' + this.selectedPart.name);
          };
          img.src = URL.createObjectURL(file);
        }
      });
    }

    const engraveInput = document.getElementById('engrave-text-input');
    if (engraveInput) {
      engraveInput.addEventListener('input', (e) => {
        if (this.selectedPart) {
          this.matMgr.applyEngravedText(this.selectedPart.mesh.material, e.target.value);
        }
      });
    }
  }

  bindCustomFileUpload() {
    const fileInput = document.getElementById('custom-model-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.showToast('Loading custom 3D model: ' + file.name);
          this.modelMgr.loadCustomGLTF(
            file,
            (parts) => {
              this.populatePartsList(parts);
              if (parts.length > 0) this.selectPart(parts[0]);
              document.querySelectorAll('.model-tab-btn').forEach((b) => b.classList.remove('active'));
              document.getElementById('tab-custom-upload').classList.add('active');
              this.showToast(`Custom model loaded with ${parts.length} customizable components!`);
            },
            (err) => {
              console.error(err);
              this.showToast('Failed to load 3D file. Ensure it is a valid .glb or .gltf file.');
            }
          );
        }
      });
    }

    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.addEventListener('dragover', (e) => e.preventDefault());
      canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.name.match(/\.(glb|gltf)$/i)) {
            this.showToast('Loading dropped 3D model: ' + file.name);
            this.modelMgr.loadCustomGLTF(file, (parts) => {
              this.populatePartsList(parts);
              if (parts.length > 0) this.selectPart(parts[0]);
              document.querySelectorAll('.model-tab-btn').forEach((b) => b.classList.remove('active'));
              document.getElementById('tab-custom-upload').classList.add('active');
              this.showToast(`Custom model loaded with ${parts.length} components!`);
            });
          }
        }
      });
    }
  }

  bindModals() {
    const embedModal = document.getElementById('embed-modal');
    const embedBtn = document.getElementById('btn-open-embed-modal');
    const closeEmbedBtn = document.getElementById('btn-close-embed-modal');
    const copyEmbedBtn = document.getElementById('btn-copy-embed-code');

    if (embedBtn && embedModal) {
      embedBtn.addEventListener('click', () => {
        const snippet = this.embedMgr.generateGoogleSitesEmbedCode();
        document.getElementById('embed-code-textarea').textContent = snippet;
        embedModal.classList.add('active');
      });
    }

    if (closeEmbedBtn && embedModal) {
      closeEmbedBtn.addEventListener('click', () => embedModal.classList.remove('active'));
    }

    if (copyEmbedBtn) {
      copyEmbedBtn.addEventListener('click', () => {
        const text = document.getElementById('embed-code-textarea').textContent;
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('Google Sites Embed code copied to clipboard!');
        });
      });
    }

    const quoteModal = document.getElementById('quote-modal');
    const quoteBtn = document.getElementById('btn-request-quote');
    const closeQuoteBtn = document.getElementById('btn-close-quote-modal');
    const submitQuoteBtn = document.getElementById('btn-submit-quote');

    if (quoteBtn && quoteModal) {
      quoteBtn.addEventListener('click', () => {
        const { summaryHtml, configHash } = this.embedMgr.generateConfigSummary();
        document.getElementById('quote-summary-list').innerHTML = summaryHtml;
        document.getElementById('config-hash-badge').textContent = configHash;
        quoteModal.classList.add('active');
      });
    }

    if (closeQuoteBtn && quoteModal) {
      closeQuoteBtn.addEventListener('click', () => quoteModal.classList.remove('active'));
    }

    if (submitQuoteBtn && quoteModal) {
      submitQuoteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('customer-email-input').value;
        if (!email) {
          alert('Please enter your email address.');
          return;
        }
        this.showToast('Equipment specification inquiry submitted!');
        quoteModal.classList.remove('active');
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CustomizerApp();
});
