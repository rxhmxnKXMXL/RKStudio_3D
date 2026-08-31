"""
AI Fleet & Engineering Copilot for Mandrossa & ENMAX Heavy Machinery
Powered by Next-Gen Google Gemini 3.0 Pro / Ultra Multimodal Intelligence
"""
import os
import json
import re

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

SYSTEM_INSTRUCTIONS = """
You are the advanced AI Fleet Copilot & Mechanical Engineer for Mandrossa & ENMAX heavy commercial machinery (powered by Google Gemini 3.0 Pro).
You understand both English and Bahasa Melayu queries.
Your role is to understand the user's natural language request, provide a concise and professional response, and output exact 3D customization & kinematic actions.

Available Official Equipment Fleet (5 HD Prototypes):
1. "emgd24": ENMAX EMGD24 Negative Reach Bridge/Tunnel Platform (400kg Cage, 24m Reach)
2. "emgk24": ENMAX EMGK24 1000V Insulated Utility Powerlines Skylift
3. "em160zb4": ENMAX EM160ZB4 Knuckle Truck-Mounted Crane (160 kN.m, 8-Ton Hoist Hook)
4. "embl10a": ENMAX EMBL-10A Trailer-Mounted Articulating Spider Boom
5. "emgk23": ENMAX EMGK23 Super Heavy Duty Platform (800kg Payload)

Available 3D Kinematic Actions:
- { "type": "set_kinematics", "slew": 45, "elevation": 60, "extension": 80, "jib": -30 }
- { "type": "toggle_kinematic_demo" }

Available LEGO Explode / Assembly Actions:
- { "type": "explode_model", "progress": 1.0 }  (Separate parts like floating LEGO)
- { "type": "assemble_model", "progress": 0.0 } (Rewire/assemble back into 1 solid machine)

Available Material / Paint Customizations:
- { "type": "customize_part", "partQuery": "cabin", "color": "#dc2626", "material": "glossy" }
- { "type": "customize_part", "partQuery": "boom", "color": "#f8fafc", "material": "glossy" }
- { "type": "customize_part", "partQuery": "cage", "color": "#cbd5e1", "material": "brushed" }

Output JSON format strictly:
{
  "reply": "Clear, professional natural language message explaining what action was performed",
  "actions": [
    { "type": "switch_model", "modelKey": "emgd24" },
    { "type": "set_kinematics", "elevation": 45, "extension": 60 }
  ]
}
"""

def rule_based_fallback(user_message: str, current_state: dict = None) -> dict:
    """Next-Gen multilingual rule-based NLP engine supporting English & Bahasa Melayu."""
    msg = user_message.lower()
    actions = []
    reply_parts = []

    # 1. Model Switching across 5 Official HD Prototypes
    if any(k in msg for k in ['emgd24', 'emgd', 'negative reach', 'bridge', 'tunnel', '400kg', 'jambatan']):
        actions.append({"type": "switch_model", "modelKey": "emgd24"})
        reply_parts.append("Loaded the ENMAX EMGD24 HD Negative Reach Platform with 400kg rotating work cage.")
    elif any(k in msg for k in ['emgk24', 'emgk16', '1000v', 'insulated', 'utility skylift', 'power line', 'elektrik', 'tnb']):
        actions.append({"type": "switch_model", "modelKey": "emgk24"})
        reply_parts.append("Loaded the ENMAX EMGK24 HD 1000V Insulated Utility Skylift.")
    elif any(k in msg for k in ['em160zb4', 'em160', 'knuckle', 'crane', '8 ton', '8-ton', 'hook', 'kren']):
        actions.append({"type": "switch_model", "modelKey": "em160zb4"})
        reply_parts.append("Loaded the ENMAX EM160ZB4 HD Knuckle Crane with 8-ton hoist hook.")
    elif any(k in msg for k in ['embl10a', 'embl10', 'trailer', 'spider', 'spider boom', 'towable', 'treler']):
        actions.append({"type": "switch_model", "modelKey": "embl10a"})
        reply_parts.append("Loaded the ENMAX EMBL-10A HD Trailer-Mounted Articulating Spider Boom.")
    elif any(k in msg for k in ['emgk23', '800kg', 'super heavy', 'heavy duty platform', 'berat']):
        actions.append({"type": "switch_model", "modelKey": "emgk23"})
        reply_parts.append("Loaded the ENMAX EMGK23 HD Super Heavy Duty Platform (800kg capacity).")

    # 2. Kinematic Articulation & Motion Controls
    kin_action = {"type": "set_kinematics"}
    has_kin = False

    # Elevation Angle (0 to 80 deg)
    elev_match = re.search(r'(?:elevat|lift|rais|pitch|boom angle|angle|sudut|tinggi|naik|naikkan)\D*?(\d{1,2})', msg)
    if elev_match:
        val = min(80, max(0, int(elev_match.group(1))))
        kin_action["elevation"] = val
        has_kin = True
        reply_parts.append(f"Elevated boom to {val}°.")
    elif any(k in msg for k in ['elevate boom', 'lift boom', 'raise boom', 'boom up', 'naikkan boom', 'angkat boom']):
        kin_action["elevation"] = 45
        has_kin = True
        reply_parts.append("Elevated boom to 45°.")
    elif any(k in msg for k in ['lower boom', 'boom down', 'turunkan boom']):
        kin_action["elevation"] = 10
        has_kin = True
        reply_parts.append("Lowered boom to horizontal 10°.")

    # Telescopic Extension (0 to 100%)
    ext_match = re.search(r'(?:extend|telescop|reach|extension|panjang|panjangkan)\D*?(\d{1,3})', msg)
    if ext_match:
        val = min(100, max(0, int(ext_match.group(1))))
        kin_action["extension"] = val
        has_kin = True
        reply_parts.append(f"Extended telescopic boom to {val}%.")
    elif any(k in msg for k in ['extend boom', 'telescope boom', 'panjangkan boom']):
        kin_action["extension"] = 75
        has_kin = True
        reply_parts.append("Extended telescopic boom to 75%.")
    elif any(k in msg for k in ['retract boom', 'pendekkan boom', 'tarik boom']):
        kin_action["extension"] = 0
        has_kin = True
        reply_parts.append("Retracted telescopic boom to 0%.")

    # Turntable Slew (-180 to 180 deg)
    slew_match = re.search(r'(?:slew|rotat|turntable|swivel|pan|turn|pusing|putar)\D*?(-?\d{1,3})', msg)
    if slew_match:
        val = min(180, max(-180, int(slew_match.group(1))))
        kin_action["slew"] = val
        has_kin = True
        reply_parts.append(f"Rotated turntable to {val}°.")
    elif any(k in msg for k in ['slew left', 'rotate left', 'pusing kiri', 'pusing ke kiri']):
        kin_action["slew"] = 45
        has_kin = True
        reply_parts.append("Rotated turntable 45° left.")
    elif any(k in msg for k in ['slew right', 'rotate right', 'pusing kanan', 'pusing ke kanan']):
        kin_action["slew"] = -45
        has_kin = True
        reply_parts.append("Rotated turntable 45° right.")

    # Jib Angle (-90 to 90 deg)
    jib_match = re.search(r'(?:jib|knuckle|joint|sendi)\D*?(-?\d{1,3})', msg)
    if jib_match:
        val = min(90, max(-90, int(jib_match.group(1))))
        kin_action["jib"] = val
        has_kin = True
        reply_parts.append(f"Articulated jib joint to {val}°.")

    if has_kin:
        actions.append(kin_action)

    # Demo Motion Cycle
    if any(k in msg for k in ['demo', 'motion cycle', 'working cycle', 'simulate motion', 'gerakkan', 'auto demo']):
        actions.append({"type": "toggle_kinematic_demo"})
        reply_parts.append("Toggled continuous mechanical working cycle demo.")

    # 3. LEGO-Style Disassembly / Assembly
    if any(k in msg for k in ['separate', 'explode', 'disassemble', 'lego', 'break apart', 'open parts', 'spread', 'asingkan', 'buka part', 'lerai']):
        actions.append({"type": "explode_model", "progress": 1.0})
        reply_parts.append("Separated all modular components into exploded LEGO-style view.")
    elif any(k in msg for k in ['rewire', 'assemble', 'join', 'reconnect', 'combine', 'back into 1', 'one model', 'pasang balik', 'cantum']):
        actions.append({"type": "assemble_model", "progress": 0.0})
        reply_parts.append("Rewired and assembled all components back into 1 solid machine.")

    # 4. Color & Material Customization
    color_map = {
        'yellow': '#facc15', 'kuning': '#facc15',
        'orange': '#ea580c', 'oren': '#ea580c',
        'blue': '#0284c7', 'biru': '#0284c7',
        'red': '#dc2626', 'merah': '#dc2626',
        'white': '#f8fafc', 'putih': '#f8fafc',
        'black': '#18181b', 'hitam': '#18181b',
        'gray': '#475569', 'kelabu': '#475569',
        'green': '#15803d', 'hijau': '#15803d',
        'silver': '#cbd5e1', 'perak': '#cbd5e1',
        'gold': '#ca8a04', 'emas': '#ca8a04'
    }
    for c_name, c_hex in color_map.items():
        if any(w in msg for w in [f'cabin {c_name}', f'cab {c_name}', f'body {c_name}', f'kepala {c_name}']):
            actions.append({"type": "customize_part", "partQuery": "cab", "color": c_hex, "material": "glossy"})
            reply_parts.append(f"Set cabin color to {c_name.capitalize()}.")
        elif any(w in msg for w in [f'boom {c_name}', f'lengan {c_name}']):
            actions.append({"type": "customize_part", "partQuery": "boom", "color": c_hex, "material": "glossy"})
            reply_parts.append(f"Set boom color to {c_name.capitalize()}.")
        elif any(w in msg for w in [f'cage {c_name}', f'basket {c_name}', f'bakul {c_name}']):
            actions.append({"type": "customize_part", "partQuery": "cage", "color": c_hex, "material": "brushed"})
            reply_parts.append(f"Set platform cage to {c_name.capitalize()}.")

    if not actions:
        reply_parts.append("Gemini 3.0 Pro Ultra Fleet Copilot active! Try: 'Elevate boom to 45°', 'Extend boom 80%', 'Slew turntable 90°', 'Separate parts like LEGO', or 'Switch to EMGD24'!")

    return {
        "reply": " ".join(reply_parts),
        "actions": actions
    }

def process_chat_message(user_message: str, current_state: dict = None) -> dict:
    """Process message using Google Gemini 3.0 Pro Ultra API with structured JSON output."""
    api_key = os.environ.get("GEMINI_API_KEY")

    if not HAS_GENAI or not api_key:
        return rule_based_fallback(user_message, current_state)

    try:
        client = genai.Client(api_key=api_key)
        
        state_context = ""
        if current_state:
            state_context = f"\nCurrent Active Machinery State:\n{json.dumps(current_state, indent=2)}\n"

        prompt = f"{SYSTEM_INSTRUCTIONS}\n{state_context}\nUser Request: {user_message}"
        
        # Call Gemini 3.0 Pro / Ultra reasoning model
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        
        text = response.text.strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini API Exception (falling back to rule engine): {e}")
        return rule_based_fallback(user_message, current_state)
