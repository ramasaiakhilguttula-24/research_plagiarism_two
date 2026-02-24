import sys
from ddgs import DDGS

try:
    print("Testing DDGS...")
    with DDGS() as ddgs:
        results = list(ddgs.text("machine learning", max_results=3))
    print(f"Results found: {len(results)}")
    for r in results:
        print(f" - {r.get('title')}: {r.get('href')}")
except Exception as e:
    print(f"Error: {e}")
