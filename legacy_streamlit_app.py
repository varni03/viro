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

# ── Custom Styling ─────────────────────────────────────────────
st.markdown("""
<style>
    /* Main background */
    .stApp {
        background-color: #0f0f1a;
        color: #e2e8f0;
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #1a1a2e;
        border-right: 1px solid #2d2d44;
    }
    
    /* Cards / containers */
    [data-testid="stExpander"] {
        background-color: #1a1a2e;
        border: 1px solid #2d2d44;
        border-radius: 12px;
    }
    
    /* Metrics */
    [data-testid="stMetric"] {
        background-color: #1a1a2e;
        border: 1px solid #2d2d44;
        border-radius: 12px;
        padding: 16px;
    }
    
    [data-testid="stMetricValue"] {
        color: #6366f1;
        font-size: 2rem;
        font-weight: bold;
    }
    
    [data-testid="stMetricLabel"] {
        color: #94a3b8;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    /* Buttons */
    .stButton button {
        background-color: #6366f1;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 20px;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .stButton button:hover {
        background-color: #4f46e5;
        transform: translateY(-1px);
    }
    
    /* Input fields */
    .stTextInput input, .stTextArea textarea, .stSelectbox select {
        background-color: #1a1a2e;
        border: 1px solid #2d2d44;
        border-radius: 8px;
        color: #e2e8f0;
    }
    
    /* Dataframe */
    [data-testid="stDataFrame"] {
        border: 1px solid #2d2d44;
        border-radius: 12px;
    }
    
    /* Divider */
    hr {
        border-color: #2d2d44;
    }
    
    /* Title */
    h1 {
        color: #e2e8f0;
        font-weight: 700;
        font-size: 1.8rem;
    }
    
    h2, h3 {
        color: #cbd5e1;
    }
    
    /* Caption */
    .stCaption {
        color: #64748b;
    }
    
    /* Success/Error/Warning messages */
    .stSuccess {
        background-color: #064e3b;
        border: 1px solid #059669;
        border-radius: 8px;
    }
    
    .stError {
        background-color: #7f1d1d;
        border: 1px solid #dc2626;
        border-radius: 8px;
    }
    
    .stWarning {
        background-color: #78350f;
        border: 1px solid #d97706;
        border-radius: 8px;
    }
    
    /* Chat messages */
    [data-testid="stChatMessage"] {
        background-color: #1a1a2e;
        border: 1px solid #2d2d44;
        border-radius: 12px;
        margin-bottom: 8px;
    }
    
    /* Progress bar */
    .stProgress > div > div {
        background-color: #6366f1;
    }
    
    /* Radio buttons in sidebar */
    .stRadio label {
        color: #94a3b8;
        font-size: 0.95rem;
    }
    
    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
</style>
""", unsafe_allow_html=True)


# ── Initialize database ────────────────────────────────────────
@st.cache_resource
def get_db():
    return ViroDB()

db = get_db()

# ── Sidebar ────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='text-align: center; padding: 20px 0;'>
        <h1 style='color: #6366f1; font-size: 2rem; margin: 0;'>⬡ Viro</h1>
        <p style='color: #64748b; font-size: 0.8rem; margin: 4px 0 0 0;'>
            Manufacturing Intelligence
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    # Company selector
    companies = db.query("SELECT * FROM companies")
    company_names = companies["name"].tolist()
    selected_name = st.selectbox("🏭 Company", company_names)
    selected_company = companies[companies["name"] == selected_name].iloc[0]
    company_id = selected_company["company_id"]

    st.divider()

    # Navigation
    page = st.radio(
        "Navigate",
        ["Dashboard", "Vehicle Search", "Log Defect", 
         "AI Assistant", "Analytics", "Predictive"]
    )

    st.divider()

    # Quick stats in sidebar
    total = db.query(
        "SELECT COUNT(*) as c FROM products WHERE company_id = ?",
        (company_id,)
    ).iloc[0]["c"]

    unresolved = db.query(
        "SELECT COUNT(*) as c FROM defects WHERE company_id = ? AND resolved = 0",
        (company_id,)
    ).iloc[0]["c"]

    st.markdown(f"""
    <div style='padding: 12px; background: #0f0f1a; border-radius: 8px; 
                border: 1px solid #2d2d44;'>
        <p style='color: #64748b; font-size: 0.75rem; margin: 0 0 8px 0;'>
            QUICK STATS
        </p>
        <p style='color: #e2e8f0; margin: 4px 0;'>
            📦 <b>{total}</b> products
        </p>
        <p style='color: #f97316; margin: 4px 0;'>
            ⚠️ <b>{unresolved}</b> unresolved defects
        </p>
    </div>
    """, unsafe_allow_html=True)




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

    # Example questions
    with st.expander("💡 Example questions to ask"):
        st.markdown("""
        - Which stage has the most defects?
        - How many critical defects are unresolved?
        - Show me all flagged products
        - What is the most common defect type?
        - Which products have more than 3 defects?
        - How many products are currently in progress?
        - What percentage of defects are high severity?
        - Show me defects logged in the last 7 days
        """)

    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "query_results" not in st.session_state:
        st.session_state.query_results = {}

    # Clear chat button
    if st.button("🗑️ Clear Chat"):
        st.session_state.messages = []
        st.session_state.query_results = {}
        st.rerun()

    st.divider()

    # Display chat history
    for i, message in enumerate(st.session_state.messages):
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            # Show dataframe if this message has query results
            if message["role"] == "assistant" and i in st.session_state.query_results:
                result_df = st.session_state.query_results[i]
                if result_df is not None and not result_df.empty:
                    st.dataframe(result_df, use_container_width=True)

    # Chat input
    if prompt := st.chat_input("Ask Viro anything about your data..."):

        # Add user message
        st.session_state.messages.append({
            "role": "user",
            "content": prompt
        })
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            placeholder = st.empty()
            full_response = ""
            result_df = None

            try:
                client = anthropic.Anthropic()

                # Step 1 — run natural language to SQL query
                with st.spinner("Querying data..."):
                    result_df, sql = db.natural_language_query(prompt, company_id)

                # Step 2 — get AI to interpret the results
                if result_df is not None and not result_df.empty:
                    data_context = f"""
                    The user asked: {prompt}
                    
                    SQL query executed: {sql}
                    
                    Query results:
                    {result_df.to_string()}
                    
                    Provide a clear, concise answer based on these results.
                    Highlight any important insights or concerns.
                    If there are critical or high severity defects mention them prominently.
                    Be direct and actionable.
                    """
                elif result_df is not None and result_df.empty:
                    data_context = f"""
                    The user asked: {prompt}
                    The query returned no results.
                    Tell the user no data was found matching their question.
                    """
                else:
                    data_context = f"""
                    The user asked: {prompt}
                    There was an error running the query: {sql}
                    Apologize and suggest they rephrase the question.
                    """

                # Stream the response
                with client.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1000,
                    system=f"You are Viro, an AI assistant for {selected_name} manufacturing quality control. Be concise, direct, and actionable.",
                    messages=[{"role": "user", "content": data_context}]
                ) as stream:
                    for text in stream.text_stream:
                        full_response += text
                        placeholder.markdown(full_response + "▌")

                placeholder.markdown(full_response)

                # Show the data table
                if result_df is not None and not result_df.empty:
                    st.dataframe(result_df, use_container_width=True)

            except Exception as e:
                full_response = "⚠️ AI unavailable on this network. This feature will work at home or on unrestricted WiFi."
                placeholder.markdown(full_response)

        # Save to history
        msg_index = len(st.session_state.messages)
        st.session_state.messages.append({
            "role": "assistant",
            "content": full_response
        })
        if result_df is not None:
            st.session_state.query_results[msg_index] = result_df
    page = st.radio(
        "Navigation",
        ["Dashboard", "Vehicle Search", "Log Defect", "AI Assistant", "Analytics", "Predictive"]
    )
# ── Analytics Page ─────────────────────────────────────────────
elif page == "Analytics":
    st.title(f"📊 {selected_name} — Analytics")

    # Defect trends over time
    st.subheader("Defect Trends Over Time")
    trends = db.get_defect_trends(company_id)
    if not trends.empty:
        fig = px.line(
            trends,
            x="date",
            y=["total_defects", "critical", "high"],
            labels={"value": "Defects", "date": "Date", "variable": "Type"},
            color_discrete_map={
                "total_defects": "#6366f1",
                "critical": "#ef4444",
                "high": "#f97316"
            }
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No trend data available yet")

    st.divider()

    # Stage health
    st.subheader("Stage Health Scores")
    stage_health = db.get_stage_health(company_id)
    if not stage_health.empty:
        col1, col2 = st.columns(2)

        with col1:
            for _, stage in stage_health.iterrows():
                score = stage["health_score"]
                color = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
                st.metric(
                    f"{color} Stage {int(stage['stage_number'])} — {stage['stage_name']}",
                    f"{score}% healthy",
                    f"{int(stage['unresolved'])} unresolved defects"
                )

        with col2:
            fig = px.bar(
                stage_health,
                x="stage_name",
                y="health_score",
                color="health_score",
                color_continuous_scale="RdYlGn",
                labels={"stage_name": "Stage", "health_score": "Health Score"},
                title="Health Score by Stage"
            )
            fig.update_layout(showlegend=False)
            st.plotly_chart(fig, use_container_width=True)

    st.divider()

    # Defect type breakdown
    st.subheader("Defect Type Breakdown")
    defects = db.get_defects(company_id)
    if not defects.empty:
        col1, col2 = st.columns(2)

        with col1:
            defect_type_counts = defects["defect_type"].value_counts().reset_index()
            defect_type_counts.columns = ["defect_type", "count"]
            fig = px.bar(
                defect_type_counts,
                x="count",
                y="defect_type",
                orientation="h",
                color="count",
                color_continuous_scale="Reds",
                labels={"defect_type": "Type", "count": "Count"},
                title="Most Common Defect Types"
            )
            fig.update_layout(showlegend=False)
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            resolved_counts = defects["resolved"].value_counts().reset_index()
            resolved_counts.columns = ["resolved", "count"]
            resolved_counts["resolved"] = resolved_counts["resolved"].map(
                {0: "Unresolved", 1: "Resolved"}
            )
            fig = px.pie(
                resolved_counts,
                values="count",
                names="resolved",
                color="resolved",
                color_discrete_map={
                    "Resolved": "#22c55e",
                    "Unresolved": "#ef4444"
                },
                title="Resolution Status"
            )
            st.plotly_chart(fig, use_container_width=True)

    st.divider()

    # Raw data export
    st.subheader("Export Data")
    col1, col2 = st.columns(2)

    with col1:
        if not defects.empty:
            csv = defects.to_csv(index=False)
            st.download_button(
                "⬇️ Download Defects CSV",
                csv,
                f"{selected_name}_defects.csv",
                "text/csv"
            )

    with col2:
        products = db.get_products(company_id)
        if not products.empty:
            csv = products.to_csv(index=False)
            st.download_button(
                "⬇️ Download Products CSV",
                csv,
                f"{selected_name}_products.csv",
                "text/csv"
            )

# ── Predictive Page ────────────────────────────────────────────
elif page == "Predictive":
    st.title(f"⚠️ {selected_name} — Predictive Risk Analysis")
    st.caption("AI identifies products at risk before they fail")

    at_risk = db.get_at_risk_products(company_id)
    stage_health = db.get_stage_health(company_id)

    # Summary metrics
    total_products = len(db.get_products(company_id))
    at_risk_count = len(at_risk)
    critical_stages = len(stage_health[stage_health["health_score"] < 60]) if not stage_health.empty else 0

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "At Risk Products",
            at_risk_count,
            f"{round(at_risk_count/max(total_products,1)*100, 1)}% of total",
            delta_color="inverse"
        )
    with col2:
        st.metric(
            "Critical Stages",
            critical_stages,
            "below 60% health",
            delta_color="inverse"
        )
    with col3:
        safe_count = total_products - at_risk_count
        st.metric("Safe Products", safe_count)

    st.divider()

    # At risk products
    st.subheader("🔴 At Risk Products")
    if at_risk.empty:
        st.success("✅ No products currently flagged as at risk")
    else:
        for _, product in at_risk.iterrows():
            risk_score = product["risk_score"]
            color = "🔴" if risk_score >= 6 else "🟠"

            with st.expander(
                f"{color} {product['product_id']} — "
                f"Risk Score: {int(risk_score)} — "
                f"Stage {int(product['current_stage'])} — "
                f"{int(product['unresolved_defects'])} unresolved defects"
            ):
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Total Defects", int(product["total_defects"]))
                with col2:
                    st.metric("Unresolved", int(product["unresolved_defects"]))
                with col3:
                    st.metric("Risk Score", int(risk_score))

                st.write(f"**Defect Types:** {product['defect_types']}")
                st.write(f"**Current Status:** {product['status']}")

                # AI recommendation
                if st.button(f"Get AI Recommendation", key=product["product_id"]):
                    try:
                        client = anthropic.Anthropic()
                        response = client.messages.create(
                            model="claude-sonnet-4-20250514",
                            max_tokens=300,
                            messages=[{
                                "role": "user",
                                "content": f"""
                                This manufacturing product needs attention:
                                - Product ID: {product['product_id']}
                                - Current Stage: {product['current_stage']}
                                - Total Defects: {product['total_defects']}
                                - Unresolved Defects: {product['unresolved_defects']}
                                - Risk Score: {risk_score}
                                - Defect Types: {product['defect_types']}
                                
                                Give a specific 2-3 sentence recommendation on what action to take.
                                Be direct and actionable.
                                """
                            }]
                        )
                        st.info(f"💡 {response.content[0].text}")
                    except:
                        st.warning("AI recommendation unavailable on this network")

    st.divider()

    # Stage risk breakdown
    st.subheader("Stage Risk Overview")
    if not stage_health.empty:
        for _, stage in stage_health.iterrows():
            score = stage["health_score"]
            color = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
            st.progress(
                int(score) / 100,
                text=f"{color} Stage {int(stage['stage_number'])} — {stage['stage_name']} — {score}% healthy — {int(stage['unresolved'])} unresolved defects"
            )
