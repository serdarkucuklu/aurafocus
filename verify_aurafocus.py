import os
import sys
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def verify_files():
    print("--- Verifying Project Files ---")
    required = ["index.html", "style.css", "app.js", "data.json", "agent.py", ".github/workflows/run_agent.yml"]
    all_ok = True
    for f in required:
        path = f
        if os.path.exists(path):
            print(f"[OK] File exists: {f}")
        else:
            print(f"[FAIL] Missing file: {f}")
            all_ok = False
    return all_ok

def run_agent_test():
    print("\n--- Running agent.py Local Dry Run ---")
    import agent
    
    # Verify we can load the initial DB
    try:
        with open("data.json", "r", encoding="utf-8") as f:
            old_data = json.load(f)
        print(f"[OK] Read initial data.json. Current quote: {old_data['daily_quote']['quote']}")
    except Exception as e:
        print(f"[FAIL] Could not read data.json: {e}")
        return False
        
    # Run the main agent routine (this will call Gemini and update data.json)
    try:
        agent.run_agent()
        print("[OK] agent.run_agent() finished execution loop.")
    except Exception as e:
        print(f"[FAIL] Exception running agent: {e}")
        return False
        
    # Verify new DB content
    try:
        with open("data.json", "r", encoding="utf-8") as f:
            new_data = json.load(f)
        
        # Verify structure
        if "daily_quote" in new_data and "products" in new_data:
            print("[OK] data.json structure is valid.")
            print(f"New Quote: {new_data['daily_quote']['quote']}")
            print(f"New Products count: {len(new_data['products'])}")
            for idx, prod in enumerate(new_data['products']):
                print(f"  Product {idx+1}: {prod['title']} - {prod['price']}")
            return True
        else:
            print(f"[FAIL] data.json missing required keys: {new_data.keys()}")
            return False
    except Exception as e:
        print(f"[FAIL] Could not read updated data.json: {e}")
        return False

if __name__ == "__main__":
    # Change working directory to script location
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    files_ok = verify_files()
    if not files_ok:
        sys.exit(1)
        
    agent_ok = run_agent_test()
    if agent_ok:
        print("\nALL TESTS PASSED! AuraFocus Agent is fully verified and functional.")
        sys.exit(0)
    else:
        print("\nTESTS FAILED. Please check API credentials and log errors.")
        sys.exit(1)
