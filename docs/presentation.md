# A two-minute Text911 walkthrough

Open **https://reza2kn-text911.hf.space** directly on a phone or in a narrow browser window. A direct window gives the app the full screen and avoids restrictions an embedding page may place on location permission.

## Opening

“Texting 911 can help people who are Deaf, cannot speak or cannot safely be heard. Availability depends on the 911 center their message reaches. Text911 turns the FCC readiness spreadsheet into a county map and lookup.”

## Demonstration

1. Search **King County WA** and select the county. Show the short Supported result, then open Details and expand the FCC entries. The source date, methods and workbook rows are visible.
2. Search **Morrow County OH**. It remains Unknown in the September 15, 2026 snapshot because its carrier compliance deadline is in March 2027.
3. Search **Catron County NM**. Not listed means no matching entry was found. The registry is voluntary, so this does not prove that texting is unavailable.
4. Press **📍** if you want to demonstrate device location. The browser asks for permission. The app finds a county and shows a pin; Details includes the device's reported accuracy. Address and ZIP search remain available when permission is denied.
5. Open **Info** to show the FCC and Census sources, the accessibility audit and the ten county checks. Open **List** to demonstrate browsing without relying on the map.

## Evidence and limits

The snapshot has **3,653 FCC rows**, **3,235 county equivalents** and **33,791 Census ZIP areas**. Ten counties/equivalents were checked independently against workbook XML. Automated tests cover classification, search, input validation, failed geocoding and the production server. Automated accessibility scans found no confirmed A/AA violations in the tested views.

Full screen-reader acceptance and physical-phone testing remain unfinished. Present the project as a public preview with documented evidence, rather than claiming complete WCAG conformance.

Readiness listings do not establish countywide coverage, live carrier routing or emergency message delivery. The app cannot contact emergency services. The guidance stays visible: **call if you can, text if you can't**.

## Closing

“The main screen is deliberately small: map, search and location. The supporting evidence is one tap away. The source and refresh script are public so anyone can inspect how the result was derived.”
