# Accessibility audit

Tested October 12, 2026 against the compact, phone-first Text911 interface. Target: WCAG 2.1 AA. This report distinguishes verified checks from unfinished acceptance testing.

## Result

No confirmed WCAG A/AA violations were reported by the final axe-core scans of the tested main screen and dialogs. Keyboard lookup, dialog focus cycling, Escape dismissal and focus restoration were verified. The main screen fits 320×568 and 390×844 phone viewports without page scrolling. Supporting dialogs may scroll internally.

**Full screen-reader acceptance remains incomplete.** Native VoiceOver was enabled for a Safari smoke test and the skip link moved focus to the labelled search field. End-to-end VoiceOver text entry, spoken results, dialog announcements and location errors could not be completed during the native test. Do not interpret the automated audit or accessibility-tree inspection as a completed screen-reader acceptance test or formal WCAG certification.

## Automated checks

Tool: axe-core 4.10.2, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`. The local preview injects the audit instrumentation only for `?qa=audit`; it is excluded from production.

| Tested surface | Viewport | Confirmed violations |
| --- | --- | --- |
| Main screen | 320×568 | 0 |
| Main screen | 390×844 | 0 |
| Main screen | 1280×900 | 0 |
| County search dialog | 390×844 | 0 |
| County details dialog | 390×844 | 0 |
| County list and filters | 390×844 | 0 |
| Guidance / sources dialog | 390×844 | 0 |

The raw `axe-*-*.json` files record tested states and timestamps. Initial contrast defects in the earlier, text-heavy layout were corrected. The final legend has an explicit group role. Non-text symbols and SVG labels produced some “incomplete” contrast checks, rather than passing automatically.

Manual review of those checks: icon controls use dark green on pale backgrounds or white on dark green; SVG labels use `#425944` at full opacity; dialog prose uses `#173b33` on `#f9faf4`. These exceed the required text contrast. Decorative symbols have accessible control names. The county map has named status text and an equivalent searchable county list, so service information does not depend solely on color or pointer interaction.

## Interaction checks

- The search field has an explicit accessible label. Arrow and pin buttons have descriptive names.
- County search and Enter submission work with keyboard input.
- Native modal dialogs expose labelled headings. Tab wraps from the last interactive control to the first; Escape closes the dialog and returns focus to its trigger.
- Selecting a county moves focus to its result heading and updates a polite, atomic status region.
- The list offers the same counties and statuses as map selection, including areas too small to use reliably on a phone and U.S. territories outside the visual map projection.
- Controls have visible focus outlines; reduced-motion and forced-color styles are provided.
- County, ZIP and address candidates remain explicit. Address matches require confirmation.
- Location success, permission denial and outside-U.S. results were tested with controlled public coordinates. The success path showed a pin and reported device accuracy in Details. Hardware GPS accuracy and an actual phone browser's permission prompt were not tested.
- Registry loading and API failures do not create a supported or unavailable classification.

## Acceptance checks still required

Before representing the app as fully screen-reader tested, run this flow in Safari with VoiceOver and at least one actual phone screen reader (VoiceOver on iOS or TalkBack on Android):

1. Reach Search through the skip link or rotor. Confirm the label is spoken.
2. Search `King County WA`, select the candidate and hear the county, Supported status and coverage caveat.
3. Open Details, expand the FCC entries, then close with Escape or the accessible close button. Verify focus returns.
4. Search `Morrow County OH` and `Catron County NM`. Confirm Unknown and Not listed are spoken distinctly.
5. Open List, filter by state and status, and choose a county without using the map.
6. Activate 📍, exercise allowed and denied permission, and verify the error or location status is announced.
7. Check enlarged text, the phone keyboard, screen-reader gestures and dialogs on a physical device.

No emergency calls or texts were placed for verification. The app shows registry evidence and cannot verify live emergency message routing or delivery.
