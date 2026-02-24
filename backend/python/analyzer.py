import sys
import json
import os
import re
import math
import time
import requests
import pdfplumber
from sentence_transformers import SentenceTransformer, util
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

try:
    from ddgs import DDGS
except ImportError:
    sys.stderr.write("Error: ddgs not installed. Please run: pip install ddgs\n")
    sys.exit(1)

# Load models
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    sys.stderr.write(f"Model loading failed: {e}\n")
    sys.exit(1)

# Common academic phrases to filter out
COMMON_PHRASES = {
    "in this paper", "this paper presents", "in conclusion", "as shown in",
    "according to", "it is important to note", "in recent years", "this study",
    "the results show", "it can be seen", "as discussed", "in summary",
    "the purpose of this", "the aim of this", "the objective of this"
}

# ============================================================================
# OPTIMIZATION 1: Cache webpage fetches
# ============================================================================
webpage_cache = {}

def extract_text_from_pdf(path):
    """Extract text from PDF file."""
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def extract_citations(text):
    """Extract citations/references from text."""
    citations = set()
    
    # Find URLs
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    urls = re.findall(url_pattern, text)
    citations.update(urls)
    
    # Find DOIs
    doi_pattern = r'10\.\d{4,}/[^\s]+'
    dois = re.findall(doi_pattern, text)
    citations.update([f"https://doi.org/{doi}" for doi in dois])
    
    return citations

def split_into_sentences(text):
    """Split text into sentences."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    return sentences

def is_common_phrase(text):
    """Check if text is mostly common academic phrases."""
    text_lower = text.lower()
    for phrase in COMMON_PHRASES:
        if phrase in text_lower and len(text) < 100:
            return True
    return False

def fetch_full_webpage(url, timeout=3):
    """
    Fetch and extract main text content from a webpage.
    OPTIMIZED: Reduced timeout, uses cache.
    """
    # Check cache first
    if url in webpage_cache:
        return webpage_cache[url]
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text
        text = soup.get_text(separator=' ', strip=True)
        text = re.sub(r'\s+', ' ', text)
        text = text[:5000]  # Reduced from 10k to 5k for speed
        
        # Cache the result
        webpage_cache[url] = text
        
        return text
        
    except Exception as e:
        webpage_cache[url] = ""  # Cache failures too
        return ""

def calculate_text_perplexity(text):
    """Estimate text perplexity for AI detection."""
    words = text.split()
    if len(words) < 10:
        return 0.5
    
    unique_words = len(set(words))
    total_words = len(words)
    diversity = unique_words / total_words
    
    sentences = re.split(r'[.!?]+', text)
    sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
    
    if len(sentence_lengths) < 2:
        return 0.5
    
    avg_length = sum(sentence_lengths) / len(sentence_lengths)
    variance = sum((l - avg_length) ** 2 for l in sentence_lengths) / len(sentence_lengths)
    variance_score = min(variance / 50, 1.0)
    ai_score = 1 - ((diversity + variance_score) / 2)
    
    return max(0.0, min(1.0, ai_score))

def search_duckduckgo(query):
    """Search using DuckDuckGo."""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=3):
                results.append(r)
        return results
    except Exception as e:
        sys.stderr.write(f"DDG Search Error: {e}\n")
        return []

# ============================================================================
# OPTIMIZATION 2: Process single sentence (for parallel execution)
# ============================================================================
def process_sentence(sentence, paper_citations, similarity_threshold=0.65):
    """
    Process a single sentence for plagiarism.
    This function is designed to be run in parallel.
    """
    segment_result = {
        "text": sentence,
        "is_plagiarized": False,
        "similarity": 0.0,
        "source": None,
        "is_cited": False
    }
    
    # Search the web
    search_results = search_duckduckgo(sentence[:150])
    
    best_sim = 0.0
    best_source = None
    
    if search_results:
        # Encode the sentence once
        sent_emb = model.encode(sentence, convert_to_tensor=True)
        
        for item in search_results:
            source_url = item.get('href', '')
            
            # Try snippet first (faster)
            snippet = item.get('body') or item.get('snippet') or ''
            if snippet:
                snip_emb = model.encode(snippet, convert_to_tensor=True)
                sim = util.cos_sim(sent_emb, snip_emb).item()
                
                if sim > best_sim:
                    best_sim = sim
                    best_source = {
                        "url": source_url,
                        "title": item.get('title', 'Unknown')
                    }
            
            # Only fetch full page if snippet similarity is promising (>0.5)
            if best_sim > 0.5:
                full_content = fetch_full_webpage(source_url)
                
                if full_content:
                    # Compare against full content (limit to 5 chunks for speed)
                    content_chunks = [full_content[i:i+500] for i in range(0, len(full_content), 250)]
                    
                    for chunk in content_chunks[:5]:  # Reduced from 10 to 5
                        if len(chunk) < 50:
                            continue
                        
                        chunk_emb = model.encode(chunk, convert_to_tensor=True)
                        sim = util.cos_sim(sent_emb, chunk_emb).item()
                        
                        if sim > best_sim:
                            best_sim = sim
                            best_source = {
                                "url": source_url,
                                "title": item.get('title', 'Unknown')
                            }
    
    # Check if this source is cited
    is_cited = False
    if best_source and best_source['url']:
        source_domain = urlparse(best_source['url']).netloc
        is_cited = any(source_domain in str(citation) for citation in paper_citations)
        segment_result["is_cited"] = is_cited
    
    # Mark as plagiarized logic:
    # 1. If similarity is very high (> 0.85), it's likely a direct copy/paste or the same paper
    #    Checking "is_cited" here is tricky: if you cite a paper, you shouldn't copy it word-for-word.
    #    So we marks as plagiarized if > 0.85 regardless of citation.
    
    if best_sim > 0.85:
         segment_result["is_plagiarized"] = True
    elif best_sim > similarity_threshold:
        # For moderate similarity, we respect the citation
        segment_result["is_plagiarized"] = not is_cited
    
    if segment_result["is_plagiarized"]:
        segment_result["similarity"] = best_sim
        segment_result["source"] = best_source
    
    return segment_result

def select_smart_queries(sentences, top_n=15):
    """
    Select the most distinctive sentences using TF-IDF.
    Returns the top_n sentences that have the highest cumulative TF-IDF scores usually indicating
    rare/specific technical terms.
    """
    if len(sentences) <= top_n:
        return sentences

    try:
        # Create TF-IDF matrix
        # using 'english' stop words removes common words like "the", "is", "at"
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(sentences)
        
        # Calculate sum of TF-IDF scores for each sentence (row sum)
        # Higher sum means the sentence contains more "important/rare" words
        sentence_scores = np.asarray(tfidf_matrix.sum(axis=1)).flatten()
        
        # Get indices of top_n scores
        top_indices = sentence_scores.argsort()[-top_n:][::-1]
        
        # Return selected sentences sorted by their original position
        # (Sorting by original position helps keep some context flow if we were debugging)
        top_indices = sorted(top_indices)
        
        selected = [sentences[i] for i in top_indices]
        sys.stderr.write(f"Smart Select: Kept {len(selected)}/{len(sentences)} sentences based on uniqueness.\n")
        return selected

    except Exception as e:
        sys.stderr.write(f"Smart selection failed ({e}), falling back to random sampling.\n")
        # Fallback: take first, middle, last and some in between
        step = max(1, len(sentences) // top_n)
        return sentences[::step][:top_n]

# ============================================================================
# OPTIMIZATION 3: Parallel processing with smart sampling
# ============================================================================
def check_plagiarism(text_file):
    """
    OPTIMIZED plagiarism detection with:
    - Parallel processing
    - Reduced delays
    - Smart sampling
    - Caching
    """
    # 1. Extract Text
    text = extract_text_from_pdf(text_file)
    if not text.strip():
        return {"error": "Could not extract text or empty document."}
    
    # 2. Extract citations
    paper_citations = extract_citations(text)
    sys.stderr.write(f"Found {len(paper_citations)} citations in paper\n")
    
    # 3. Split into sentences
    all_sentences = split_into_sentences(text)
    
    # OPTIMIZATION: Smart sampling - check every 2nd sentence for long papers
    # OPTIMIZATION: Smart sampling with TF-IDF
    # Instead of checking every sentence (slow! 500+ requests), we check the ~20 most unique ones.
    # If a paper is plagiarized, the "unique" sentences usually catch it.
    
    sys.stderr.write(f"Total sentences extracted: {len(all_sentences)}\n")
    
    # 1. Filter out short/common phrases first
    valid_sentences = [s for s in all_sentences if len(s) >= 40 and not is_common_phrase(s)]
    
    # 2. Select top "fingerprint" sentences
    sentences = select_smart_queries(valid_sentences, top_n=50)
    
    sys.stderr.write(f"Analyzing {len(sentences)} selected fingerprint sentences\n")
    
    # Filter out short and common phrases
    # (Sentences already filtered above)
    
    results = []
    total_plagiarized_count = 0
    
    # Configuration
    RATE_LIMIT_DELAY = 0.8  # Reduced from 2.0 to 0.8 seconds
    SIMILARITY_THRESHOLD = 0.65
    MAX_WORKERS = 3  # Process 3 sentences in parallel
    
    # OPTIMIZATION: Parallel processing with rate limiting
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit tasks in batches to respect rate limits
        batch_size = MAX_WORKERS
        
        for batch_start in range(0, len(sentences), batch_size):
            batch = sentences[batch_start:batch_start + batch_size]
            
            # Submit batch
            futures = {
                executor.submit(process_sentence, sent, paper_citations, SIMILARITY_THRESHOLD): sent 
                for sent in batch
            }
            
            # Collect results
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result["is_plagiarized"]:
                        total_plagiarized_count += 1
                    results.append(result)
                except Exception as e:
                    sys.stderr.write(f"Error processing sentence: {e}\n")
            
            # Rate limit between batches
            if batch_start + batch_size < len(sentences):
                time.sleep(RATE_LIMIT_DELAY)
            
            # Progress indicator
            sys.stderr.write(f"Processed {min(batch_start + batch_size, len(sentences))}/{len(sentences)} sentences\n")
    
    # Calculate Overall Score
    plagiarism_score = 0
    if results:
        raw_score = (total_plagiarized_count / len(results)) * 100
        
        # BOOST LOGIC:
        # If we find > 20% plagiarism in random checks, the real document is likely much higher.
        # We apply a multiplier to reflect the "severity" rather than just raw count.
        if raw_score > 50:
             # If > 50% lines are stolen, it's basically 100% plagiarized
            plagiarism_score = min(100, int(raw_score * 1.5))
        elif raw_score > 20:
             # If > 20% lines are stolen, boost by 1.3x
            plagiarism_score = min(100, int(raw_score * 1.3))
        else:
            plagiarism_score = int(raw_score)
    
    # Enhanced AI Detection
    ai_score = calculate_text_perplexity(text)
    
    return {
        "score": plagiarism_score,
        "ai_probability": round(ai_score, 2),
        "segments": results,
        "total_sentences": len(all_sentences),
        "plagiarized_sentences": total_plagiarized_count,
        "citations_found": len(paper_citations)
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path"}))
        sys.exit(1)
    
    try:
        if not os.path.exists(sys.argv[1]):
            raise FileNotFoundError(f"File not found: {sys.argv[1]}")
        
        output = check_plagiarism(sys.argv[1])
        print(json.dumps(output))
        
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)
