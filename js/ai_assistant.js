/**
 * AI Assistant Chat & Action Dispatcher for 3D Customizer
 * Supports Kinematic Motion Controls, LEGO Disassembly, Exploded View, Rewiring & Voice/Text Customization
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
      "👋 Hello! I'm your **Gemini 3.0 Pro Ultra Fleet Copilot**. You can give me voice/text commands in English or Bahasa Melayu to control the boom (*'Elevate boom to 45°'*, *'Panjangkan boom 80%'*, *'Rotate turntable 90°'*), run mechanical cycles (*'Run motion demo'*), separate parts like LEGO (*'Separate parts'*), or customize colors!"
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

    try {
      const currentState = {
        currentModel: this.app.modelMgr.currentModelKey,
        isExploded: this.app.isExploded,
        kinematics: this.app.modelMgr.kinematics,
        selectedPart: this.app.selectedPart ? this.app.selectedPart.name : null,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, state: currentState })
      });

      const data = await response.json();
      this.removeTypingIndicator(typingId);

      if (data.reply) {
        this.appendAssistantMessage(data.reply);
      }

      if (data.actions && Array.isArray(data.actions)) {
        this.executeActionsSequentially(data.actions);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      this.removeTypingIndicator(typingId);
      this.appendAssistantMessage("I encountered an issue connecting to the AI agent. Rule-based fallback is active.");
    } finally {
      this.isProcessing = false;
    }
  }

  async executeActionsSequentially(actions) {
    for (const action of actions) {
      await this.executeAction(action);
      await new Promise((r) => setTimeout(r, 200));
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
          this.app.showToast('🧩 Model disassembled into separated parts!');
        });
        break;

      case 'assemble_model':
        this.app.isExploded = false;
        this.app.modelMgr.animateExplosion(0.0, 700, () => {
          this.app.updateExplodeUI(0.0);
          this.app.showToast('🔗 Model rewired into 1 complete machine!');
        });
        break;

      case 'customize_part':
        const query = (action.partQuery || '').toLowerCase();
        let targetPart = null;

        if (query) {
          targetPart = this.app.modelMgr.customizableParts.find((p) => {
            const name = p.name.toLowerCase();
            return name.includes(query) || (query.includes('cab') && name.includes('cabin')) || (query.includes('boom') && name.includes('telescopic'));
          });
        }

        if (!targetPart && this.app.selectedPart) {
          targetPart = this.app.selectedPart;
        }

        if (targetPart) {
          this.app.selectPart(targetPart);

          if (action.material) {
            this.app.applyMaterialToSelectedPart(action.material);
          }

          if (action.color) {
            this.app.applyColorToSelectedPart(action.color);
          }
        }
        break;

      case 'set_camera':
        if (action.view) {
          this.app.sceneCtrl.setCameraPreset(action.view);
          document.querySelectorAll('.cam-preset-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.view === action.view);
          });
        }
        break;

      case 'set_env':
        if (action.env) {
          this.app.sceneCtrl.setEnvironmentPreset(action.env);
          document.querySelectorAll('.env-preset-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.env === action.env);
          });
        }
        break;

      case 'set_fleet_id':
        if (action.text && this.app.selectedPart) {
          const engraveInput = document.getElementById('engrave-text-input');
          if (engraveInput) engraveInput.value = action.text;
          this.app.matMgr.applyEngravedText(this.app.selectedPart.mesh.material, action.text);
          this.app.showToast(`Stamped Fleet ID: ${action.text}`);
        }
        break;

      case 'toggle_auto_rotate':
        const active = this.app.sceneCtrl.toggleAutoRotate();
        const autoRotateBtn = document.getElementById('btn-auto-rotate');
        if (autoRotateBtn) autoRotateBtn.classList.toggle('active', active);
        break;

      case 'take_snapshot':
        this.app.embedMgr.downloadSnapshot();
        break;

      case 'open_quote':
        const quoteBtn = document.getElementById('btn-request-quote');
        if (quoteBtn) quoteBtn.click();
        break;
    }
  }

  appendUserMessage(text) {
    if (!this.messagesContainer) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-message user';
    msgEl.innerHTML = `<div class="message-bubble">${this.escapeHTML(text)}</div>`;
    this.messagesContainer.appendChild(msgEl);
    this.scrollToBottom();
  }

  appendAssistantMessage(text) {
    if (!this.messagesContainer) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-message assistant';
    msgEl.innerHTML = `
      <div class="assistant-avatar">🤖</div>
      <div class="message-bubble">${this.formatMarkdown(text)}</div>
    `;
    this.messagesContainer.appendChild(msgEl);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    if (!this.messagesContainer) return null;
    const id = 'typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.id = id;
    typingEl.className = 'ai-message assistant typing';
    typingEl.innerHTML = `
      <div class="assistant-avatar">🤖</div>
      <div class="message-bubble typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    this.messagesContainer.appendChild(typingEl);
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

  formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
}

window.AIAssistant = AIAssistant;
