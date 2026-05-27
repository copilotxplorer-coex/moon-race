# Moon Race v8 PATCH — Buy Me Coffee ☕

## Files included:
1. `index.html` → Replace `public/index.html`
2. `coffee.css` → APPEND to end of `public/css/style.css`  
3. `coffee.js`  → APPEND to end of `public/js/game.js`

## Quick apply (from your moon-race folder):

### Option A: Copy files manually
1. Replace `public/index.html` with the new one
2. Append `coffee.css` content to end of `public/css/style.css`
3. Append `coffee.js` content to end of `public/js/game.js`

### Option B: Use these commands (PowerShell):
```powershell
# From moon-race folder after extracting patch zip:
copy patch\index.html public\index.html
type patch\coffee.css >> public\css\style.css
type patch\coffee.js >> public\js\game.js
```

### Option C: Alternative — use coffee.css and coffee.js as separate files
Add these lines to your `index.html` <head>:
```html
<link rel="stylesheet" href="/css/coffee.css"/>
```
And before </body>:
```html
<script src="/js/coffee.js"></script>
```

## Wallet Address:
`0x0e691972cFE35CE4ed87ad6a715bbdA64BaC7D64`

## Then push:
```bash
git add .
git commit -m "☕ v8: Buy me a coffee button"
git push
```
