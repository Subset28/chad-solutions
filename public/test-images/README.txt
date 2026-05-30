Drop benchmark images in `PSL Examples (TESTING)` and run `npm run sync:test-images`.

The sync script copies them into this folder for the static app and rebuilds `index.json`.

Example index entry:
{ "fileName": "sample-1.jpg", "label": "Front", "note": "Good lighting", "expectedPsl": 5.2 }

The Bench tab in the app will load and display the gallery from this folder.
