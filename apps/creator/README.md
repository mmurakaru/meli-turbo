This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies and build the project:

```bash
brew install gsed && pnpm install && pnpm build
```

This will create an `/out` directory that can you can add to Chrome as an extension. The `manifest.json` links `pages/index.js` to the generated `index.html`. On top of that, the `/public/content.js` script is configured to run on any host url.

Second, run the development server for the Browser UI (or Chrome Extension Context):

```bash
pnpm dev:extension
```

or, run the development server for the Content Area (or Web Page Viewport):

```bash
pnpm dev:web
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

**🚩 Note**: [`gsed`](https://formulae.brew.sh/formula/gnu-sed#default) is used during `build` and `development` steps to bundle the project in a Chrome extension. Therefore, you will need to have this CLI installed on your development machine.

```bash
brew install gsed // homebrew installation
```

## Add extension to chrome

Open the Extension Management page by navigating to `chrome://extensions`. Enable Developer Mode by clicking the toggle switch next to Developer mode. Click the Load unpacked button and select the `/out` directory.

<p align="center">
<img src="/images/add-extension-to-chrome.png" alt="Screenshot of chrome://extensions page" width="616">
</p>

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
