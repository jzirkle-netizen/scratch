# Miro + Cursor learning sample

This folder matches [Miro’s official tutorial](https://developers.miro.com/docs/tutorial-build-a-nodejs-app-from-a-miro-board-with-miro-mcp-cursor): structured board context → MCP tools in Cursor → a small Node dashboard.

## 1) Confirm Miro MCP (not only the plugin toggle)

Enabling `plugins.miro` in project settings helps, but the tutorial flow uses **Miro’s MCP server** so the agent can call tools like `board_get_items` and prompts like `code_create_from_board`.

In Cursor: **Settings → MCP → Add server**, and add a server pointing at Miro’s MCP URL (see [Connecting Miro MCP](https://developers.miro.com/docs/connecting-miro-mcp-to-ai-coding-tools#cursor)). Complete OAuth and pick the **same Miro team** where your learning board lives.

## 2) Build your board

Open `BOARD_CONTENT_FOR_MIRO.md` and recreate those three items on a board (PRD, architecture, data flow).

## 3) Practice prompts in Cursor chat

1. List board content: ask the agent to use **`board_get_items`** on your board (paste the board link or ID if asked).
2. Generate from the board: type **`/`** and choose **`code_create_from_board`** if it appears after MCP is connected.

Fallback manual prompt (replace the board id with yours from the board URL):

`Use context_analyze_board_and_implement with board <YOUR_BOARD_ID> and create a basic Node.js app that runs locally. If context is thin, use board_get_items to read items.`

## 4) Run this pre-built sample (optional)

You can compare what the agent might generate with what is already here:

```bash
cd miro-learning-sample
npm start
```

Open http://localhost:3000 — summary tiles and service cards should update as the mock data ticks.

## Files

| File | Purpose |
|------|--------|
| `server.js` | Tiny HTTP server + mock status changes + `/api/services` |
| `public/index.html` | Single-page UI with polling |
| `BOARD_CONTENT_FOR_MIRO.md` | Text to mirror on Miro for MCP practice |
