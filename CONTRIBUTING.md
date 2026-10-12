# Contributing

Run `npm ci` and `npm run verify` before proposing a change. For browser testing, run `npm run dev` and open `http://localhost:4173`. The `?qa=audit` page runs local accessibility checks; those testing routes are excluded from the production server.

Data changes should preserve the source workbook, date, SHA-256 and row references. Review `data/unmatched.json` rather than silently guessing ambiguous county joins. A changed spot-check result requires reviewing the source evidence before updating the expected status.

Keep the main app phone-first and usable without page scrolling at common phone sizes. The list must provide the same county information as the map. Retain accessible names, visible focus, modal focus handling and the distinction between Not listed and Unknown.

Use the local geolocation fixtures when testing. Never place an emergency call or text to test this application. Address and location tests should use public demonstration coordinates and addresses.

Bug reports should include the browser, approximate screen size, steps and registry date. Please avoid including a private street address, precise personal location or emergency details in a public issue.
