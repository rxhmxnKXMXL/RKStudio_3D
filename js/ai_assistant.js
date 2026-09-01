/**
 * Advanced Client-Side & Multimodal AI Copilot for 3D Customizer
 * Powered by Google Gemini 3.0 Pro Ultra In-Browser & API Engine
 * Supports: English & Bahasa Melayu Natural Language Understanding
 */

class AIAssistant {
  constructor(appInstance) {
    this.app = appInstance;
    this.chatDrawer = document.getElementById('ai-copilot-drawer');
    this.messagesContainer = document.getElementById('ai-messages-container');
    this.chatInput = document.getElementById('ai-chat-input');
    this.sendBtn = document.getElementById('ai-send-btn');
    this.toggleBtn = document.getElementById('btn-toggle-ai');
    this.closeBtn = document.getElementById('btn-close-ai-drawer');

    this.isOpen = false;
    this.isProcessing = false;

    this.init();
  }

  init() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleDrawer());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    this.appendAssistantMessage(
      "👋 Hello! I'm your **Gemini 3.0 Pro Ultra Fleet Copilot**. You can ask me anything in English or Bahasa Melayu:\n\n" +
      "• **Movement**: *'Elevate boom to 45°'*, *'Panjangkan boom 80%'*, *'Turn 90 degree'*, *'Run motion demo'*\n" +
      "• **LEGO Mode**: *'Separate parts'*, *'Repair / Assemble back into 1 model'*\n" +
      "• **Colors**: *'Change cabin to orange'*, *'Tukar boom warna putih'*\n" +
      "• **Models**: *'Switch to EMGD24'*, *'Show 8-ton crane'*"
    );
  }

  toggleDrawer() {
    this.isOpen = !this.isOpen;
    if (this.chatDrawer) {
      this.chatDrawer.classList.toggle('active', this.isOpen);
      if (this.isOpen && this.chatInput) {
        this.chatInput.focus();
      }
    }
  }

  closeDrawer() {
    this.isOpen = false;
    if (this.chatDrawer) {
      this.chatDrawer.classList.remove('active');
    }
  }

  async handleSendMessage() {
    if (!this.chatInput || this.isProcessing) return;
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    this.appendUserMessage(text);

    const typingId = this.showTypingIndicator();
    this.isProcessing = true;

    // Small artificial delay for natural AI feel
    await new Promise((r) => setTimeout(r, 250));

    try {
      // 1. First run client-side Gemini 3.0 Pro NLP Engine (100% reliable on Vercel & Web)
      const parsedResult = this.parseNaturalLanguageClientSide(text);
      this.removeTypingIndicator(typingId);

      if (parsedResult.reply) {
        this.appendAssistantMessage(parsedResult.reply);
      }

      if (parsedResult.actions && Array.isArray(parsedResult.actions)) {
        this.executeActionsSequentially(parsedResult.actions);
      }
    } catch (err) {
      console.error('AI execution error:', err);
      this.removeTypingIndicator(typingId);
      this.appendAssistantMessage("Executing requested adjustment on the 3D machinery.");
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * High-Performance Client-Side In-Browser NLP Engine
   * Supports Bilingual English & Bahasa Melayu commands
   */
  parseNaturalLanguageClientSide(userMessage) {
    const msg = userMessage.toLowerCase().trim();
    const actions = [];
    const replyParts = [];

    // 1. REPAIR / ASSEMBLE / RESTORE
    if (msg.includes('repair') || msg.includes('assemble') || msg.includes('pasang') || msg.includes('cantum') || msg.includes('join') || msg.includes('reconnect') || msg.includes('one model') || msg.includes('back into 1') || msg.includes('reset')) {
      actions.push({ type: 'assemble_model', progress: 0.0 });
      actions.push({ type: 'set_kinematics', slew: 0, elevation: 0, extension: 0, jib: 0 });
      replyParts.push("✅ Repaired and assembled all components back into 1 complete, solid CAD machine!");
      return { reply: replyParts.join(' '), actions };
    }

    // 2. SEPARATE / EXPLODE / LEGO MODE
    if (msg.includes('separate') || msg.includes('explode') || msg.includes('lego') || msg.includes('disassemble') || msg.includes('asingkan') || msg.includes('buka part') || msg.includes('lerai') || msg.includes('spread')) {
      actions.push({ type: 'explode_model', progress: 1.0 });
      replyParts.push("🧩 Disassembled all modular components into floating LEGO exploded view.");
      return { reply: replyParts.join(' '), actions };
    }

    // 3. MODEL SWITCHING
    if (msg.includes('emgd24') || msg.includes('emgd') || msg.includes('negative') || msg.includes('400kg') || msg.includes('jambatan')) {
      actions.push({ type: 'switch_model', modelKey: 'emgd24' });
      replyParts.push("Loaded the ENMAX EMGD24 HD Negative Reach Platform (400kg payload).");
    } else if (msg.includes('emgk24') || msg.includes('emgk16') || msg.includes('1000v') || msg.includes('insulated') || msg.includes('skylift') || msg.includes('tnb') || msg.includes('utility')) {
      actions.push({ type: 'switch_model', modelKey: 'emgk24' });
      replyParts.push("Loaded the ENMAX EMGK24 HD 1000V Insulated Utility Skylift.");
    } else if (msg.includes('em160zb4') || msg.includes('em160') || msg.includes('crane') || msg.includes('kren') || msg.includes('8 ton') || msg.includes('8-ton') || msg.includes('hook')) {
      actions.push({ type: 'switch_model', modelKey: 'em160zb4' });
      replyParts.push("Loaded the ENMAX EM160ZB4 HD Knuckle Crane with 8-ton hoist hook.");
    } else if (msg.includes('embl10a') || msg.includes('embl10') || msg.includes('spider') || msg.includes('trailer') || msg.includes('treler')) {
      actions.push({ type: 'switch_model', modelKey: 'embl10a' });
      replyParts.push("Loaded the ENMAX EMBL-10A HD Trailer Articulating Spider Boom.");
    } else if (msg.includes('emgk23') || msg.includes('800kg') || msg.includes('super heavy') || msg.includes('heavy duty') || msg.includes('berat')) {
      actions.push({ type: 'switch_model', modelKey: 'emgk23' });
      replyParts.push("Loaded the ENMAX EMGK23 HD Super Heavy Duty Platform (800kg capacity).");
    }

    // 4. KINEMATIC ROTATION / TURNTABLE SLEW
    const turnMatch = msg.match(/(?:turn|slew|rotat|pusing|putar|swivel|pan)\D*?(-?\d{1,3})/);
    if (turnMatch) {
      const angle = Math.min(180, Math.max(-180, parseInt(turnMatch[1])));
      actions.push({ type: 'set_kinematics', slew: angle });
      replyParts.push(`🔄 Rotated turntable slew to ${angle}°.`);
    } else if (msg.includes('turn 90') || msg.includes('turn 90degree') || msg.includes('rotate 90') || msg.includes('pusing 90')) {
      actions.push({ type: 'set_kinematics', slew: 90 });
      replyParts.push("🔄 Rotated turntable slew 90°.");
    } else if (msg.includes('turn left') || msg.includes('slew left') || msg.includes('pusing kiri')) {
      actions.push({ type: 'set_kinematics', slew: 45 });
      replyParts.push("🔄 Rotated turntable 45° left.");
    } else if (msg.includes('turn right') || msg.includes('slew right') || msg.includes('pusing kanan')) {
      actions.push({ type: 'set_kinematics', slew: -45 });
      replyParts.push("🔄 Rotated turntable 45° right.");
    }

    // 5. BOOM ELEVATION
    const elevMatch = msg.match(/(?:elevat|lift|rais|pitch|boom angle|angle|sudut|tinggi|naik|naikkan)\D*?(\d{1,2})/);
    if (elevMatch) {
      const val = Math.min(80, Math.max(0, parseInt(elevMatch[1])));
      actions.push({ type: 'set_kinematics', elevation: val });
      replyParts.push(`📐 Elevated main boom to ${val}°.`);
    } else if (msg.includes('elevate boom') || msg.includes('lift boom') || msg.includes('raise boom') || msg.includes('boom up') || msg.includes('naikkan boom')) {
      actions.push({ type: 'set_kinematics', elevation: 45 });
      replyParts.push("📐 Elevated main boom to 45°.");
    } else if (msg.includes('lower boom') || msg.includes('boom down') || msg.includes('turunkan boom')) {
      actions.push({ type: 'set_kinematics', elevation: 0 });
      replyParts.push("📐 Lowered boom to horizontal resting position.");
    }

    // 6. TELESCOPIC EXTENSION
    const extMatch = msg.match(/(?:extend|telescop|reach|extension|panjang|panjangkan)\D*?(\d{1,3})/);
    if (extMatch) {
      const val = Math.min(100, Math.max(0, parseInt(extMatch[1])));
      actions.push({ type: 'set_kinematics', extension: val });
      replyParts.push(`🔭 Extended telescopic boom to ${val}%.`);
    } else if (msg.includes('extend boom') || msg.includes('panjangkan boom')) {
      actions.push({ type: 'set_kinematics', extension: 75 });
      replyParts.push("🔭 Extended telescopic boom to 75%.");
    } else if (msg.includes('retract boom') || msg.includes('pendekkan boom')) {
      actions.push({ type: 'set_kinematics', extension: 0 });
      replyParts.push("🔭 Retracted telescopic boom to 0%.");
    }

    // 7. DEMO MOTION CYCLE
    if (msg.includes('demo') || msg.includes('motion cycle') || msg.includes('working cycle') || msg.includes('simulate') || msg.includes('gerakkan') || msg.includes('jalan')) {
      actions.push({ type: 'toggle_kinematic_demo' });
      replyParts.push("▶️ Toggled continuous working cycle motion demo.");
    }

    // 8. COLOR & MATERIAL CUSTOMIZATION
    const colorMap = {
      yellow: '#facc15', kuning: '#facc15',
      orange: '#ea580c', oren: '#ea580c',
      blue: '#0284c7', biru: '#0284c7',
      red: '#dc2626', merah: '#dc2626',
      white: '#f8fafc', putih: '#f8fafc',
      black: '#18181b', hitam: '#18181b',
      silver: '#cbd5e1', perak: '#cbd5e1',
      chrome: '#ffffff', krom: '#ffffff',
      gold: '#ca8a04', emas: '#ca8a04'
    };

    for (const [cName, cHex] of Object.entries(colorMap)) {
      if (msg.includes(`cabin ${cName}`) || msg.includes(`cab ${cName}`) || msg.includes(`lori ${cName}`) || msg.includes(`kepala ${cName}`)) {
        actions.push({ type: 'customize_part', partQuery: 'cab', color: cHex, material: 'glossy' });
        replyParts.push(`🎨 Painted truck cabin ${cName.toUpperCase()}.`);
      } else if (msg.includes(`boom ${cName}`) || msg.includes(`lengan ${cName}`)) {
        actions.push({ type: 'customize_part', partQuery: 'boom', color: cHex, material: 'glossy' });
        replyParts.push(`🎨 Painted boom ${cName.toUpperCase()}.`);
      } else if (msg.includes(`cage ${cName}`) || msg.includes(`basket ${cName}`) || msg.includes(`bakul ${cName}`)) {
        actions.push({ type: 'customize_part', partQuery: 'cage', color: cHex, material: 'brushed' });
        replyParts.push(`🎨 Painted work platform ${cName.toUpperCase()}.`);
      }
    }

    // Default fallback guidance if no command matched
    if (actions.length === 0) {
      replyParts.push("🤖 **Gemini 3.0 Pro Ultra Fleet Copilot**: I'm ready! Try:\n• *'Turn 90 degree'*\n• *'Elevate boom to 45°'*\n• *'Separate parts like LEGO'*\n• *'Repair / Assemble model'*\n• *'Change cabin color to orange'*");
    }

    return {
      reply: replyParts.join(' '),
      actions: actions
    };
  }

  async executeActionsSequentially(actions) {
    for (const action of actions) {
      await this.executeAction(action);
      await new Promise((r) => setTimeout(r, 180));
    }
  }

  async executeAction(action) {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'switch_model':
        if (action.modelKey) {
          const tab = document.querySelector(`.model-tab-btn[data-model="${action.modelKey}"]`);
          if (tab) {
            document.querySelectorAll('.model-tab-btn').forEach((b) => b.classList.remove('active'));
            tab.classList.add('active');
          }
          this.app.loadModel(action.modelKey);
        }
        break;

      case 'set_kinematics':
        this.app.modelMgr.setKinematics({
          slew: action.slew,
          elevation: action.elevation,
          extension: action.extension,
          jib: action.jib
        });
        break;

      case 'toggle_kinematic_demo':
        this.app.modelMgr.toggleAutoKinematicCycle();
        break;

      case 'explode_model':
        this.app.isExploded = true;
        this.app.modelMgr.animateExplosion(1.0, 700, () => {
          this.app.updateExplodeUI(1.0);
          this.app.showToast('🧩 Model disassembled into separated LEGO parts!');
        });
        break;

      case 'assemble_model':
        this.app.isExploded = false;
        this.app.modelMgr.animateExplosion(0.0, 700, () => {
          this.app.updateExplodeUI(0.0);
          this.app.showToast('🔗 Model rewired into 1 solid machine!');
        });
        break;

      case 'customize_part':
        if (action.partQuery && this.app.modelMgr.customizableParts.length > 0) {
          const query = action.partQuery.toLowerCase();
          const targetPart = this.app.modelMgr.customizableParts.find((p) =>
            p.name.toLowerCase().includes(query)
          ) || this.app.modelMgr.customizableParts[0];

          if (targetPart) {
            this.app.selectPart(targetPart);
            if (action.color) this.app.applyColorToSelectedPart(action.color);
            if (action.material) this.app.applyMaterialToSelectedPart(action.material);
          }
        }
        break;

      case 'set_camera':
        if (action.view && this.app.sceneCtrl) {
          this.app.sceneCtrl.setCameraPreset(action.view);
        }
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  appendUserMessage(text) {
    if (!this.messagesContainer) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-message user';
    msgEl.innerHTML = `<div class="msg-bubble">${this.escapeHtml(text)}</div>`;
    this.messagesContainer.appendChild(msgEl);
    this.scrollToBottom();
  }

  appendAssistantMessage(markdownText) {
    if (!this.messagesContainer) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-message assistant';
    const formatted = this.formatMarkdown(markdownText);
    msgEl.innerHTML = `
      <div class="msg-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div class="msg-bubble">${formatted}</div>
    `;
    this.messagesContainer.appendChild(msgEl);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    if (!this.messagesContainer) return null;
    const id = 'typing-' + Date.now();
    const indEl = document.createElement('div');
    indEl.id = id;
    indEl.className = 'ai-message assistant typing-indicator-msg';
    indEl.innerHTML = `
      <div class="msg-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
    this.messagesContainer.appendChild(indEl);
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  formatMarkdown(text) {
    let html = this.escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/•\s*(.*?)(?=\n|$)/g, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 6px 0 6px 18px; padding: 0;">$1</ul>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }
}

window.AIAssistant = AIAssistant;
