# Krystaler
Old Style Website for Krystal

---

Retro 90s Portfolio Template

This repository contains a small, static, retro-style website template you can edit and publish.

What you'll find

- `index.html` — main page (fill in your bio, projects, and links)
- `css/styles.css` — retro 90s styling
- `js/main.js` — small scripts: local visitor counter + guestbook (localStorage)
- `.nojekyll` — ensures GitHub Pages serves files as-is

Previewing locally

Open a terminal in this folder and run a simple HTTP server (Python 3):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Deploying

- GitHub Pages: push this repository to GitHub and enable Pages from the repository settings (use the `main` branch root or `gh-pages` branch). The site will serve `index.html`.

- Cloudflare Pages: create a new project in Cloudflare Pages and connect your repository. Use the default build (no build command) and the repository root as the publish directory. Cloudflare Pages will serve `index.html`.

Customization tips

- Replace the placeholder text in `index.html` with your own content.
- Update colors and fonts in `css/styles.css`.
- Replace the tiny SVG logo at the top of `index.html` with your own GIF or image.
- The guestbook and visitor counter are local-only (stored in the browser via localStorage). For a server-backed guestbook, wire up a simple API and replace the JS functions.

License

This template is free to use and edit. Have fun building your retro site!
