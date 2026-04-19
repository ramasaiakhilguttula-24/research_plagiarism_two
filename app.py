import streamlit as st
import sys
import os
import json
import tempfile
from pathlib import Path

# Add backend python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'python'))

# Import analyzer
from analyzer import check_plagiarism

# Page config
st.set_page_config(
    page_title="PlagiScan - Plagiarism Detector",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling
st.markdown("""
    <style>
    .main {
        padding: 2rem;
    }
    .stProgress > div > div > div > div {
        background-color: #FF6B6B;
    }
    .result-box {
        padding: 20px;
        border-radius: 10px;
        margin: 10px 0;
    }
    .plagiarism-high {
        background-color: #ffebee;
        border-left: 4px solid #d32f2f;
    }
    .plagiarism-medium {
        background-color: #fff3e0;
        border-left: 4px solid #f57c00;
    }
    .plagiarism-low {
        background-color: #e8f5e9;
        border-left: 4px solid #388e3c;
    }
    </style>
    """, unsafe_allow_html=True)

# Header
st.title("🔍 PlagiScan - Research Plagiarism Analyzer")
st.markdown("Advanced AI-powered plagiarism detection with real-time progress tracking")
st.divider()

# Sidebar
with st.sidebar:
    st.header("ℹ️ About")
    st.markdown("""
    **PlagiScan** detects plagiarism in research papers by:
    
    1. **Analyzing 20 unique fingerprint sentences** using TF-IDF
    2. **Searching DuckDuckGo** for each sentence (free, no API keys!)
    3. **Computing similarity scores** using semantic embeddings
    4. **Generating a plagiarism report** with sources
    
    **Features:**
    - ✅ Async processing (no timeouts!)
    - ✅ Real-time progress updates
    - ✅ AI detection score
    - ✅ Citation detection
    - ✅ Instant results (1-2 minutes)
    
    **Free & Open Source** 🚀
    """)

# Main content
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("📤 Upload Your Paper")
    st.markdown("Supports PDF and DOCX files (Max 20MB)")
    
    uploaded_file = st.file_uploader(
        "Drag and drop your file here",
        type=["pdf", "docx"],
        label_visibility="collapsed"
    )

if uploaded_file is not None:
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(uploaded_file.name).suffix) as tmp_file:
        tmp_file.write(uploaded_file.getbuffer())
        tmp_file_path = tmp_file.name
    
    try:
        st.success(f"✅ File uploaded: {uploaded_file.name}")
        st.markdown("---")
        
        # Start analysis
        st.info("🔄 Analyzing document... This may take 1-2 minutes")
        
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        # Run analysis
        with st.spinner("Extracting text and analyzing for plagiarism..."):
            results = check_plagiarism(tmp_file_path)
        
        # Check for errors
        if "error" in results:
            st.error(f"❌ Analysis failed: {results['error']}")
        else:
            progress_bar.progress(100)
            status_text.success("✅ Analysis Complete!")
            st.markdown("---")
            
            # Results section
            st.markdown("## 📊 Analysis Results")
            
            # Metrics
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                plagiarism_score = results.get('score', 0)
                st.metric(
                    label="Plagiarism Score",
                    value=f"{plagiarism_score}%",
                    delta=f"{plagiarism_score}% detected"
                )
            
            with col2:
                ai_prob = results.get('ai_probability', 0)
                st.metric(
                    label="AI-Generated Probability",
                    value=f"{ai_prob*100:.1f}%",
                    delta="AI Detection Score"
                )
            
            with col3:
                plagiarized_count = results.get('plagiarized_sentences', 0)
                total = results.get('total_sentences', 1)
                st.metric(
                    label="Plagiarized Sentences",
                    value=f"{plagiarized_count}",
                    delta=f"out of {total}"
                )
            
            with col4:
                citations = results.get('citations_found', 0)
                st.metric(
                    label="Citations Found",
                    value=f"{citations}",
                    delta="source references"
                )
            
            st.markdown("---")
            
            # Plagiarism bar chart
            st.markdown("### Plagiarism Score Breakdown")
            
            plagiarism_pct = results.get('score', 0)
            original_pct = 100 - plagiarism_pct
            
            # Create columns for visualization
            col1, col2 = st.columns(2)
            
            with col1:
                st.progress(plagiarism_pct / 100, text=f"Plagiarized: {plagiarism_pct}%")
            
            with col2:
                st.progress(original_pct / 100, text=f"Original: {original_pct}%")
            
            # Risk assessment
            st.markdown("### 🎯 Risk Assessment")
            
            if plagiarism_pct >= 50:
                st.error(f"🚨 HIGH RISK: {plagiarism_pct}% plagiarism detected")
                risk_color = "plagiarism-high"
                risk_text = "This document contains substantial plagiarized content"
            elif plagiarism_pct >= 20:
                st.warning(f"⚠️ MEDIUM RISK: {plagiarism_pct}% plagiarism detected")
                risk_color = "plagiarism-medium"
                risk_text = "This document contains some plagiarized content"
            else:
                st.success(f"✅ LOW RISK: {plagiarism_pct}% plagiarism detected")
                risk_color = "plagiarism-low"
                risk_text = "This document appears to be original"
            
            st.markdown(f"<div class='result-box {risk_color}'><strong>{risk_text}</strong></div>", unsafe_allow_html=True)
            
            st.markdown("---")
            
            # Detailed segments
            st.markdown("### 📝 Plagiarized Segments")
            
            segments = results.get('segments', [])
            plagiarized_segments = [s for s in segments if s.get('is_plagiarized')]
            
            if plagiarized_segments:
                for i, segment in enumerate(plagiarized_segments[:10], 1):  # Show top 10
                    with st.expander(f"Segment {i} - Similarity: {segment.get('similarity', 0):.1%}"):
                        st.markdown(f"**Text:** {segment['text'][:200]}...")
                        
                        source = segment.get('source', {})
                        if source:
                            st.markdown(f"**Source:** [{source.get('title', 'Unknown')}]({source.get('url', '#')})")
                        
                        st.markdown(f"**Similarity Score:** {segment.get('similarity', 0):.1%}")
                        
                        if segment.get('is_cited'):
                            st.info("✅ This source is cited in the document")
                        else:
                            st.warning("❌ This source is NOT cited (potential plagiarism)")
            else:
                st.success("✅ No plagiarized segments detected!")
            
            st.markdown("---")
            
            # Summary statistics
            st.markdown("### 📈 Summary Statistics")
            
            summary_col1, summary_col2, summary_col3 = st.columns(3)
            
            with summary_col1:
                st.info(f"**Total Sentences:** {results.get('total_sentences', 0)}")
            
            with summary_col2:
                st.warning(f"**Checked Sentences:** 20 (fingerprints)")
            
            with summary_col3:
                st.success(f"**Citations Found:** {results.get('citations_found', 0)}")
            
            # Download results as JSON
            st.markdown("---")
            st.markdown("### 💾 Export Results")
            
            json_results = json.dumps(results, indent=2)
            st.download_button(
                label="📥 Download Results (JSON)",
                data=json_results,
                file_name=f"plagiarism_report_{uploaded_file.name}.json",
                mime="application/json"
            )
    
    finally:
        # Clean up temp file
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)

else:
    # Show example/welcome message
    st.markdown("---")
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### 🚀 Quick Start
        
        1. **Upload** a PDF or DOCX file
        2. **Wait** 1-2 minutes for analysis
        3. **Review** plagiarism report
        4. **Download** results as JSON
        
        ### ⚡ How It Works
        
        - Extracts 20 unique sentences (fingerprints)
        - Searches DuckDuckGo for each sentence
        - Compares using AI embeddings
        - Analyzes citations
        - Generates detailed report
        """)
    
    with col2:
        st.markdown("""
        ### 📊 Features
        
        - ✅ **Free** - No API keys needed
        - ✅ **Fast** - Async processing (1-2 min)
        - ✅ **Accurate** - AI-powered embeddings
        - ✅ **Detailed** - Shows sources & citations
        - ✅ **Secure** - Files deleted after analysis
        - ✅ **Exportable** - Download JSON report
        
        ### 🔐 Privacy
        
        Your files are processed immediately and deleted after analysis. No data is stored.
        """)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center'>
    <p>🔍 <strong>PlagiScan</strong> - Advanced Plagiarism Detection</p>
    <p style='font-size: 0.8em; color: gray;'>Powered by Streamlit | DuckDuckGo Search | Sentence Transformers</p>
</div>
""", unsafe_allow_html=True)
