# Fixing Tailwind CSS Unknown at Rule Error

If you're still seeing the "Unknown at rule @tailwindcss(unknownAtRules)" error in VS Code, follow these additional steps:

## Step 1: Install Required VS Code Extensions

1. Install the "Tailwind CSS IntelliSense" extension
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Tailwind CSS IntelliSense"
   - Install the extension by Brad Cornes

2. Install the "PostCSS Language Support" extension
   - Search for "PostCSS Language Support" in the Extensions marketplace
   - Install the extension by csstools

## Step 2: Restart VS Code

After installing the extensions, completely close VS Code and reopen it.

## Step 3: Alternative CSS Syntax

If you're still seeing the error, try changing the Tailwind directives in your globals.css file:

```css
/* Use import statements instead of directives */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
```

## Step 4: Check for Conflicting Files

Make sure you don't have multiple versions of:
- postcss.config.js and postcss.config.mjs
- tailwind.config.js and tailwind.config.ts

Standardize on the .js versions.

## Step 5: Delete the .next folder and node_modules

If all else fails, try:

```bash
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

This will rebuild everything from scratch.
