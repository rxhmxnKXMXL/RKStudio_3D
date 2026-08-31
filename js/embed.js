/**
 * Google Sites Embed Helper, Export & Quote Manager
 */

class EmbedAndExportManager {
  constructor(app) {
    this.app = app;
    this.gltfExporter = new THREE.GLTFExporter();
  }

  /**
   * Generates the Google Sites Embed Code HTML iframe snippet
   */
  generateGoogleSitesEmbedCode(options = {}) {
    const width = options.width || '100%';
    const height = options.height || '720px';
    const embedUrl = options.appUrl || `https://rkstudio3d.netlify.app/?embed=true&auth=mandrossa2026`;

    const iframeCode = `<!-- Mandrossa & RK Studio 3D Interactive Equipment Customizer -->
<div style="position: relative; width: ${width}; height: ${height}; max-width: 100%; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.25);">
  <iframe 
    src="${embedUrl}" 
    width="100%" 
    height="100%" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; xr-spatial-tracking" 
    allowfullscreen
    style="border: none; display: block;">
  </iframe>
</div>`;

    return iframeCode;
  }

  /**
   * Capture and Download 2K PNG Snapshot
   */
  downloadSnapshot() {
    this.app.showToast('Rendering high-resolution 2K snapshot...');
    setTimeout(() => {
      const dataUrl = this.app.sceneCtrl.captureSnapshot(2560, 1440);
      const link = document.createElement('a');
      link.download = `custom-3d-model-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      this.app.showToast('Snapshot downloaded successfully!');
    }, 100);
  }

  /**
   * Export customized 3D Model as binary .GLB file
   */
  exportGLB() {
    this.app.showToast('Preparing 3D model .GLB export...');
    const modelGroup = this.app.sceneCtrl.currentModelGroup;

    this.gltfExporter.parse(
      modelGroup,
      (gltfBuffer) => {
        const blob = new Blob([gltfBuffer], { type: 'model/gltf-binary' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customized-${this.app.modelMgr.currentModelName}-${Date.now()}.glb`;
        link.click();
        this.app.showToast('3D Model exported as .GLB!');
      },
      (error) => {
        console.error('Error exporting GLTF:', error);
        this.app.showToast('Failed to export 3D model.');
      },
      { binary: true }
    );
  }

  /**
   * Generate Bill of Materials & Config Code
   */
  generateConfigSummary() {
    const parts = this.app.modelMgr.customizableParts;
    const modelName = this.app.modelMgr.currentModelName.toUpperCase();
    const configHash = 'CFG-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    let itemsHtml = '';
    const summaryData = {
      model: modelName,
      configCode: configHash,
      date: new Date().toLocaleDateString(),
      parts: [],
    };

    parts.forEach((p) => {
      const partInfo = {
        name: p.name,
        color: p.colorHex,
        material: p.materialPreset,
      };
      summaryData.parts.push(partInfo);

      itemsHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px;">
          <span style="font-weight: 600; color: #f0f6fc;">${p.name}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${p.colorHex}; border: 1px solid rgba(255,255,255,0.3);"></span>
            <span style="color: #8b949e; text-transform: capitalize;">${p.materialPreset} (${p.colorHex})</span>
          </div>
        </div>
      `;
    });

    return {
      summaryHtml: itemsHtml,
      configHash: configHash,
      data: summaryData,
    };
  }
}

window.EmbedAndExportManager = EmbedAndExportManager;
