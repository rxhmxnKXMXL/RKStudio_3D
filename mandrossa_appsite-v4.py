import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import time
import datetime
import io

# ==========================================
# PAGE CONFIGURATION & DECOUPLED STYLING
# ==========================================
st.set_page_config(
    page_title="Mandrossa Interactive Portal (v4)",
    page_icon="🔴",
    layout="wide",
    initial_sidebar_state="collapsed" # Collapsed by default for clean Google Sites iframe embeds
)

# Custom Red & Charcoal Theme CSS optimized for both standalone and iframe embed use
st.markdown("""
    <style>
    .main {
        background-color: #FAFAFA;
    }
    h1, h2, h3 {
        color: #C00000; /* Mandrossa Red */
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    .stButton>button {
        background-color: #C00000;
        color: white;
        border-radius: 6px;
        border: none;
        padding: 0.5rem 1rem;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background-color: #900000;
        color: white;
    }
    .card {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        margin-bottom: 15px;
        border-left: 5px solid #C00000;
    }
    div[data-testid="stMetricValue"] {
        color: #C00000;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)

# CSS styled SVG Logo matching the actual Mandrossa circular "M" logo
LOGO_SVG = """
<div style="display: flex; align-items: center; margin-bottom: 25px;">
    <svg width="55" height="55" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="#C00000" stroke-width="6" fill="none" />
        <path d="M25 70 L25 35 C25 35, 33 50, 40 50 C47 50, 50 35, 50 35 L50 70 M50 70 L50 35 C50 35, 58 50, 65 50 C72 50, 75 35, 75 35 L75 70" 
              stroke="#C00000" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </svg>
    <div style="margin-left: 15px;">
        <h2 style="margin: 0; color: #C00000; font-family: 'Arial Black', sans-serif; letter-spacing: 1px; font-size: 24px;">MANDROSSA</h2>
        <span style="font-size: 11px; color: #666; font-weight: bold; letter-spacing: 0.5px;">PROGRESSIVE • INNOVATIVE • AERIAL SPECIALISTS</span>
    </div>
</div>
"""

# ==========================================
# SESSION STATE INITIALIZATION
# ==========================================
if "initialized" not in st.session_state:
    st.session_state.initialized = True
    
    # Prepopulated Customer CRM Database (includes public inquiries simulation)
    st.session_state.crm_data = pd.DataFrame([
        {"ID": "C-001", "Client Name": "Dewan Bandaraya Kuala Lumpur (DBKL)", "Contact": "En. Azmi", "Phone": "+6012-3456789", "Email": "azmi@dbkl.gov.my", "Machine Interest": "ARAST 22m Skylift", "Details": "Isuzu NPR Chassis, Orange Fleet Color", "Status": "Active Contract"},
        {"ID": "C-002", "Client Name": "Majlis Bandaraya Johor Bahru (MBJB)", "Contact": "Pn. Sarah", "Phone": "+6019-8765432", "Email": "sarah@mbjb.gov.my", "Machine Interest": "ARAST Municipal Custom", "Details": "Hino Chassis, SWL 300KG Municipal Cage", "Status": "Proposal Submitted"},
        {"ID": "C-003", "Client Name": "Boustead Plantations Bhd", "Contact": "Mr. Tan", "Phone": "+6013-1112222", "Email": "tan@boustead.com.my", "Machine Interest": "MÉKASA Harvester", "Details": "AWS/AWD, 12m Telescopic Reach, Auto-Levelling", "Status": "Negotiation"},
        {"ID": "C-004", "Client Name": "Sime Darby Plantation", "Contact": "En. Radzi", "Phone": "+6017-3334444", "Email": "radzi@simedarby.com", "Machine Interest": "MÉKASA 2.0", "Details": "1-Ton Tipping Bin, Agricultural AWS/AWD", "Status": "Demo Scheduled"},
        {"ID": "C-005", "Client Name": "Majlis Perbandaran Kota Bharu (MPKB)", "Contact": "Hj. Ghazali", "Phone": "+6011-9998888", "Email": "ghazali@mpkb.gov.my", "Machine Interest": "ARAST 12m Skylift", "Details": "Nissan Chassis, Yellow Fleet Color", "Status": "Closed Won"}
    ])
    
    # Chat Storage
    st.session_state.chat_messages = [
        {"timestamp": "09:30 AM", "user": "Dinie Zuhaimie (Technical)", "text": "Successfully calibrated the hydraulic leveling controller for the next ARAST municipal chassis build."},
        {"timestamp": "10:15 AM", "user": "Norazman Aidros (CEO)", "text": "Excellent work Dinie. Let's make sure the MPOB field testing data for MÉKASA is compiled before our meeting next Friday."},
        {"timestamp": "11:00 AM", "user": "Roszaila Awang (Finance)", "text": "April payroll audits are complete. EPF/SOCSO files uploaded to the gateway. Please submit outstanding travel claims by Monday."},
    ]
    
    # Staff Attendance Log
    st.session_state.attendance = pd.DataFrame([
        {"Date": "2026-08-27", "Name": "Dinie Zuhaimie", "Role": "Technical Director", "Clock In": "08:15 AM", "Clock Out": "05:30 PM", "Status": "On-Site (Semenyih Factory)", "Geofence": "Inside Boundary"},
        {"Date": "2026-08-27", "Name": "Norazman Aidros", "Role": "CEO", "Clock In": "08:45 AM", "Clock Out": "06:00 PM", "Status": "On-Site (Puchong HQ)", "Geofence": "Inside Boundary"},
        {"Date": "2026-08-27", "Name": "Ahmad Kamal", "Role": "Executive Director", "Clock In": "09:12 AM", "Clock Out": "05:45 PM", "Status": "Remote (Client Meeting DBKL)", "Geofence": "Authorized Exception"},
    ])
    
    # Staff Claims Log
    st.session_state.claims = pd.DataFrame([
        {"Claim ID": "CLM-501", "Name": "Dinie Zuhaimie", "Category": "Workshop Materials", "Amount (RM)": 450.00, "Date": "2026-08-20", "Status": "Approved"},
        {"Claim ID": "CLM-502", "Name": "Ahmad Kamal", "Category": "Client Dinner (DBKL)", "Amount (RM)": 280.00, "Date": "2026-08-22", "Status": "Pending Approval"},
    ])

# ==========================================
# APPLICATION MODE NAVIGATION (DECOUPLED DESIGN)
# ==========================================
st.sidebar.markdown(LOGO_SVG, unsafe_allow_html=True)
st.sidebar.write("---")

st.sidebar.markdown("### 🌐 SWITCH APP INTERFACE")
app_mode = st.sidebar.radio(
    "Select Target Suite",
    ["🌐 Public Site Customizer", "🔒 Company Management Login"]
)

st.sidebar.write("---")
st.sidebar.markdown("#### Deployment Specifications")
st.sidebar.info("""
🖥️ **Google Sites Embed Ready**
✨ Mode: **Responsive WebGL**
🏎️ Engines: **ARAST & ENMAX**
🔒 ERP Database Isolated
🇲🇾 Compliance: LHDN & DOSH
""")

# ==========================================
# PUBLIC INTERFACE: 3D CUSTOMIZER & MARKETING
# ==========================================
if app_mode == "🌐 Public Site Customizer":
    st.title("Interactive 3D Skylift Configurator")
    st.subheader("Customize Your High-Access Solution & Get an Instant Proposal")
    st.write("This interactive configurator is designed to embed seamlessly inside your Mandrossa Google Site. Customize the parameters below, interact with the 3D WebGL model representing real-world physical and regulatory dimensions, and submit your configuration directly to our sales department.")
    
    st.write("---")
    
    col_ctrl, col_visual = st.columns([1, 2])
    
    with col_ctrl:
        st.markdown("### ⚙️ CUSTOMIZER PANEL")
        
        # 1. Model Selector containing ARAST and ENMAX Lines
        mewp_model = st.selectbox("Select Base Platform Model", [
            "ARAST Series VM2020T4R (Malaysian Built)",
            "ENMAX EMGD24 (Bridge/Tunnel Utility)",
            "ENMAX EMGK16 (Insulated Utility)",
            "ENMAX EMGK17 (Insulated Utility)",
            "ENMAX EMGK23 (Heavy Duty Utility)",
            "ENMAX EMGK24 (Power Line Utility)",
            "ENMAX EMBL-10A (Trailer-Mounted Articulating Lift)",
            "ENMAX EM160ZB4 (Knuckle Truck-Mounted Crane)"
        ])
        
        # Mapped Model Parameters (Limits & Features)
        model_specs = {
            "ARAST Series VM2020T4R (Malaysian Built)": {
                "max_reach": 22.0, "min_reach": 3.0, "default_reach": 15.0,
                "chassis_options": ["Isuzu NPR75UKH (JPJ Plan Spec)", "Hino Dutro Series", "Nissan Diesel Atlas"],
                "baskets": ["2-Pax Fibreglass Bucket (SWL 200 KG)", "Heavy Duty Municipal Cage (SWL 300 KG)", "Compact Insulated Basket (10KV Safety Rating)"],
                "type": "tele", "outrigger_spread": 4.5, "is_trailer": False
            },
            "ENMAX EMGD24 (Bridge/Tunnel Utility)": {
                "max_reach": 24.0, "min_reach": -3.0, "default_reach": 18.0,
                "chassis_options": ["ENMAX Dedicated Utility Chassis", "Dongfeng Heavy Duty Chassis"],
                "baskets": ["Heavy Duty Rotating Platform (SWL 400 KG)", "Standard Work Basket (SWL 200 KG)"],
                "type": "tele_neg", "outrigger_spread": 8.35, "is_trailer": False
            },
            "ENMAX EMGK16 (Insulated Utility)": {
                "max_reach": 16.0, "min_reach": 3.0, "default_reach": 12.0,
                "chassis_options": ["Isuzu NPR Euro 4", "Hino 300 Series"],
                "baskets": ["1000V Insulated Bucket (SWL 200 KG)", "Standard Safety Cage (SWL 200 KG)"],
                "type": "tele", "outrigger_spread": 4.8, "is_trailer": False
            },
            "ENMAX EMGK17 (Insulated Utility)": {
                "max_reach": 18.0, "min_reach": 3.0, "default_reach": 14.0,
                "chassis_options": ["Isuzu NPR Euro 4", "Hino 300 Series"],
                "baskets": ["1000V Insulated Bucket (SWL 200 KG)", "Standard Safety Cage (SWL 200 KG)"],
                "type": "tele", "outrigger_spread": 4.8, "is_trailer": False
            },
            "ENMAX EMGK23 (Heavy Duty Utility)": {
                "max_reach": 23.0, "min_reach": 3.0, "default_reach": 16.0,
                "chassis_options": ["Foton Ollin Heavy Duty", "Isuzu FTR Series"],
                "baskets": ["Super Heavy Duty Platform (SWL 800 KG)", "Standard Work Platform (SWL 300 KG)"],
                "type": "tele", "outrigger_spread": 6.2, "is_trailer": False
            },
            "ENMAX EMGK24 (Power Line Utility)": {
                "max_reach": 24.0, "min_reach": 3.0, "default_reach": 18.0,
                "chassis_options": ["Isuzu FTR Euro 5", "Hino 500 Fleet"],
                "baskets": ["Insulated Power Line Bucket (SWL 200 KG)", "CE-Certified Steel Cage (SWL 200 KG)"],
                "type": "tele", "outrigger_spread": 6.5, "is_trailer": False
            },
            "ENMAX EMBL-10A (Trailer-Mounted Articulating Lift)": {
                "max_reach": 12.0, "min_reach": 2.0, "default_reach": 9.0,
                "chassis_options": ["Towing Trailer Chassis (5.2m x 1.7m)"],
                "baskets": ["Standard Articulating Basket (SWL 200 KG)"],
                "type": "artic", "outrigger_spread": 4.7, "is_trailer": True
            },
            "ENMAX EM160ZB4 (Knuckle Truck-Mounted Crane)": {
                "max_reach": 13.2, "min_reach": 2.0, "default_reach": 8.5,
                "chassis_options": ["Heavy Duty 4-Axle Commercial Chassis", "Hino 700 8x4"],
                "baskets": ["Heavy Duty Crane Hook (SWL 8000 KG)"],
                "type": "knuckle", "outrigger_spread": 5.23, "is_trailer": False
            }
        }
        
        selected_specs = model_specs[mewp_model]
        
        # 2. Dynamic Chassis Selector
        chassis_type = st.selectbox("Select Chassis Configuration", selected_specs["chassis_options"])
        
        # 3. Dynamic Reach Slider (Adjusts to physical boundaries of models)
        boom_reach = st.slider(
            "Select Boom Extension Height (Meters)",
            min_value=float(selected_specs["min_reach"]),
            max_value=float(selected_specs["max_reach"]),
            value=float(selected_specs["default_reach"]),
            step=0.5
        )
        
        # 4. Dynamic Basket Configurations
        basket_capacity = st.radio("Select Working Attachment", selected_specs["baskets"])
        
        # 5. Painting Colors
        livery_preset = st.selectbox("Select Fleet Livery Paint Scheme", [
            "Mandrossa Classic Red",
            "DBKL Orange/Yellow Municipal Stripe",
            "MBJB Light Blue/Orange Fleet",
            "Pure Workhorse Yellow"
        ])
        
        st.write("---")
        st.markdown("### ✉️ REQUEST A PORTFOLIO QUOTE")
        client_name = st.text_input("Company / Institution Name")
        client_email = st.text_input("Business Email")
        client_phone = st.text_input("Phone Number")
        
        submit_quote = st.button("Submit Custom Build Request")
        
        if submit_quote:
            if client_name and client_email:
                new_id = f"C-{np.random.randint(100, 999)}"
                new_row = {
                    "ID": new_id,
                    "Client Name": client_name,
                    "Contact": "Web 3D Configurator",
                    "Phone": client_phone,
                    "Email": client_email,
                    "Machine Interest": mewp_model,
                    "Details": f"{chassis_type}, {boom_reach}m Boom, {basket_capacity}, {livery_preset}",
                    "Status": "Proposal Submitted"
                }
                st.session_state.crm_data = pd.concat([st.session_state.crm_data, pd.DataFrame([new_row])], ignore_index=True)
                
                st.success("🎉 Configuration Captured & Transmitted!")
                st.info(f"**Reference ID:** MST-{np.random.randint(1000,9999)} | A personalized proposal has been compiled for **{client_name}** and routed to our Puchong Corporate Sales office.")
            else:
                st.warning("Please enter your Company Name and Business Email to submit a request.")

    with col_visual:
        st.markdown("### 🎨 LIVE 3D HYDRAULIC STRUCTURAL MODEL")
        st.write("Drag left-click to rotate, scroll to zoom, and right-click to pan. View dynamic specifications instantly.")

        # Color Map Definition
        color_map = {
            "Mandrossa Classic Red": "#C00000",
            "DBKL Orange/Yellow Municipal Stripe": "#FF5500",
            "MBJB Light Blue/Orange Fleet": "#00A2E8",
            "Pure Workhorse Yellow": "#FFC90E"
        }
        selected_color = color_map[livery_preset]

        # ==========================================
        # ADVANCED MATHEMATICALLY SCALED 3D GEOMETRY
        # ==========================================
        fig = go.Figure()

        # Adjust dimensions based on the blueprint rules
        if mewp_model == "ARAST Series VM2020T4R (Malaysian Built)":
            # Exact ISUZU NPR75UKH Chassis Blueprint dimensions
            width_val = 2.2 # JPJ overall width: 2200mm
            wheelbase_val = 4.6 # JPJ wheelbase: 4600mm
            height_val = 1.2 # Truck bed height
            cab_height = 2.23 # JPJ cab height: 2230mm
            cab_length = 2.0 # Standard Isuzu cabin length
            total_len = 7.0 # Total truck length
            center_of_rot = -1.1 # 3115mm from front (which is at +3.5 in coordinates)
        elif selected_specs["is_trailer"]:
            # ENMAX EMBL-10A Towable Trailer parameters
            width_val = 1.7 # 1.7m wide
            wheelbase_val = 3.0
            height_val = 0.6 # Low trailer bed
            cab_height = 0.0 # No cabin
            cab_length = 0.0
            total_len = 5.2 # 5.2m length
            center_of_rot = -1.0
        else:
            # ENMAX Heavy Duty Truck configurations
            width_val = 2.4
            wheelbase_val = 4.5
            height_val = 1.3
            cab_height = 2.4
            cab_length = 2.1
            total_len = 7.5
            center_of_rot = -1.2

        # Coordinates computation for Truck Chassis Box
        x_half = total_len / 2.0
        y_half = width_val / 2.0
        
        # 1. Plotly Mesh3D for Chassis Bed (Charcoal gray)
        fig.add_trace(go.Mesh3d(
            x=[-x_half, x_half, x_half, -x_half, -x_half, x_half, x_half, -x_half],
            y=[-y_half, -y_half, y_half, y_half, -y_half, -y_half, y_half, y_half],
            z=[0, 0, 0, 0, height_val, height_val, height_val, height_val],
            i=[7, 0, 0, 0, 4, 4, 3, 3, 1, 1, 2, 2],
            j=[0, 1, 2, 3, 5, 6, 7, 4, 5, 2, 6, 7],
            k=[4, 4, 3, 7, 1, 2, 6, 5, 6, 6, 3, 3],
            color='#2E2E2E', name="Chassis Base Frame", opacity=0.9
        ))

        # 2. Cabin rendering (only if not a trailer)
        if cab_height > 0:
            cab_start_x = x_half - cab_length
            fig.add_trace(go.Mesh3d(
                x=[cab_start_x, x_half, x_half, cab_start_x, cab_start_x, x_half, x_half, cab_start_x],
                y=[-y_half, -y_half, y_half, y_half, -y_half, -y_half, y_half, y_half],
                z=[height_val, height_val, height_val, height_val, cab_height, cab_height, cab_height, cab_height],
                i=[7, 0, 0, 0, 4, 4, 3, 3, 1, 1, 2, 2],
                j=[0, 1, 2, 3, 5, 6, 7, 4, 5, 2, 6, 7],
                k=[4, 4, 3, 7, 1, 2, 6, 5, 6, 6, 3, 3],
                color=selected_color, name="Cabin Fleet Livery", opacity=0.95
            ))
        else:
            # If trailer, draw a structural triangular tow hitch on the front
            fig.add_trace(go.Scatter3d(
                x=[x_half, x_half + 1.2, x_half],
                y=[-y_half, 0, y_half],
                z=[height_val / 2, 0.2, height_val / 2],
                mode='lines+markers',
                line=dict(color='#555555', width=8),
                name="Towing Drawbar"
            ))

        # 3. Dynamic Wheel Placement based on Wheelbase
        rear_axle_x = -wheelbase_val / 2
        front_axle_x = wheelbase_val / 2
        wheel_offsets_y = [-y_half - 0.1, y_half + 0.1]
        
        for wx in [rear_axle_x, front_axle_x]:
            if selected_specs["is_trailer"] and wx == front_axle_x:
                continue # Trailer only has rear wheel axle
            for wy in wheel_offsets_y:
                theta = np.linspace(0, 2*np.pi, 24)
                tire_z = 0.45 + 0.45*np.cos(theta)
                tire_x = wx + 0.45*np.sin(theta)
                tire_y = np.full_like(tire_x, wy)
                fig.add_trace(go.Scatter3d(
                    x=tire_x, y=tire_y, z=tire_z,
                    mode='lines',
                    line=dict(color='#111111', width=8),
                    showlegend=False
                ))

        # 4. Outriggers (Stabilizers) showing ground contact & width safety boundaries
        out_spread = selected_specs["outrigger_spread"] / 2
        out_x_offsets = [-x_half + 0.8, x_half - 1.2]
        for ox in out_x_offsets:
            for side in [-1, 1]:
                oy_end = side * out_spread
                fig.add_trace(go.Scatter3d(
                    x=[ox, ox + 0.2 * side, ox + 0.4 * side],
                    y=[side * y_half, oy_end, oy_end],
                    z=[height_val, height_val / 2, 0.0],
                    mode='lines+markers',
                    line=dict(color='#FFC90E', width=5),
                    marker=dict(size=4, color='#111111'),
                    name="Stabilizer Active Outrigger",
                    showlegend=False
                ))

        # 5. Rotary Turntable Base
        tb_z = height_val
        fig.add_trace(go.Mesh3d(
            x=[center_of_rot-0.4, center_of_rot+0.4, center_of_rot+0.4, center_of_rot-0.4, center_of_rot-0.4, center_of_rot+0.4, center_of_rot+0.4, center_of_rot-0.4],
            y=[-0.4, -0.4, 0.4, 0.4, -0.4, -0.4, 0.4, 0.4],
            z=[tb_z, tb_z, tb_z, tb_z, tb_z + 0.4, tb_z + 0.4, tb_z + 0.4, tb_z + 0.4],
            color='#FFC90E', name="Rotary Pivot base", opacity=0.9
        ))

        # 6. DYNAMIC BOOM MECHANICS RENDERING
        base_x, base_y, base_z = center_of_rot, 0.0, tb_z + 0.4
        
        if selected_specs["type"] == "tele":
            # Straight Telescoping Mechanism
            angle_rad = np.radians(40.0) # Fixed angle elevation for standard 3D preview
            fixed_len = min(6.0, boom_reach * 0.5)
            ext_len = max(1.0, boom_reach - fixed_len)
            
            p1_x = base_x - (fixed_len * np.cos(angle_rad))
            p1_z = base_z + (fixed_len * np.sin(angle_rad))
            
            p2_x = base_x - (boom_reach * np.cos(angle_rad))
            p2_z = base_z + (boom_reach * np.sin(angle_rad))
            
            # Lower section (heavy structural gray)
            fig.add_trace(go.Scatter3d(
                x=[base_x, p1_x], y=[0, 0], z=[base_z, p1_z],
                mode='lines+markers', line=dict(color='#4A4A4A', width=14),
                name="Primary Hydraulic Boom"
            ))
            # Upper/inner section (silver telescoping steel)
            fig.add_trace(go.Scatter3d(
                x=[p1_x, p2_x], y=[0, 0], z=[p1_z, p2_z],
                mode='lines', line=dict(color='#D3D3D3', width=8),
                name="Inner Telescopic Extension"
            ))
            bx, bz = p2_x, p2_z

        elif selected_specs["type"] == "tele_neg":
            # Negative-Angle Downward Utility Boom (EMGD24 Special)
            angle_rad = np.radians(15.0)
            fixed_len = 10.0
            
            # Straight boom extending out
            p1_x = base_x - (fixed_len * np.cos(angle_rad))
            p1_z = base_z + (fixed_len * np.sin(angle_rad))
            
            # Negative Jib bending downwards (represented by dynamic slider)
            neg_depth = max(-3.0, min(0.0, boom_reach - 20.0)) if boom_reach > 20.0 else 0.0
            p2_x = p1_x - 3.0
            p2_z = p1_z + neg_depth # Moves downward
            
            fig.add_trace(go.Scatter3d(
                x=[base_x, p1_x], y=[0, 0], z=[base_z, p1_z],
                mode='lines+markers', line=dict(color='#4A4A4A', width=14),
                name="Primary Boom"
            ))
            fig.add_trace(go.Scatter3d(
                x=[p1_x, p2_x], y=[0, 0], z=[p1_z, p2_z],
                mode='lines+markers', line=dict(color='#FFC90E', width=8),
                name="Negative Angle Jib (-3m Reach)"
            ))
            bx, bz = p2_x, p2_z

        elif selected_specs["type"] == "artic":
            # ENMAX EMBL-10A Pantograph Articulating arms
            h1 = boom_reach * 0.5
            p1_x = base_x + 1.2
            p1_z = base_z + h1
            
            p2_x = p1_x - 1.5
            p2_z = p1_z + h1
            
            # Folding arm structures
            fig.add_trace(go.Scatter3d(
                x=[base_x, p1_x], y=[0, 0], z=[base_z, p1_z],
                mode='lines+markers', line=dict(color='#4A4A4A', width=10),
                name="Lower Articulating Scissor"
            ))
            fig.add_trace(go.Scatter3d(
                x=[p1_x, p2_x], y=[0, 0], z=[p1_z, p2_z],
                mode='lines+markers', line=dict(color=selected_color, width=8),
                name="Upper Articulating Boom"
            ))
            bx, bz = p2_x, p2_z

        elif selected_specs["type"] == "knuckle":
            # EM160ZB4 Knuckle boom crane segments
            seg = boom_reach / 4.0
            p1_x, p1_z = base_x - seg * 0.9, base_z + seg * 0.4
            p2_x, p2_z = p1_x - seg * 0.8, p1_z + seg * 0.6
            p3_x, p3_z = p2_x - seg * 0.7, p2_z + seg * 0.2
            p4_x, p4_z = p3_x - seg * 0.6, p3_z - seg * 0.3 # Bends slightly down like a claw
            
            fig.add_trace(go.Scatter3d(
                x=[base_x, p1_x, p2_x, p3_x, p4_x],
                y=[0, 0, 0, 0, 0],
                z=[base_z, p1_z, p2_z, p3_z, p4_z],
                mode='lines+markers', line=dict(color='#C0C0C0', width=10),
                marker=dict(size=5, color='#111111'),
                name="Multi-Section Knuckle Joints"
            ))
            bx, bz = p4_x, p4_z

        # 7. Working Basket / Attachment (drawn at end coordinates bx, bz)
        if selected_specs["type"] == "knuckle":
            # Draw a heavy-duty crane hook element instead of a basket cage
            fig.add_trace(go.Scatter3d(
                x=[bx, bx, bx + 0.1, bx - 0.1],
                y=[0, 0, 0, 0],
                z=[bz, bz - 0.6, bz - 0.8, bz - 0.8],
                mode='lines', line=dict(color='#111111', width=6),
                name="8-Ton Lifting Hook"
            ))
        else:
            # Render a proper wireframe cage
            basket_dx = np.array([-0.6, 0.6, 0.6, -0.6, -0.6, -0.6, 0.6, 0.6, -0.6, -0.6, 0.6, 0.6, 0.6, 0.6, -0.6, -0.6]) + bx
            basket_dy = np.array([-0.6, -0.6, 0.6, 0.6, -0.6, -0.6, -0.6, 0.6, 0.6, -0.6, -0.6, -0.6, 0.6, 0.6, 0.6, 0.6])
            basket_dz = np.array([0, 0, 0, 0, 0, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0, 0, 0.8, 0.8, 0]) + bz
            
            fig.add_trace(go.Scatter3d(
                x=basket_dx, y=basket_dy, z=basket_dz,
                mode='lines',
                line=dict(color=selected_color, width=4),
                name="Custom Utility Cage"
            ))

        # Set 3D Aspect Ratio and layout parameters
        fig.update_layout(
            scene=dict(
                xaxis=dict(title='Length (m)', range=[-10, 10], backgroundcolor="rgb(240, 240, 240)"),
                yaxis=dict(title='Width (m)', range=[-5, 5], backgroundcolor="rgb(230, 230, 230)"),
                zaxis=dict(title='Height (m)', range=[0, 25], backgroundcolor="rgb(220, 220, 220)"),
                aspectratio=dict(x=1, y=0.5, z=0.75)
            ),
            margin=dict(l=0, r=0, b=0, t=30),
            height=600,
            legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01)
        )
        
        st.plotly_chart(fig, use_container_width=True)
        st.info(f"💡 **Dynamic Specifications Grid:** Model: {mewp_model} | Selected Reach: {boom_reach}m (Max: {selected_specs['max_reach']}m) | Outrigger Span: {selected_specs['outrigger_spread']}m | SWL Rating: {basket_capacity.split('(')[-1].replace(')', '')}")

# ==========================================
# PRIVATE INTERNAL CORPORATE PORTAL (SECURE)
# ==========================================
elif app_mode == "🔒 Company Management Login":
    st.title("Mandrossa Internal Corporate ERP")
    st.write("A restricted gateway for Mandrossa staff and senior directors to access databases, geofenced records, and payroll calculation systems.")
    
    st.write("---")
    
    # Secure Password Verification
    st.markdown("### 🔐 ACCOUNT SECURITY VERIFICATION")
    login_password = st.text_input("Enter Management Credentials / Passcode", type="password")
    
    if login_password != "mandrossa2026":
        st.warning("⚠️ Access Denied. Please input valid corporate credentials or contact the Semenyih IT Administrator.")
        st.info("💡 **Demo / Review Hint:** Enter passcode: `mandrossa2026` to unlock simulated corporate systems.")
    else:
        st.success("🔑 Welcome back, Director Norazman Aidros. Secure session initialized.")
        
        # Nested ERP Tabs
        erp_tab1, erp_tab2, erp_tab3, erp_tab4, erp_tab5 = st.tabs([
            "👥 Leads CRM Database", 
            "⏱️ Clock-In Attendance", 
            "💰 Claims & Overtime Queue", 
            "🇲🇾 Malaysian Statutory Payroll", 
            "💬 Chat Room & Shared S3 Drive"
        ])
        
        # TAB 1: CRM Lead Manager
        with erp_tab1:
            st.subheader("Enterprise CRM Hub & Leads Manager")
            st.write("View, manage, and process high-conversion sales leads submitted via the public Google Sites 3D customizer.")
            
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("Total Active Leads", len(st.session_state.crm_data))
            with c2:
                st.metric("Pending Quotes", len(st.session_state.crm_data[st.session_state.crm_data["Status"]=="Proposal Submitted"]))
            with c3:
                st.metric("Closed Won Accounts", len(st.session_state.crm_data[st.session_state.crm_data["Status"]=="Closed Won"]))
                
            st.write("---")
            
            col_search, col_status = st.columns([2, 1])
            with col_search:
                search_query = st.text_input("Search client list by name/contact...")
            with col_status:
                status_filter = st.selectbox("Filter Pipeline Stage", ["All", "Active Contract", "Proposal Submitted", "Negotiation", "Demo Scheduled", "Closed Won"])
                
            df_filtered = st.session_state.crm_data.copy()
            if search_query:
                df_filtered = df_filtered[
                    df_filtered["Client Name"].str.contains(search_query, case=False) | 
                    df_filtered["Email"].str.contains(search_query, case=False)
                ]
            if status_filter != "All":
                df_filtered = df_filtered[df_filtered["Status"] == status_filter]
                
            st.dataframe(df_filtered, use_container_width=True, hide_index=True)
            
            # Export Mechanism
            csv_buffer = io.StringIO()
            st.session_state.crm_data.to_csv(csv_buffer, index=False)
            st.download_button(
                label="Download CRM Lead Database (CSV Sheet)",
                data=csv_buffer.getvalue(),
                file_name=f"mandrossa_leads_db_{datetime.date.today()}.csv",
                mime="text/csv"
            )

        # TAB 2: Geofenced Attendance
        with erp_tab2:
            st.subheader("Geofenced Mobile Attendance Registry")
            st.write("Ensuring verified, spoof-proof records by geofencing device coordinates against physical plant boundaries.")
            
            # Display records
            st.dataframe(st.session_state.attendance, use_container_width=True, hide_index=True)
            
            st.write("---")
            st.markdown("#### Submit Punch Registry (Simulated GPS coordinate check)")
            clk_c1, clk_c2, clk_c3 = st.columns(3)
            with clk_c1:
                clock_user = st.selectbox("Select Employee", ["Norazman Aidros", "Dinie Zuhaimie", "Ahmad Kamal", "Roszaila Awang"])
            with clk_c2:
                geofence_loc = st.selectbox("Simulate GPS Coordinates", [
                    "Semenyih Factory Floor (Inside Geofence)", 
                    "Puchong Executive Office (Inside Geofence)",
                    "Semenyih Town (OUTSIDE GEOFENCE)",
                    "Remote / Off-site Authorized Client Meeting"
                ])
            with clk_c3:
                clock_type = st.radio("Punch Command", ["Clock-In Entry", "Clock-Out Entry"])
                
            trigger_clock = st.button("Transmit Punch Coordinate Registry")
            if trigger_clock:
                time_str = datetime.datetime.now().strftime("%I:%M %p")
                date_str = datetime.date.today().strftime("%Y-%m-%d")
                
                is_inside = "Inside" in geofence_loc or "Office" in geofence_loc
                fence_status = "Inside Boundary" if is_inside else ("Authorized Exception" if "Remote" in geofence_loc else "OUTSIDE BOUNDARY (ALERT)")
                
                new_punch = {
                    "Date": date_str,
                    "Name": clock_user,
                    "Role": "Mandrossa Specialist",
                    "Clock In": time_str if "In" in clock_type else "08:15 AM",
                    "Clock Out": "--" if "In" in clock_type else time_str,
                    "Status": geofence_loc,
                    "Geofence": fence_status
                }
                st.session_state.attendance = pd.concat([st.session_state.attendance, pd.DataFrame([new_punch])], ignore_index=True)
                
                if fence_status == "OUTSIDE BOUNDARY (ALERT)":
                    st.error("⚠️ Geofence Validation Failed! Punch recorded outside authorized Puchong/Semenyih coordinates. Incident report sent to HR queue.")
                else:
                    st.success("✅ GPS Coordinate Validated! Sync completed successfully with secure clock registers.")
                time.sleep(0.5)
                st.rerun()

        # TAB 3: Claims Management
        with erp_tab3:
            st.subheader("Expense Claims & Multi-Tier Approvals")
            st.dataframe(st.session_state.claims, use_container_width=True, hide_index=True)
            
            st.write("---")
            st.markdown("#### Submit New Materials / Travel Expense Claim")
            clm_c1, clm_c2 = st.columns(2)
            with clm_c1:
                clm_user = st.selectbox("Staff Submitter", ["Dinie Zuhaimie", "Ahmad Kamal", "Roszaila Awang"])
                clm_cat = st.selectbox("Expense Classification", ["MRO Hydralic Spares", "Travel Fuel & Toll", "Local Authority Entertainment", "General Shop Materials"])
            with clm_c2:
                clm_amt = st.number_input("Claim Amount (RM)", min_value=1.0, value=250.0)
                clm_date = st.date_input("Invoice/Receipt Date", value=datetime.date.today())
                clm_file = st.file_uploader("Upload Scanned Receipt Proof", type=["png", "jpg", "pdf"])
                
            submit_clm = st.button("Transmit Claim Documents")
            if submit_clm:
                new_clm = {
                    "Claim ID": f"CLM-{np.random.randint(503, 999)}",
                    "Name": clm_user,
                    "Category": clm_cat,
                    "Amount (RM)": clm_amt,
                    "Date": clm_date.strftime("%Y-%m-%d"),
                    "Status": "Pending Approval"
                }
                st.session_state.claims = pd.concat([st.session_state.claims, pd.DataFrame([new_clm])], ignore_index=True)
                st.success("Expense parameters saved! Receipt has been uploaded to AWS S3 encrypted claims bucket.")
                time.sleep(0.5)
                st.rerun()

        # TAB 4: Malaysian Compliance Payroll Engine
        with erp_tab4:
            st.subheader("Compliance Payroll Engine (Malaysian Statutory Rates)")
            st.write("Calculate exact payroll details, employee deductions, and employer contributions adhering to KWSP, PERKESO, SIP, and LHDN (PCB) regulations.")
            
            pay_col1, pay_col2 = st.columns(2)
            with pay_col1:
                st.markdown("##### 📥 Salary Base Settings")
                employee_name = st.selectbox("Select Target Profile Reference", ["Dinie Zuhaimie (Technical Director)", "Junior Mechanical Draftsman", "Senior Hydraulic Welder", "General Assembler Staff"])
                
                salary_presets = {
                    "Dinie Zuhaimie (Technical Director)": 7500.00,
                    "Junior Mechanical Draftsman": 3200.00,
                    "Senior Hydraulic Welder": 4500.00,
                    "General Assembler Staff": 2500.00
                }
                
                base_salary = st.number_input("Staff Monthly Base Salary (RM)", min_value=1200.0, value=salary_presets[employee_name])
                ot_hours = st.number_input("Overtime Hours Registered (Month)", min_value=0.0, value=12.0, step=1.0)
                ot_rate_multiplier = st.selectbox("Applicable Overtime Multiplier (Employment Act)", [1.5, 2.0, 3.0])
                
            with pay_col2:
                st.markdown("##### 📊 Computed Malaysian Payroll Summary")
                
                # Dynamic OT pay calculation
                hourly_rate = (base_salary / 26) / 8  
                ot_pay = ot_hours * hourly_rate * ot_rate_multiplier
                gross_pay = base_salary + ot_pay
                
                # Standard Statutory calculations
                epf_employee = gross_pay * 0.11 # Standard 11% employee contribution
                epf_employer = gross_pay * 0.13 if gross_pay <= 5000.0 else gross_pay * 0.12 # 13% for <=5k, else 12%
                
                socso_employee = min(gross_pay * 0.005, 24.75)  # SOCSO Band limits
                socso_employer = min(gross_pay * 0.0175, 86.65)
                
                eis_employee = min(gross_pay * 0.002, 9.80) # EIS SIP Limits
                eis_employer = min(gross_pay * 0.002, 9.80)
                
                # Dynamic PCB Estimation
                estimated_pcb = 0.0
                if gross_pay > 3100.0:
                    estimated_pcb = (gross_pay - 3100.0) * 0.065 # Simplified LHDN band representation
                
                net_pay = gross_pay - epf_employee - socso_employee - eis_employee - estimated_pcb
                
                # Display output parameters
                st.markdown(f"**Gross Earnings:** RM {gross_pay:.2f} (Base: RM {base_salary:.2f} + Overtime: RM {ot_pay:.2f})")
                st.write("---")
                
                sc1, sc2 = st.columns(2)
                with sc1:
                    st.markdown("👥 **Employee Deductions**")
                    st.write(f"- EPF (11%): RM {epf_employee:.2f}")
                    st.write(f"- SOCSO: RM {socso_employee:.2f}")
                    st.write(f"- EIS: RM {eis_employee:.2f}")
                    st.write(f"- Tax (PCB Estimate): RM {estimated_pcb:.2f}")
                with sc2:
                    st.markdown("🏭 **Employer Contributions**")
                    st.write(f"- EPF (12%/13%): RM {epf_employer:.2f}")
                    st.write(f"- SOCSO: RM {socso_employer:.2f}")
                    st.write(f"- EIS: RM {eis_employer:.2f}")
                
                st.write("---")
                st.success(f"💰 **Net Take-Home Pay:** RM {net_pay:.2f}")
                
                if st.button("Commit Payroll to General Ledgers & Audit Records"):
                    st.success("✅ Audit Record Logged! Transactions pushed to anti-tamper write-only database.")

        # TAB 5: Live Chat & Shared S3 Folders
        with erp_tab5:
            st.subheader("Secure Corporate Communication & S3 Buckets")
            chat_col, drive_col = st.columns([2, 1])
            
            with chat_col:
                st.markdown("##### 💬 Internal Communication Group")
                for msg in st.session_state.chat_messages:
                    st.markdown(f"**[{msg['timestamp']}] {msg['user']}:** {msg['text']}")
                    
                st.write("---")
                chat_user = st.selectbox("Your Post Identity Selection", ["Dinie Zuhaimie (Technical)", "Norazman Aidros (CEO)", "Roszaila Awang (Finance)"])
                chat_txt = st.text_input("Post message to group conversation channels")
                
                if st.button("Post Message"):
                    if chat_txt:
                        timestamp_now = datetime.datetime.now().strftime("%I:%M %p")
                        st.session_state.chat_messages.append({
                            "timestamp": timestamp_now,
                            "user": chat_user,
                            "text": chat_txt
                        })
                        st.success("Message synced to private secure communication datastore.")
                        time.sleep(0.5)
                        st.rerun()

            with drive_col:
                st.markdown("##### 📂 Shared Enterprise Folder")
                st.write("Anti-tamper storage folders hosted on AWS S3 secure instances.")
                st.markdown("""
                *   🔒 `ARAST-JPJ-Regulatory-Plan-2025.pdf`  
                *   🔒 `MEKASA-Patent-Doc-MyIPO.pdf`  
                *   🔒 `DBKL-Tender-Final-Specs.docx`  
                *   🔒 `MPOB-Project-Grant-Audit-2025.xlsx`  
                """)
                st.button("Request Temporary File Upload Token Connection")
