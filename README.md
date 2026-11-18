# SSC Flix

First frontend milestone for the SSC exam-prep portal. The Dashboard uses shared theme tokens and phone, tablet and desktop navigation. The Number Analogy sample gives immediate feedback and saves practice progress by target exam in the current browser.

## Run locally

From this directory, run:

```sh
python -m http.server 4173
```

Open http://localhost:4173. This project uses static HTML, CSS and browser JavaScript modules. There is no package install or build step.

## Next page

Build the Mock Tests catalogue and Activity Details next. Their navigation entries currently describe the sample scope. The data and persistence functions live in `study-store.mjs` so a backend can replace the local adapter later.
