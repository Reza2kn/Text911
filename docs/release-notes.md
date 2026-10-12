# Text911 v0.1.0 — Public preview

Text911 turns the official FCC Text-to-911 readiness registry into a phone-first county map and lookup.

- [Open the app](https://reza2kn-text911.hf.space)
- [Hugging Face Space](https://huggingface.co/spaces/Reza2kn/Text911)
- [Source repository](https://github.com/Reza2kn/Text911)

This release includes address, ZIP and county search; a permission-based device-location button; Supported, Not listed and Unknown states; an equivalent county list; source rows and dates; a safe FCC refresh script; Docker hosting; and documentation for a short presentation.

FCC snapshot: **September 15, 2026**. Data: **3,653 registry rows, 3,235 county equivalents, 33,791 Census ZIP areas**.

Validation: **15 automated tests passed**, **10 county/equivalent checks passed**, and tested accessibility scans found **no confirmed A/AA violations**. The public Space was verified as Running on CPU Basic hardware. Health, registry and report endpoints returned HTTP 200. Live address and coordinate lookups returned the expected counties for public demonstration inputs. An outside-U.S. coordinate lookup returned no county. The app was also tested inside the Hugging Face iframe.

The release archive contains the same source as this versioned GitHub tag. `npm ci && npm run verify` reproduces the build, tests and county checks. `Dockerfile` serves the production app on port 7860.

**Full screen-reader acceptance and physical-phone testing remain incomplete.** See [the audit](https://github.com/Reza2kn/Text911/blob/main/reports/accessibility.md) for the exact verification scope. Registry readiness is not proof of live delivery or countywide coverage. Registration is voluntary; Not listed does not mean unavailable. The app cannot contact emergency services.

Call if you can, text if you can't.
