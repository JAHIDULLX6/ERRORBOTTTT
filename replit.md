# Goat Bot V2

## Overview
A Node.js-based Facebook Messenger bot framework with modular commands, event handlers, and pluggable data storage (SQLite and MongoDB). Uses a custom `fb-chat-api` implementation for interacting with Messenger.

## Architecture
- **Entry point**: `index.js` → spawns `Goat.js`
- **Bot handlers**: `bot/handler/` — action, check data, and event handlers
- **Login flow**: `bot/login/` — Facebook authentication, autologin, token management
- **Commands**: `scripts/cmds/` — modular command files
- **Events**: `scripts/events/` — event handler files
- **Database**: `database/` — SQLite (default) and MongoDB connectors + models
- **Languages**: `languages/` — i18n support (en, vi, etc.)
- **Logging**: `logger/` — custom logger with colors
- **fb-chat-api**: `fb-chat-api/` — custom Facebook Chat API implementation

## Configuration
- `config.json` — main config (prefix, admins, language, database type, serverUptime settings)
- `configCommands.json` — per-command enable/disable and env vars
- `account.txt` — Facebook appState/cookies for login
- `bot/data/tokens.json` — stored session tokens

## Database
- Default: SQLite (`database/data/data.sqlite`)
- Optional: MongoDB (configure `uriMongodb` in `config.json`)
- JSON fallback: `database/data/` directory

## Runtime
- Node.js 18.x (LTS)
- Package manager: npm (with `package-lock.json`)
- `bun.lock` also present but npm is used

## Workflow
- **Start application**: `node index.js` (console output type)
- The bot is a background service — no frontend/web UI
- Bot exits if no Facebook credentials are configured in `config.json` or `account.txt`

## Key Notes
- `undici` was downgraded to v5 and `cheerio` to `1.0.0-rc.12` for Node 18 compatibility (newer versions require `globalThis.File` which is only in Node 20+)
- No web server or frontend — this is a pure bot process
- To use the bot: configure Facebook credentials in `config.json` (email/password/2FA) or provide appState cookies in `account.txt`
