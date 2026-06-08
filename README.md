# Milestone Dashboard

A static dashboard visualizing graduate student milestone progress (QE, proposal defense, thesis defense, English requirement, publications, and risk status).

On load, it asks you to upload a Milestone Database CSV export (drag & drop or file picker), parses it in the browser, and then renders the dashboard — stat cards, charts, and a sortable/filterable table.

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

Data is loaded entirely client-side from the CSV file you upload — nothing is sent to a server. Expected columns: `IDs, Students, Year, Student status, Advisors, QE status, Proposal defense status, Thesis defense status, Thesis submission, English requirement, EC approval, Publications, Risk status`.
