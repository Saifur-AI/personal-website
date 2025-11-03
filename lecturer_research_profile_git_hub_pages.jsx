# Lecturer Research Profile — GitHub Pages

This repository is a complete starter for a lecturer / researcher profile website that automatically fetches publications from Google Scholar and publishes them to GitHub Pages. It uses a React single-file app (build outputs static files) and a Python updater that runs on GitHub Actions to refresh `publications.json` on a schedule.

---

## Files included (single-file view for easy copy)

### package.json

```json
{
  "name": "lecturer-profile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "vite": "5.0.0"
  }
}
```

### public/index.html

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lecturer — Research Profile</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### src/main.jsx

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

### src/App.jsx

```jsx
import React, { useEffect, useState } from 'react'

export default function App(){
  const [pubs, setPubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/publications.json')
      .then(r=>r.json())
      .then(data=>{ setPubs(data); setLoading(false) })
      .catch(()=>{ setPubs([]); setLoading(false) })
  },[])

  return (
    <div className="container">
      <header className="hero">
        <img className="avatar" src="/avatar.jpg" alt="avatar" />
        <div>
          <h1>Dr. Firstname Lastname</h1>
          <p>Lecturer, Department • University</p>
          <p><a href="https://scholar.google.com/citations?user=YOUR_ID">Google Scholar</a> • <a href="#publications">Publications</a></p>
        </div>
      </header>

      <section id="about">
        <h2>About</h2>
        <p>Short bio. Research interests: machine learning, human-centred AI, etc.</p>
      </section>

      <section id="publications">
        <h2>Publications</h2>
        {loading ? <p>Loading publications...</p> : (
          pubs.length === 0 ? <p>No publications found.</p> : (
            <ol>
              {pubs.map((p, i)=> (
                <li key={i}>
                  <a href={p.url || '#'} target="_blank" rel="noreferrer">{p.title}</a>
                  <div className="meta">{p.authors} — <em>{p.venue}</em> ({p.year})</div>
                </li>
              ))}
            </ol>
          )
        )}
      </section>

      <footer>
        <p>Contact: <a href="mailto:you@university.edu">you@university.edu</a></p>
      </footer>
    </div>
  )
}
```

### src/styles.css

```css
:root{ --max:900px }
body{ font-family: Inter, system-ui, Arial; margin:24px; color:#111 }
.container{ max-width: var(--max); margin:0 auto }
.hero{ display:flex; gap:18px; align-items:center }
.avatar{ width:96px; height:96px; border-radius:50% }
h1{ margin:0 }
section{ margin-top:24px }
.meta{ color:#444; font-size:0.9rem }
ol{ padding-left:18px }
footer{ margin-top:36px; color:#666 }
```

### public/publications.json (initial stub)

```json
[]
```

---

## Updater script: scripts/fetch_scholar.py

This Python script uses the `scholarly` package to fetch a Google Scholar profile's publications and write a `publications.json` file.

```python
# scripts/fetch_scholar.py
import json
from scholarly import scholarly

# Replace with your Google Scholar user id (the long id from the profile URL)
SCHOLAR_USER_ID = "YOUR_ID"

output = []

try:
    profile = scholarly.search_author_id(SCHOLAR_USER_ID)
    author = scholarly.fill(profile, sections=["publications"])
    for pub in author.get('publications', []):
        p_filled = scholarly.fill(pub)
        item = {
            'title': p_filled.get('bib', {}).get('title'),
            'authors': p_filled.get('bib', {}).get('author'),
            'venue': p_filled.get('bib', {}).get('venue'),
            'year': p_filled.get('bib', {}).get('pub_year') or p_filled.get('bib', {}).get('year'),
            'url': p_filled.get('eprint_url') or p_filled.get('bib', {}).get('url')
        }
        output.append(item)
except Exception as e:
    print('Error fetching:', e)

with open('publications.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print('Wrote', len(output), 'publications')
```

Notes:
- Install: `pip install scholarly` in the runner.
- The `scholarly` library scrapes Google Scholar. It can be brittle and may require retries or proxying if you are blocked. See alternative options below.

---

## GitHub Actions workflow to run updater and push changes

Create `.github/workflows/update-publications.yml` with the following content:

```yaml
name: Update Publications

on:
  schedule:
    - cron: '0 6 * * 1' # weekly on Monday 06:00 UTC
  workflow_dispatch: {}

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install requirements
        run: |
          python -m pip install --upgrade pip
          pip install scholarly
      - name: Run fetch script
        run: |
          cd scripts
          python fetch_scholar.py
          mv ../publications.json ../public
      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/publications.json
          git commit -m "Update publications.json from Google Scholar" || echo "No changes"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Security note: The workflow uses the default `GITHUB_TOKEN` for commits. The scraping approach may fail if Google blocks requests. For a more robust solution use SerpAPI with an API key. If you wish to use SerpAPI, replace the Python script with a SerpAPI-based fetch and store the API key in `secrets.SERPAPI_KEY`.

---

## Deployment to GitHub Pages

1. Commit the repository to a new GitHub repo.
2. Go to the repository Settings > Pages and set the source to the `gh-pages` branch or the `main` branch's `/docs` folder. Alternatively, build the site with `npm run build` and use the `JamesIves/github-pages-deploy-action` to push the `dist` folder to `gh-pages` branch.

Optional: Add a GitHub Action that runs `npm run build` and deploys to `gh-pages` automatically after the publications update job.

---

## Alternatives and recommendations

1. ORCID or Crossref: If you have an ORCID iD or DOIs for your works, fetch them from ORCID or Crossref. These are more reliable and have APIs. Consider using ORCID as the primary source for publications and Google Scholar as a supplement.

2. SerpAPI: paid but stable Google Scholar scraping API. Works well in CI.

3. Manual fallback: allow a simple admin JSON file in the repo to manually list publications when automation fails.

---

## What you should do next

1. Replace `YOUR_ID` in `scripts/fetch_scholar.py` with your Google Scholar user id.
2. Add an `avatar.jpg` to `public/`.
3. Push to GitHub and enable Actions.
4. Optionally adapt the CSS and copy to match your branding.

---

If you want, I can also generate:
- A ready GitHub Actions deploy job that runs the build and uses `peaceiris/actions-gh-pages` to publish the site.
- A SerpAPI-based fetch script and the workflow changes needed, if you provide an API key.
- A version that uses ORCID instead of Google Scholar.



