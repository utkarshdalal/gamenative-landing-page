# GameNative Website

A modern Next.js website for GameNative - play your Steam library natively on Android.

## Deployment to GitHub Pages

### Option 1: Automatic Deployment (Recommended)

1. Push this code to your GitHub repository
2. Go to your repository settings → Pages
3. Set source to "GitHub Actions"
4. Update `next.config.mjs` and replace `your-repo-name` with your actual repository name
5. Push changes - the site will automatically deploy via GitHub Actions

### Option 2: Manual Deployment

1. Update `next.config.mjs` and replace `your-repo-name` with your actual repository name
2. Run the build command:
   \`\`\`bash
   npm run build
   \`\`\`
3. The static files will be generated in the `out` folder
4. Upload the contents of the `out` folder to your GitHub Pages repository

### Local Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the site locally.

## Features

- Modern responsive design
- Downloads page with dynamic driver listing
- Static export compatible with GitHub Pages
- Automatic deployment via GitHub Actions
