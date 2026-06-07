Generate circular favicons from the provided logo

Steps (run from the `frontend` folder):

1. Install dependencies:

```bash
npm install sharp png-to-ico
```

2. Run the generator script:

```bash
node scripts/generate-favicons.js
```

What it does:
- Reads `public/images/60849bd0-ed72-47d7-a44d-68128c104534.png` (replace if your source filename differs)
- Crops / centers and masks to a clean circle
- Outputs:
  - `public/favicon-16.png`
  - `public/favicon-32.png`
  - `public/favicon-64.png`
  - `public/apple-touch-icon.png` (180x180)
  - `public/favicon.ico`

Notes:
- The generated icons are optimized PNGs and a multi-resolution ICO for broad browser support.
- Commit the generated files in `public/` so they are served by the static site.
- You can adjust the source file path in `scripts/generate-favicons.js` if needed.
