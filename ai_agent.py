"""
AI Copilot Agent for 3D Equipment Customizer
Powered by Google Gemini / Antigravity SDK
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
You are an intelligent 3D Equipment & Fleet Customizer AI Copilot for Mandrossa & ENMAX heavy machinery.
Your role is to understand the user's natural language request, provide a concise and helpful response, and return exact 3D customization & kinematic actions.

Available Equipment Models:
- "emgd24": ENMAX EMGD24 Negative Reach Bridge/Tunnel Platform (400kg Cage)
- "emgk16": ENMAX EMGK16 Insulated 1000V Power Utility Skylift
- "em160zb4": ENMAX EM160ZB4 Knuckle Truck-Mounted Crane (8-Ton Hook, 160 kN.m)
- "embl10a": ENMAX EMBL-10A Trailer-Mounted Articulating Spider Boom
- "emgk23": ENMAX EMGK23 Super Heavy Duty Platform (800kg Payload)
- "mandrossa": Mandrossa Skylift + Jib Boom (Isuzu NPR)
- "tiller_skylift": Tiller Aerial Skylift Truck (3D Warehouse)

Available Kinematic Motion Actions:
- { "type": "set_kinematics", "slew": 45, "elevation": 60, "extension": 80, "jib": -30 }
- { "type": "toggle_kinematic_demo" }

Available Explode / Assembly Actions:
- { "type": "explode_model", "progress": 1.0 }  (Separate parts into exploded LEGO mode)
- { "type": "assemble_model", "progress": 0.0 } (Rewire/assemble back into 1 solid unit)

Output JSON format strictly:
{
  "reply": "Short natural language message explaining what changes were made",
  "actions": [
    { "type": "switch_model", "modelKey": "emgd24" },
    { "type": "set_kinematics", "elevation": 45, "extension": 60 },
    { "type": "customize_part", "partQuery": "cabin", "color": "#f8fafc", "material": "glossy" },
    { "type": "set_camera", "view": "iso" }
  ]
}
"""

def rule_based_fallback(user_message: str, current_state: dict = None) -> dict:
    """Intelligent rule-based parser when API key is not configured."""
    msg = user_message.lower()
    actions = []
    reply_parts = []

    # 1. Model Switching
    if any(k in msg for k in ['emgd24', 'emgd', 'negative reach', 'bridge', 'tunnel', '400kg']):
        actions.append({"type": "switch_model", "modelKey": "emgd24"})
        reply_parts.append("Loaded the ENMAX EMGD24 Negative Reach Platform with 400kg rotating work cage.")
    elif any(k in msg for k in ['emgk16', '1000v', 'insulated', 'utility skylift', 'power line']):
        actions.append({"type": "switch_model", "modelKey": "emgk16"})
        reply_parts.append("Loaded the ENMAX EMGK16 1000V Insulated Utility Skylift.")
    elif any(k in msg for k in ['em160zb4', 'em160', 'knuckle', 'crane', '8 ton', '8-ton', 'hook']):
        actions.append({"type": "switch_model", "modelKey": "em160zb4"})
        reply_parts.append("Loaded the ENMAX EM160ZB4 Knuckle Crane with 8-ton hoist hook.")
    elif any(k in msg for k in ['embl10a', 'embl10', 'trailer', 'spider', 'spider boom', 'towable']):
        actions.append({"type": "switch_model", "modelKey": "embl10a"})
        reply_parts.append("Loaded the ENMAX EMBL-10A Trailer-Mounted Articulating Spider Boom.")
    elif any(k in msg for k in ['emgk23', '800kg', 'super heavy', 'heavy duty platform']):
        actions.append({"type": "switch_model", "modelKey": "emgk23"})
        reply_parts.append("Loaded the ENMAX EMGK23 Super Heavy Duty Platform with 800kg payload capacity.")
    elif any(k in msg for k in ['mandrossa', 'jib', 'isuzu', 'npr']):
        actions.append({"type": "switch_model", "modelKey": "mandrossa"})
        reply_parts.append("Loaded the Mandrossa Skylift + Jib Boom.")
    elif any(k in msg for k in ['tiller', 'fire truck', '3d warehouse']):
        actions.append({"type": "switch_model", "modelKey": "tiller_skylift"})
        reply_parts.append("Loaded the Tiller Aerial Skylift Truck.")

    # 2. Kinematic Articulation & Motion Controls
    kin_action = {"type": "set_kinematics"}
    has_kin = False

    # Elevation Angle (0 to 80 deg)
    elev_match = re.search(r'(?:elevat|lift|rais|pitch|boom angle|angle)\D*?(\d{1,2})', msg)
    if elev_match:
        val = min(80, max(0, int(elev_match.group(1))))
        kin_action["elevation"] = val
        has_kin = True
        reply_parts.append(f"Elevated boom to {val}°.")
    elif 'elevate boom' in msg or 'lift boom' in msg or 'raise boom' in msg or 'boom up' in msg:
        kin_action["elevation"] = 45
        has_kin = True
        reply_parts.append("Elevated boom to 45°.")
    elif 'lower boom' in msg or 'boom down' in msg:
        kin_action["elevation"] = 10
        has_kin = True
        reply_parts.append("Lowered boom to horizontal 10°.")

    # Telescopic Extension (0 to 100%)
    ext_match = re.search(r'(?:extend|telescop|reach|extension)\D*?(\d{1,3})', msg)
    if ext_match:
        val = min(100, max(0, int(ext_match.group(1))))
        kin_action["extension"] = val
        has_kin = True
        reply_parts.append(f"Extended telescopic boom to {val}%.")
    elif 'extend boom' in msg or 'telescope boom' in msg:
        kin_action["extension"] = 75
        has_kin = True
        reply_parts.append("Extended telescopic boom to 75%.")
    elif 'retract boom' in msg:
        kin_action["extension"] = 0
        has_kin = True
        reply_parts.append("Retracted telescopic boom to 0%.")

    # Turntable Slew (-180 to 180 deg)
    slew_match = re.search(r'(?:slew|rotat|turntable|swivel|pan|turn)\D*?(-?\d{1,3})', msg)
    if slew_match:
        val = min(180, max(-180, int(slew_match.group(1))))
        kin_action["slew"] = val
        has_kin = True
        reply_parts.append(f"Rotated turntable to {val}°.")
    elif 'slew left' in msg or 'rotate left' in msg:
        kin_action["slew"] = 45
        has_kin = True
        reply_parts.append("Rotated turntable 45° left.")
    elif 'slew right' in msg or 'rotate right' in msg:
        kin_action["slew"] = -45
        has_kin = True
        reply_parts.append("Rotated turntable 45° right.")

    # Jib Angle (-90 to 90 deg)
    jib_match = re.search(r'(?:jib|knuckle|joint)\D*?(-?\d{1,3})', msg)
    if jib_match:
        val = min(90, max(-90, int(jib_match.group(1))))
        kin_action["jib"] = val
        has_kin = True
        reply_parts.append(f"Articulated jib joint to {val}°.")

    if has_kin:
        actions.append(kin_action)

    # Demo Cycle
    if 'demo' in msg or 'motion cycle' in msg or 'working cycle' in msg or 'simulate motion' in msg:
        actions.append({"type": "toggle_kinematic_demo"})
        reply_parts.append("Toggled continuous mechanical working cycle motion.")

    # 3. LEGO-Style Disassembly / Assembly
    if any(k in msg for k in ['separate', 'explode', 'disassemble', 'lego', 'break apart', 'open parts', 'spread']):
        actions.append({"type": "explode_model", "progress": 1.0})
        reply_parts.append("Separated all modular components into exploded LEGO-style view.")
    elif any(k in msg for k in ['rewire', 'assemble', 'join', 'reconnect', 'combine', 'back into 1', 'one model']):
        actions.append({"type": "assemble_model", "progress": 0.0})
        reply_parts.append("Rewired and assembled all components back into 1 solid machine.")

    # 4. Individual Part Customization
    color_map = {
        'yellow': '#facc15', 'orange': '#ea580c', 'blue': '#0284c7', 'red': '#dc2626',
        'white': '#f8fafc', 'black': '#18181b', 'gray': '#475569', 'grey': '#475569',
        'lime': '#84cc16', 'green': '#15803d', 'silver': '#cbd5e1', 'gold': '#ca8a04'
    }
    for c_name, c_hex in color_map.items():
        if f'cabin {c_name}' in msg or f'cab {c_name}' in msg or f'body {c_name}' in msg:
            actions.append({"type": "customize_part", "partQuery": "cab", "color": c_hex, "material": "glossy"})
            reply_parts.append(f"Set cabin color to {c_name}.")
        elif f'boom {c_name}' in msg:
            actions.append({"type": "customize_part", "partQuery": "boom", "color": c_hex, "material": "glossy"})
            reply_parts.append(f"Set boom color to {c_name}.")
        elif f'cage {c_name}' in msg or f'basket {c_name}' in msg:
            actions.append({"type": "customize_part", "partQuery": "cage", "color": c_hex, "material": "brushed"})
            reply_parts.append(f"Set work platform to {c_name}.")

    if not actions:
        reply_parts.append("I'm your Mandrossa & ENMAX Fleet Copilot! Try: 'Elevate boom to 45°', 'Extend boom 80%', 'Slew turntable 90°', or 'Run working motion demo'!")

    return {
        "reply": " ".join(reply_parts),
        "actions": actions
    }

def process_chat_message(user_message: str, current_state: dict = None) -> dict:
    """Process message using Gemini 2.5 Flash if available, otherwise rule-based engine."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not HAS_GENAI or not api_key:
        return rule_based_fallback(user_message, current_state)

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
Current 3D Customizer State: {json.dumps(current_state or {})}
User Request: "{user_message}"

Generate the JSON response following the system instructions.
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTIONS,
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Gemini API error, falling back: {e}")
        return rule_based_fallback(user_message, current_state)
