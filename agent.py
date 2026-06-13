import os
import sys
import json
import random
import datetime
import urllib.parse
import subprocess
import requests
from dotenv import load_dotenv

# Try to load environment variables from neighboring auto-poster folder or local
load_dotenv()
load_dotenv("d:/AI/Playground/02-auto-poster-agent/.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Import notifier from neighboring project
sys.path.append("d:/AI/Playground/02-auto-poster-agent")
try:
    from notifier import trigger_milestone_alert
except ImportError:
    def trigger_milestone_alert(title, value):
        print(f"[Notifier Mock] Alert: {title} - {value}")

def call_gemini(prompt: str, use_search: bool = False):
    """Calls Gemini API with model fallback and optional search grounding."""
    if not GEMINI_API_KEY:
        print("Error: Gemini API Key is missing in .env")
        return None

    models = ["gemini-2.5-flash", "gemini-2.0-flash"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if use_search:
        payload["tools"] = [{"googleSearch": {}}]

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            response = requests.post(url, json=payload, timeout=60)
            if response.status_code == 200:
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"Gemini API Error ({model}): {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error calling Gemini ({model}): {e}")
            
    print("All Gemini models failed.")
    return None

def run_agent():
    print("=" * 60)
    print("  AuraFocus Autonomous Agent: Daily Aesthetic & SEO Update")
    print("=" * 60)

    # 1. Search Google for trending aesthetic desk setup items & quotes
    print("Searching Google for trending desk setup items and productivity tips...")
    search_prompt = (
        "What are the most popular minimalist desk setup accessories, desk organizer items, "
        "and productivity hacks trending among young professionals and students on Trendyol, Amazon, and Pinterest?"
    )
    
    search_results = "No search results available."
    try:
        raw_res = call_gemini(search_prompt, use_search=True)
        if raw_res:
            search_results = raw_res
            print("[OK] Trends searched successfully.")
    except Exception as e:
        print(f"Warning: Search grounding failed: {e}")

    # 2. Ask Gemini to generate new data.json content
    print("Generating updated dashboard content via Gemini...")
    generator_prompt = f"""
    You are an expert content curator and affiliate marketer for AuraFocus, a premium minimalist productivity web hub for Turkish youth.
    Analyze the following search trends and curate:
    1. A daily motivational, discipline, or productivity quote (in Turkish, elegant, mature, and impactful tone, modeled after @noble.vision.tr).
    2. A list of 3 aesthetic desktop accessories. For each accessory:
       - Title: Catchy product name (in Turkish, e.g. "Keçe Sümen (Desk Pad)", "RGB Monitör Ekran Lambası").
       - Price: Estimated price in TL (e.g., "349 TL", "899 TL").
       - image_url: A relevant, high-quality Unsplash image URL (use generic search queries on Unsplash like:
         - Keçe sümen: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=150"
         - Işık barı: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150"
         - Stand: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=150"
         - Keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150"
         - Notebook: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=150"
         - Desk light: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=150"
       - affiliate_link: Amazon.com.tr search query link for this item with the tracking ID 'aurafocus-21', e.g., "https://www.amazon.com.tr/s?k=kece+sumen&tag=aurafocus-21" (use URL-encoded terms, e.g. replacing spaces with +).
    
    SEARCH TRENDS:
    {search_results}

    Respond in STRICT JSON format (no markdown blocks, just raw JSON matching the schema below):
    {{
      "daily_quote": {{
        "quote": "Quote text in Turkish",
        "author": "N O B L E   V I S I O N"
      }},
      "products": [
        {{
          "title": "Accessory title",
          "price": "Price in TL",
          "image_url": "Unsplash URL",
          "affiliate_link": "Amazon search link with tag=aurafocus-21"
        }},
        ...
      ]
    }}
    """
    
    raw_json = call_gemini(generator_prompt, use_search=False)
    if not raw_json:
        print("[FAIL] Gemini returned empty response. Aborting.")
        return

    # 3. Parse and update data.json
    try:
        clean_json = raw_json.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        data["last_updated"] = datetime.datetime.utcnow().isoformat() + "Z"
        
        # Save to file
        with open("data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print("[OK] data.json updated successfully.")
        print(f"New Quote: {data['daily_quote']['quote']}")
        
    except Exception as e:
        print(f"[FAIL] Error parsing Gemini JSON: {e}")
        print("Raw response was:", raw_json[:300])
        return

    # 4. Trigger Notification
    try:
        quote = data['daily_quote']['quote']
        trigger_milestone_alert("AuraFocus Guncellendi", f"Yeni Kanca: {quote[:40]}...")
        print("[OK] SMS/Email notification sent.")
    except Exception as e:
        print(f"Warning: Failed to trigger notification: {e}")

    # 5. Git Commit and Push (Only in Git repo)
    if os.path.exists(".git"):
        print("Staging and committing data.json to git...")
        try:
            subprocess.run(["git", "config", "user.name", "AuraFocus Agent"], check=True)
            subprocess.run(["git", "config", "user.email", "agent@aurafocus.com"], check=True)
            subprocess.run(["git", "add", "data.json"], check=True)
            
            # Check if there are changes to commit
            status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
            if status.stdout.strip():
                subprocess.run(["git", "commit", "-m", "Otonom Guncelleme: Gunluk alinti ve urunler yenilendi [skip ci]"], check=True)
                subprocess.run(["git", "push", "origin", "main"], check=True)
                print("[OK] Git push completed. Website auto-deployed!")
            else:
                print("[INFO] No changes in data.json. Skipping commit.")
        except Exception as e:
            print(f"Warning: Git commit/push failed: {e}")
    else:
        print("[INFO] No Git repository detected. Skipping git push.")

if __name__ == "__main__":
    # Change working directory to script location
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_agent()
