import streamlit as st
import plotly.express as px
import pandas as pd
from database.db import ViroDB
from dotenv import load_dotenv
import os
load_dotenv()
import anthropic
import base64
import json
from PIL import Image
import io


# ── Page config ────────────────────────────────────────────────
st.set_page_config(
    page_title="Viro",
    page_icon="🏭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Initialize database ────────────────────────────────────────
@st.cache_resource
def get_db():
    return ViroDB()

db = get_db()

# ── Sidebar ────────────────────────────────────────────────────
with st.sidebar:
    st.title("🏭 Viro")
    st.caption("Manufacturing Intelligence Platform")
    st.divider()

    # Company selector
    companies = db.query("SELECT * FROM companies")
    company_names = companies["name"].tolist()
    selected_name = st.selectbox("Select Company", company_names)
    selected_company = companies[companies["name"] == selected_name].iloc[0]
    company_id = selected_company["company_id"]

    st.divider()

    # Navigation
    page = st.radio(
        "Navigation",
        ["Dashboard", "Vehicle Search", "Log Defect", "AI Assistant"]
    )


# ── Dashboard Page ─────────────────────────────────────────────
if page == "Dashboard":
    st.title(f"{selected_name} — Quality Dashboard")

    # Top metrics
    products = db.get_products(company_id)
    defects = db.get_defects(company_id)

    total_products = len(products)
    total_defects = len(defects)
    critical_defects = len(defects[defects["severity"] == "critical"])
    flagged = len(products[products["status"] == "flagged"])

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Products", total_products)
    with col2:
        st.metric("Total Defects", total_defects)
    with col3:
        st.metric("Critical Defects", critical_defects)
    with col4:
        st.metric("Flagged Products", flagged)

    st.divider()

    # Charts
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Defects by Stage")
        stage_data = db.get_defects_by_stage(company_id)
        if not stage_data.empty:
            fig = px.bar(
                stage_data,
                x="stage_number",
                y="total_defects",
                color="total_defects",
                color_continuous_scale="Reds",
                labels={"stage_number": "Stage", "total_defects": "Defects"}
            )
            fig.update_layout(showlegend=False)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Defects by Severity")
        if not defects.empty:
            severity_counts = defects["severity"].value_counts().reset_index()
            severity_counts.columns = ["severity", "count"]
            colors = {
                "critical": "#ef4444",
                "high": "#f97316",
                "medium": "#eab308",
                "low": "#22c55e"
            }
            fig = px.pie(
                severity_counts,
                values="count",
                names="severity",
                color="severity",
                color_discrete_map=colors
            )
            st.plotly_chart(fig, use_container_width=True)

    st.divider()

    # Products table
    st.subheader("All Products")
    st.dataframe(products, use_container_width=True)

# ── Vehicle Search Page ────────────────────────────────────────
elif page == "Vehicle Search":
    st.title("Product Search")

    search_id = st.text_input(
        f"Search by {selected_company['universal_id_field'].upper()}",
        placeholder=f"Enter {selected_company['universal_id_field']}..."
    )

    if search_id:
        products = db.get_products(company_id)
        # Filter by search
        matches = products[products["product_id"].str.contains(
            search_id, case=False, na=False
        )]

        if matches.empty:
            st.error(f"No products found matching '{search_id}'")
        else:
            for _, product in matches.iterrows():
                with st.expander(
                    f"📦 {product['product_id']} — "
                    f"Stage {product['current_stage']} — "
                    f"{product['status'].upper()} — "
                    f"{product['total_defects']} defects"
                ):
                    defects = db.get_defects(company_id, product["product_id"])
                    if defects.empty:
                        st.success("✅ No defects recorded")
                    else:
                        st.dataframe(defects, use_container_width=True)

# ── Log Defect Page ────────────────────────────────────────────
# ── Log Defect Page ────────────────────────────────────────────
elif page == "Log Defect":
    st.title("Log New Defect")

    stages = db.query(
        "SELECT * FROM stages WHERE company_id = ? ORDER BY stage_number",
        (company_id,)
    )

    st.subheader("📸 Take or Upload a Photo")
    st.caption("AI will automatically analyze the defect and fill in the details")

    photo = st.camera_input("Take a photo") or st.file_uploader(
        "Or upload an image", type=["jpg", "jpeg", "png"]
    )

    # Auto-filled values from AI
    ai_defect_type = ""
    ai_severity = "low"
    ai_notes = ""

    if photo:
        with st.spinner("Analyzing image..."):
            try:
                image_bytes = photo.read()
                base64_image = base64.standard_b64encode(image_bytes).decode("utf-8")

                if hasattr(photo, 'type'):
                    media_type = photo.type
                else:
                    media_type = "image/jpeg"

                client = anthropic.Anthropic()

                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=500,
                    messages=[{
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": base64_image
                                }
                            },
                            {
                                "type": "text",
                                "text": """You are a manufacturing quality inspector.
                                Analyze this image and return ONLY a JSON object with no other text:
                                {
                                    "defect_type": "one short phrase describing the defect type",
                                    "severity": "low or medium or high or critical",
                                    "notes": "one sentence describing what you see"
                                }
                                If no defect is visible return:
                                {
                                    "defect_type": "no defect visible",
                                    "severity": "low",
                                    "notes": "No visible defect detected in image"
                                }"""
                            }
                        ]
                    }]
                )

                result = json.loads(response.content[0].text)
                ai_defect_type = result.get("defect_type", "")
                ai_severity = result.get("severity", "low")
                ai_notes = result.get("notes", "")
                st.success("✅ AI analysis complete — review and edit below")

            except Exception as e:
                st.warning("⚠️ AI analysis unavailable — form ready for manual entry")
                ai_defect_type = ""
                ai_severity = "low"
                ai_notes = ""
# ── AI Assistant Page ──────────────────────────────────────────
elif page == "AI Assistant":
    st.title("🤖 Viro AI Assistant")
    st.caption("Ask anything about your quality data in plain English")

    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat input
    if prompt := st.chat_input("Ask Viro anything..."):

        # Add user message
        st.session_state.messages.append({
            "role": "user",
            "content": prompt
        })
        with st.chat_message("user"):
            st.markdown(prompt)

        # Get relevant data from database
        products = db.get_products(company_id)
        defects = db.get_defects(company_id)
        stage_data = db.get_defects_by_stage(company_id)

        # Build context
        context = f"""
        You are Viro, an AI assistant for {selected_name} manufacturing quality control.
        
        Current data summary:
        - Total products: {len(products)}
        - Total defects: {len(defects)}
        - Critical defects: {len(defects[defects['severity'] == 'critical'])}
        - Flagged products: {len(products[products['status'] == 'flagged'])}
        
        Defects by stage:
        {stage_data.to_string() if not stage_data.empty else 'No data'}
        
        Recent defects (last 20):
        {defects.head(20).to_string() if not defects.empty else 'No defects'}
        
        Products overview (top 20 by defects):
        {products.head(20).to_string() if not products.empty else 'No products'}
        
        Answer the user's question using only this data.
        Be concise and direct. If the answer requires data you don't have, say so clearly.
        Never make up numbers or data.
        """

        # Get AI response
        with st.chat_message("assistant"):
            placeholder = st.empty()
            full_response = ""

            try:
                client = anthropic.Anthropic()
                with client.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1000,
                    system=context,
                    messages=[
                        {"role": m["role"], "content": m["content"]}
                        for m in st.session_state.messages
                    ]
                ) as stream:
                    for text in stream.text_stream:
                        full_response += text
                        placeholder.markdown(full_response + "▌")
                placeholder.markdown(full_response)

            except Exception as e:
                full_response = "⚠️ AI unavailable on this network. This feature will work at home or on unrestricted WiFi."
                placeholder.markdown(full_response)

        # Add response to history
        st.session_state.messages.append({
            "role": "assistant",
            "content": full_response
        })
