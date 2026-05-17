import os
from openai import OpenAI

# 1. Grab your token
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "Paste_Your_Token_Here_If_Testing")

client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=GITHUB_TOKEN
)

print("Pinging GitHub Models API...")

try:
    # 2. Use 'with_raw_response' to expose the hidden headers
    raw_response = client.chat.completions.with_raw_response.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "hello"}],
        max_tokens=10 # Keep it tiny so we don't waste tokens checking!
    )

    # 3. Extract the rate limit headers
    headers = raw_response.headers

    print("\n=== 📊 YOUR GITHUB API LIMITS ===")
    print(f"Requests Remaining: {headers.get('x-ratelimit-remaining-requests', 'N/A')}")
    print(f"Tokens Remaining:   {headers.get('x-ratelimit-remaining-tokens', 'N/A')}")
    print(f"Time until reset:   {headers.get('x-ratelimit-reset-requests', 'N/A')}")
    print("=================================\n")

except Exception as e:
    print(f"Error connecting: {e}")