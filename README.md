# Milestone Dashboard

A static dashboard visualizing graduate student milestone progress (QE, proposal defense, thesis defense, English requirement, publications, and risk status).

It's split into two pages:

- **`index.html`** — upload page. Choose or drag & drop a Milestone Database CSV export; it's parsed in the browser and stored in `sessionStorage`.
- **`dashboard.html`** — dashboard page. Reads the parsed data and renders stat cards, charts, and a sortable/filterable table. Redirects back to the upload page if no data is present (e.g. visited directly, or after clicking "Upload a different CSV").

## Run locally

Just open `index.html` in a browser, or serve the folder (recommended, since `sessionStorage` and navigation work more reliably over `http://`):

```
npx serve .
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at https://vercel.com/new
3. No build step needed — it's a static site (Output Directory: `.`)

## Data

Data is loaded entirely client-side from the CSV file you upload — nothing is sent to a server. Expected columns: `IDs, Students, Year, Student status, Advisors, QE status, Proposal defense status, Thesis defense status, Thesis submission, English requirement, EC approval, Publications, Risk status`.
