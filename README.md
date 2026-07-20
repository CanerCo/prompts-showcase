# Prompt Showcase — GitHub Pages starter

A dependency-free prompt catalog for GitHub Pages. It includes search, category filters, sorting, copy buttons, responsive styling, and JSON-based content management.

## 1. Customize

Replace these placeholders in `index.html`:

- `Your Project Name`
- `YOUR_USERNAME`
- `YOUR_REPOSITORY`

Edit `prompts.json` to add your own prompts. Keep the JSON valid and do not leave a trailing comma after the last item.

Each prompt supports:

```json
{
  "id": "unique-url-friendly-id",
  "title": "Prompt title",
  "description": "What it does",
  "category": "Planning",
  "model": "GPT-5",
  "version": "v1.0",
  "date": "2026-07-20",
  "featured": true,
  "tags": ["tag-one", "tag-two"],
  "prompt": "Your full prompt text",
  "lesson": "A useful result, limitation, or lesson learned."
}
```

## 2. Publish as your main GitHub site

1. Create a repository named exactly `YOUR_USERNAME.github.io`.
2. Add these files to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. Visit `https://YOUR_USERNAME.github.io`.

## 3. Publish as a project site

1. Create any repository, for example `prompt-showcase`.
2. Add these files to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, then `main` and `/ (root)`.
5. Visit `https://YOUR_USERNAME.github.io/prompt-showcase/`.

All asset links are relative, so the starter works at either URL.

## Local preview

Because `prompts.json` is loaded with `fetch`, opening `index.html` directly may be blocked by browser security rules. Start a local server instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Good publishing practice

Before making a prompt public, remove secrets, credentials, personal data, customer information, private system instructions, proprietary examples, and internal URLs. Consider publishing redacted or representative versions when the exact production prompt is sensitive.
