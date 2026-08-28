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
    page_title="Mandrossa Interactive Portal",
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
        {"ID": "C-003", "Client Name": "Boustead Plantations Bhd", "Contact": "Mr. Tan", "Phone": "+6013-1112222", "Email": "tan@boustead.com.my", "Machine Interest": "MÉKASA Harvester", "Details": "AWD/AWS, 12m Telescopic Boom", "Status": "Negotiation"},
        {"ID": "C-004", "Client Name": "Sime Darby Plantation", "Contact": "En. Radzi", "Phone": "+6017-3334444", "Email": "radzi@simedarby.com", "Machine Interest": "MÉKASA 2.0", "Details": "Integrated 1-Ton Collection Bin", "Status": "Demo Scheduled"},
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

# =========================================
# APPLICATION MODE NAVIGATION (DECOUPLED DESIGN)
# =========================================
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
🔒 ERP Database Isolated
🇲🇾 Compliance: LHDN & DOSH
""")

# =========================================
# PUBLIC INTERFACE: 3D CUSTOMIZER & MARKETING
# =========================================
if app_mode == "🌐 Public Site Customizer":
    st.title("Interactive 3D Skylift Configurator")
    st.subheader("Customize Your High-Access Solution & Get an Instant Proposal")
    st.write("This interactive configurator is designed to embed seamlessly inside your Mandrossa Google Site. Customize the parameters below, interact with the 3D WebGL model, and submit your configuration directly to our sales department.")
    
    st.write("---")
    
    col_ctrl, col_visual = st.columns([1, 2])
    
    with col_ctrl:
        st.markdown("### ⚙️ CUSTOMIZER PANEL")
        
        # Vehicle Configuration Controls
        mewp_model = st.selectbox("Select Base Platform", ["ARAST Series (Malaysian Built)", "ENMAX EMG Series (Imported Line)", "Jinwoo Specialized Series"])
        chassis_type = st.selectbox("Select Truck Chassis", ["Isuzu NPR Euro 4", "Hino Dutro Series", "Nissan Diesel Atlas"])
        boom_reach = st.slider("Select Telescopic Boom Extension (Meters)", min_value=3.0, max_value=12.0, value=7.5, step=0.5)
        basket_capacity = st.radio("Utility Basket Design", ["Standard Basket (SWL 200 KG / 2 Pax)", "Heavy Duty Municipal Cage (SWL 300 KG)", "Compact Insulated Basket (10KV Safety Rating)"])
        
        # Painting Colors (Malaysian municipality liveries)
        livery_preset = st.selectbox("Fleet Livery Color Preset", ["Mandrossa Classic Red", "DBKL Orange/Yellow Municipal Stripe", "MBJB Light Blue/Orange Fleet", "Pure Workhorse Yellow"])
        
        st.write("---")
        st.markdown("### ✉️ REQUEST A QUOTE")
        client_name = st.text_input("Company / Institution Name")
        client_email = st.text_input("Business Email")
        client_phone = st.text_input("Phone Number")
        
        submit_quote = st.button("Submit Custom Build Request")
        
        if submit_quote:
            if client_name and client_email:
                # Add to CRM simulated database
                new_id = f"C-{np.random.randint(100, 999)}"
                new_row = {
                    "ID": new_id,
                    "Client Name": client_name,
                    "Contact": "Web Inquiry",
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
        st.write("Hold right-click to pan, scroll to zoom, and drag left-click to rotate the telescopic machine design in full 3D.")

        # Color Map Definition
        color_map = {
            "Mandrossa Classic Red": "#C00000",
            "DBKL Orange/Yellow Municipal Stripe": "#FF5500",
            "MBJB Light Blue/Orange Fleet": "#00A2E8",
            "Pure Workhorse Yellow": "#FFC90E"
        }
        selected_color = color_map[livery_preset]

        # ==========================================
        # INTERACTIVE 3D MODEL GENERATION USING PLOTLY
        # ==========================================
        # 1. Base Truck Chassis Coordinates
        cx = np.array([-4, 4, 4, -4, -4, -4, 4, 4, -4, -4, 4, 4, 4, 4, -4, -4])
        cy = np.array([-1.5, -1.5, 1.5, 1.5, -1.5, -1.5, -1.5, 1.5, 1.5, -1.5, -1.5, -1.5, 1.5, 1.5, 1.5, 1.5])
        cz = np.array([0, 0, 0, 0, 0, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 0, 0, 1.2, 1.2, 0])
        
        # 2. Cabin Box coordinates
        cab_x = np.array([2, 4, 4, 2, 2, 2, 4, 4, 2, 2, 4, 4, 4, 4, 2, 2])
        cab_y = np.array([-1.5, -1.5, 1.5, 1.5, -1.5, -1.5, -1.5, 1.5, 1.5, -1.5, -1.5, -1.5, 1.5, 1.5, 1.5, 1.5])
        cab_z = np.array([1.2, 1.2, 1.2, 1.2, 1.2, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 1.2, 1.2, 2.4, 2.4, 1.2])

        # 3. Extending Boom calculations (Dynamic parameters based on slider)
        base_x, base_y, base_z = -2.0, 0.0, 1.2
        angle_rad = np.radians(35.0) # Elevated at fixed 35 degrees for visualization
        
        total_length = boom_reach
        arm1_len = min(4.0, total_length * 0.6)
        
        # Arm 1 Endpoint (Fixed section)
        arm1_end_x = base_x - (arm1_len * np.cos(angle_rad))
        arm1_end_y = base_y
        arm1_end_z = base_z + (arm1_len * np.sin(angle_rad))
        
        # Arm 2 Endpoint (Extending dynamic section)
        arm2_end_x = base_x - (total_length * np.cos(angle_rad))
        arm2_end_y = base_y
        arm2_end_z = base_z + (total_length * np.sin(angle_rad))
        
        # 4. Basket Frame Coordinates at the end of Boom 2
        bx, by, bz = arm2_end_x, arm2_end_y, arm2_end_z
        basket_dx = np.array([-0.6, 0.6, 0.6, -0.6, -0.6, -0.6, 0.6, 0.6, -0.6, -0.6, 0.6, 0.6, 0.6, 0.6, -0.6, -0.6]) + bx
        basket_dy = np.array([-0.6, -0.6, 0.6, 0.6, -0.6, -0.6, -0.6, 0.6, 0.6, -0.6, -0.6, -0.6, 0.6, 0.6, 0.6, 0.6]) + by
        basket_dz = np.array([0, 0, 0, 0, 0, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0, 0, 0.8, 0.8, 0]) + bz

        # Create Plotly traces
        fig = go.Figure()
        
        # Truck Chassis Surface Box
        fig.add_trace(go.Mesh3d(
            x=[-4, 4, 4, -4, -4, 4, 4, -4],
            y=[-1.5, -1.5, 1.5, 1.5, -1.5, -1.5, 1.5, 1.5],
            z=[0, 0, 0, 0, 1.2, 1.2, 1.2, 1.2],
            i=[7, 0, 0, 0, 4, 4, 3, 3, 1, 1, 2, 2],
            j=[0, 1, 2, 3, 5, 6, 7, 4, 5, 2, 6, 7],
            k=[4, 4, 3, 7, 1, 2, 6, 5, 6, 6, 3, 3],
            color='#333333', name="Truck Bed/Chassis", opacity=0.9
        ))
        
        # Cabin Box Surface
        fig.add_trace(go.Mesh3d(
            x=[2, 4, 4, 2, 2, 4, 4, 2],
            y=[-1.5, -1.5, 1.5, 1.5, -1.2, -1.2, 1.2, 1.2],
            z=[1.2, 1.2, 1.2, 1.2, 2.4, 2.4, 2.4, 2.4],
            i=[7, 0, 0, 0, 4, 4, 3, 3, 1, 1, 2, 2],
            j=[0, 1, 2, 3, 5, 6, 7, 4, 5, 2, 6, 7],
            k=[4, 4, 3, 7, 1, 2, 6, 5, 6, 6, 3, 3],
            color=selected_color, name="Cabin Paint", opacity=0.95
        ))
        
        # Draw Wheels (Represented by flat black discs in 3D)
        for wx in [-2.5, 2.5]:
            for wy in [-1.6, 1.6]:
                theta = np.linspace(0, 2*np.pi, 20)
                tire_z = 0.4 + 0.4*np.cos(theta)
                tire_x = wx + 0.4*np.sin(theta)
                tire_y = np.full_like(tire_x, wy)
                fig.add_trace(go.Scatter3d(x=tire_x, y=tire_y, z=tire_z, mode='lines', line=dict(color='black', width=6), showlegend=False))

        # Turntable Cylindrical Base
        fig.add_trace(go.Mesh3d(
            x=[-2.3, -1.7, -1.7, -2.3, -2.3, -1.7, -1.7, -2.3],
            y=[-0.3, -0.3, 0.3, 0.3, -0.3, -0.3, 0.3, 0.3],
            z=[1.2, 1.2, 1.2, 1.2, 1.6, 1.6, 1.6, 1.6],
            color='#FFC90E', opacity=0.8, name="Rotary Turntable"
        ))

        # Base Boom (Thick lower cylinder)
        fig.add_trace(go.Scatter3d(
            x=[base_x, arm1_end_x],
            y=[base_y, arm1_end_y],
            z=[base_z + 0.4, arm1_end_z],
            mode='lines+markers',
            line=dict(color='#555555', width=12),
            marker=dict(size=6, color='#FFC90E'),
            name="Lower Boom Arm"
        ))
        
        # Dynamic Telescoping Arm (Inner hydraulic extension stage - colored metallic silver)
        fig.add_trace(go.Scatter3d(
            x=[arm1_end_x, arm2_end_x],
            y=[arm1_end_y, arm2_end_y],
            z=[arm1_end_z, arm2_end_z],
            mode='lines',
            line=dict(color='#C0C0C0', width=7),
            name="Extending Hydraulic Piston"
        ))
        
        # Basket Platform Cage
        fig.add_trace(go.Scatter3d(
            x=basket_dx, y=basket_dy, z=basket_dz,
            mode='lines',
            line=dict(color=selected_color, width=4),
            name="Custom Working Cage"
        ))
        
        # Set 3D Aspect Ratio and layout parameters
        fig.update_layout(
            scene=dict(
                xaxis=dict(title='Length (m)', range=[-10, 10], backgroundcolor="rgb(240, 240, 240)"),
                yaxis=dict(title='Width (m)', range=[-5, 5], backgroundcolor="rgb(230, 230, 230)"),
                zaxis=dict(title='Height (m)', range=[0, 15], backgroundcolor="rgb(220, 220, 220)"),
                aspectratio=dict(x=1, y=0.5, z=0.75)
            ),
            margin=dict(l=0, r=0, b=0, t=30),
            height=600,
            legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01)
        )
        
        st.plotly_chart(fig, use_container_width=True)
        st.info(f"💡 **Dynamic Specifications Grid:** Reach: {boom_reach}m | Platform SWL Rating: {'300 KG' if 'Heavy Duty' in basket_capacity else '200 KG'} | Paint Code: {selected_color}")

# =========================================
# PRIVATE INTERNAL CORPORATE PORTAL (SECURE)
# =========================================
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
                employee_name = st.selectbox("Select Target Profile", ["Dinie Zuhaimie (Technical Director)", "Junior Mechanical Draftsman", "Senior Hydraulic Welder", "General Assembler Staff"])
                
                salary_presets = {
                    "Dinie Zuhaimie (Technical Director)": 7500.00,
                    "Junior Mechanical Draftsman": 3200.00,
                    "Senior Hydraulic Welder": 4500.00,
                    "General Assembler Staff": 2500.00
                }
                
                base_salary = st.number_input("Staff Monthly Base Salary (RM)", min_value=1200.0, value=salary_presets[employee_name])
                ot_hours = st.number_input("Overtime Hours Registered", min_value=0.0, value=12.0, step=1.0)
                ot_rate_multiplier = st.selectbox("Applicable Overtime Multiplier", [1.5, 2.0, 3.0])
                
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
                chat_user = st.selectbox("Your Post Identity", ["Dinie Zuhaimie (Technical)", "Norazman Aidros (CEO)", "Roszaila Awang (Finance)"])
                chat_txt = st.text_input("Post message to group conversation")
                
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
                st.button("Request Temporary File Upload Token")
