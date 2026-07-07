# Griha

Griha is a static HTML, CSS, and JavaScript prototype for a household financial operating system.

This repository also contains **Report Studio** (`report-studio/`), a separate standalone on-device report-builder tool. It is independent of the Griha app — see [`report-studio/README.md`](report-studio/README.md).

## Run locally

From the repository root:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

The local server uses Python's built-in HTTP server, so make sure `python3` is installed.

## Build/check static files

```bash
npm run build
```

This creates a `dist/` folder with `index.html`, `src/main.js`, and `src/styles.css`.

## Publish on GitHub Pages

You do **not** need a verified domain to publish this app with GitHub Pages.

Use GitHub's default Pages URL unless you specifically bought and configured a custom domain:

```text
https://YOUR_GITHUB_USERNAME.github.io/Project-Griha/
```

### Enable Pages without a custom domain

1. Push this repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings** → **Pages**.
4. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**.
6. Wait for GitHub Pages to finish deploying, then open the Pages URL on desktop or mobile.

### About the "There are no verified domains" message

That message appears in the **Custom domain** area of GitHub Pages settings. It is not an error for this project.

- If you are using the free GitHub Pages URL, ignore it and leave **Custom domain** empty.
- If you want your own domain, first add and verify the domain in your GitHub account settings, then return to the repository Pages settings and enter that domain.

## Why asset paths are relative

`index.html` uses relative paths for CSS and JavaScript:

```html
<link rel="stylesheet" href="./src/styles.css" />
<script type="module" src="./src/main.js"></script>
```

Relative paths allow the app to work when GitHub Pages serves it from a project path such as `/Project-Griha/`.
