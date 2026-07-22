# Development Workflow

## Starting the Server

**Always use `screen` to start the server.** The bash tool kills child processes when the shell session times out. Running `node src/server.js` directly will start the server, but it gets SIGTERM'd as soon as the shell closes.

```sh
# Start in a detached screen session
screen -dmS skilltree bash -c 'cd ~/git/skilltree && node src/server.js > /tmp/server.log 2>&1'

# Verify it's up
sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Other ways that **do not work** and will lose the server:
- `node src/server.js &` — dies when shell closes
- `nohup node src/server.js &` — dies when shell closes
- `pm2` — not installed on this machine

### Server Management

```sh
# Check if server is running
pgrep -f "node src/server" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/

# View server logs
cat /tmp/server.log

# Stop the server
screen -S skilltree -X quit

# Reattach to server (for debugging)
screen -r skilltree
```

## Helmet CSP Configuration

The app uses Helmet 8.x for security headers. The Content Security Policy (CSP)
must allow external CDN scripts and inline event handlers, otherwise the frontend
is completely broken (no clicks, no dropdowns, no modals).

**Root cause of "nothing clickable" bugs:** Helmet's default CSP sets
`script-src 'self'` (blocks CDN scripts) and `script-src-attr 'none'`
(blocks all `onclick` attributes). This silently kills all frontend
interactivity.

If you add new CDN origins, update the CSP in `src/app.js`:

```js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            scriptSrc: ["'self'", "'unsafe-inline'",
                "https://code.jquery.com",
                "https://cdnjs.cloudflare.com",
                "https://stackpath.bootstrapcdn.com",
                "https://d3js.org"],
            scriptSrcAttr: ["'unsafe-inline'"],
            // ... other directives
        }
    }
}));
```

**Important:** `script-src-attr: ["'unsafe-inline'"]` is required because the
frontend uses inline `onclick` attributes extensively. Removing it will break
all click handlers.

## Frontend Debugging

If clicks don't work, check these in order:

1. **Browser console** — look for CSP violations (red `Refused to load` messages)
2. **Check `data-toggle` attributes** — duplicate `data-toggle` on one element
   causes the browser to use only the last one. Use `data-target` instead of
   `href` for collapse toggles.
3. **Check `.hide-on-click` class** — elements with this class auto-collapse on
   body clicks via the `hideCardsAndAlerts` handler. Don't put it on the navbar.
4. **Check PIXI canvas** — `#pixiCanvas` is `position: fixed; z-index: 10`.
   Must have `pointer-events: none` or it blocks all clicks below it.

## Running Tests

```sh
npm test                    # run all tests (jest --coverage)
npx jest --watch            # watch mode
```
