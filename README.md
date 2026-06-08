# Milestone Dashboard

A static dashboard visualizing graduate student milestone progress (QE, proposal defense, thesis defense, English requirement, publications, and risk status).

## Run locally

Just open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at https://vercel.com/new
3. No build step needed — it's a static site (Output Directory: `.`)

## Data

Student data is embedded in [`data.js`](data.js), generated from the Milestone Database CSV export.
