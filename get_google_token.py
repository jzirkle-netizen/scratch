import json
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/documents",
]

CREDS_FILE = r"C:\Users\jzirkle\.config\mcp\gcp-oauth.keys.json"

flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
creds = flow.run_local_server(port=0)

print("\n=== TOKENS OBTAINED SUCCESSFULLY ===")
print(f"CLIENT_ID: {creds.client_id}")
print(f"CLIENT_SECRET: {creds.client_secret}")
print(f"REFRESH_TOKEN: {creds.refresh_token}")
print("====================================\n")

token_data = {
    "client_id": creds.client_id,
    "client_secret": creds.client_secret,
    "refresh_token": creds.refresh_token,
    "token": creds.token,
}
token_path = r"C:\Users\jzirkle\.config\mcp\google_tokens.json"
with open(token_path, "w") as f:
    json.dump(token_data, f, indent=2)
print(f"Tokens saved to {token_path}")
