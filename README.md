This repository contains a static site. If GitHub Pages shows a "The site configured at this address does not contain the requested file" error, follow the steps below:

1. Ensure there is an `index.html` at the repository root
   - GitHub Pages serves `index.html` for root URLs (e.g., `https://<user>.github.io/<repo>/`).
   - Filenames are case-sensitive on GitHub Pages — `Index.html` != `index.html`.

2. Branch / folder settings
   - In the repository Settings → Pages, set the Source to the branch and folder you want (commonly `main` / `/ (root)`).
   - After changing, wait a minute and refresh the site.

3. If you use Jekyll and want static files only
   - Add an empty file named `.nojekyll` to the root to prevent Jekyll processing.

4. Testing locally (Windows cmd.exe)
   - If you have Python installed, run:

```cmd
python -m http.server 8000
```

   - Then open `http://localhost:8000/` in a browser. This serves files from the repo root.

5. Quick fixes you can apply now
   - Make sure `index.html` exists in the repository root. This repo now includes a simple `index.html` that redirects to `birthday_puzzle.html`.
   - Commit and push the new files to the branch used by Pages (for example `main`).

6. If you still see the 404 message
   - Double-check the Pages source branch and folder in Settings.
   - Verify the pushed commit is on the branch configured for Pages.
   - Confirm file name casing matches the links/URLs.

If you'd like, I can:
- Make the redirect point to a different file (tell me which), or
- Create a nicer landing page instead of a redirect, or
- Add a `.nojekyll` file and a quick deployment checklist for GitHub Actions.

