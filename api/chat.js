export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, state } = req.body || {};
    const text = (message || '').toLowerCase();
    const actions = [];
    const replyParts = [];

    // 1. REPAIR / ASSEMBLE
    if (text.includes('repair') || text.includes('assemble') || text.includes('pasang') || text.includes('cantum') || text.includes('reset')) {
      actions.push({ type: 'assemble_model', progress: 0.0 });
      actions.push({ type: 'set_kinematics', slew: 0, elevation: 0, extension: 0, jib: 0 });
      replyParts.push("Repaired and assembled all components back into 1 solid machine.");
    }
    // 2. SEPARATE / EXPLODE
    else if (text.includes('separate') || text.includes('explode') || text.includes('lego') || text.includes('disassemble') || text.includes('asingkan')) {
      actions.push({ type: 'explode_model', progress: 1.0 });
      replyParts.push("Separated all modular components into exploded LEGO mode.");
    }
    // 3. ROTATE / SLEW
    else if (text.includes('turn 90') || text.includes('rotate 90') || text.includes('pusing 90')) {
      actions.push({ type: 'set_kinematics', slew: 90 });
      replyParts.push("Rotated turntable slew 90°.");
    }
    // 4. ELEVATION
    else if (text.includes('elevate') || text.includes('lift') || text.includes('naik')) {
      actions.push({ type: 'set_kinematics', elevation: 45 });
      replyParts.push("Elevated main boom to 45°.");
    }
    // 5. EXTENSION
    else if (text.includes('extend') || text.includes('panjang')) {
      actions.push({ type: 'set_kinematics', extension: 75 });
      replyParts.push("Extended telescopic boom to 75%.");
    }
    // 6. DEFAULT GUIDANCE
    else {
      replyParts.push("Gemini 3.0 Pro Ultra AI Copilot active and ready for commands!");
    }

    return res.status(200).json({
      reply: replyParts.join(' '),
      actions: actions
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
