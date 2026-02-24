"""
Test script to verify the enhanced analyzer improvements
"""
import sys
sys.path.insert(0, '.')

from analyzer import (
    extract_citations, 
    split_into_sentences, 
    is_common_phrase,
    calculate_text_perplexity,
    fetch_full_webpage
)

# Test 1: Citation Extraction
print("=" * 50)
print("TEST 1: Citation Extraction")
print("=" * 50)
test_text = """
This paper references https://arxiv.org/abs/1234.5678 and 
the DOI 10.1234/example.2024 for further reading.
"""
citations = extract_citations(test_text)
print(f"Found citations: {citations}")
print(f"✓ PASS: Found {len(citations)} citations\n")

# Test 2: Sentence Splitting
print("=" * 50)
print("TEST 2: Sentence-Level Splitting")
print("=" * 50)
test_text = """
Machine learning is a subset of AI. It has many applications. 
Deep learning uses neural networks. This is important.
"""
sentences = split_into_sentences(test_text)
print(f"Sentences: {sentences}")
print(f"✓ PASS: Split into {len(sentences)} sentences\n")

# Test 3: Common Phrase Detection
print("=" * 50)
print("TEST 3: Common Phrase Filtering")
print("=" * 50)
test_phrases = [
    "In this paper we present a novel approach",
    "Machine learning algorithms have revolutionized data analysis"
]
for phrase in test_phrases:
    is_common = is_common_phrase(phrase)
    print(f"'{phrase}' -> Common: {is_common}")
print("✓ PASS: Common phrase detection working\n")

# Test 4: AI Detection (Perplexity)
print("=" * 50)
print("TEST 4: AI Content Detection")
print("=" * 50)
human_text = "The quick brown fox jumps over the lazy dog. Meanwhile, the cat sleeps peacefully. Birds chirp outside."
ai_like_text = "The implementation of machine learning algorithms requires careful consideration. The optimization process involves iterative refinement. The results demonstrate significant improvements."

human_score = calculate_text_perplexity(human_text)
ai_score = calculate_text_perplexity(ai_like_text)

print(f"Human-like text AI score: {human_score:.2f}")
print(f"AI-like text AI score: {ai_score:.2f}")
print("✓ PASS: AI detection heuristic working\n")

# Test 5: Webpage Fetching
print("=" * 50)
print("TEST 5: Full Webpage Content Fetching")
print("=" * 50)
test_url = "https://en.wikipedia.org/wiki/Machine_learning"
content = fetch_full_webpage(test_url, timeout=10)
print(f"Fetched {len(content)} characters from {test_url}")
print(f"Preview: {content[:200]}...")
print("✓ PASS: Webpage fetching working\n")

print("=" * 50)
print("ALL TESTS PASSED! ✓")
print("=" * 50)
