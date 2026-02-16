#!/usr/bin/env python3
"""
Trigger GitHub Actions workflow using GitHub API
Requires: GitHub Personal Access Token (PAT) with 'actions' scope
"""

import requests
import sys
import os

# Configuration
OWNER = "cedyson8-creator"
REPO = "traffic-booster-app"
WORKFLOW_FILE = "build-release.yml"
BRANCH = "main"

def trigger_workflow(token):
    """Trigger the build-release workflow"""
    
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/{WORKFLOW_FILE}/dispatches"
    
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    
    payload = {
        "ref": BRANCH,
        "inputs": {
            "version": "1.0.0"
        }
    }
    
    print(f"🔄 Triggering workflow: {WORKFLOW_FILE}")
    print(f"📍 Repository: {OWNER}/{REPO}")
    print(f"🌿 Branch: {BRANCH}")
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 204:
        print("✅ Workflow triggered successfully!")
        print(f"📊 Check progress at: https://github.com/{OWNER}/{REPO}/actions")
        return True
    elif response.status_code == 401:
        print("❌ Authentication failed. Invalid or expired token.")
        return False
    elif response.status_code == 404:
        print("❌ Workflow not found. Make sure the workflow file exists.")
        return False
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    token = os.getenv("GITHUB_TOKEN")
    
    if not token:
        print("❌ GITHUB_TOKEN environment variable not set")
        print("📝 Instructions:")
        print("1. Create a Personal Access Token at: https://github.com/settings/tokens")
        print("2. Grant 'actions' scope")
        print("3. Run: export GITHUB_TOKEN='your_token_here'")
        print("4. Then run this script again")
        sys.exit(1)
    
    success = trigger_workflow(token)
    sys.exit(0 if success else 1)
