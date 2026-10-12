# Data and attribution

The MIT license covers the application source code and project-authored documentation. Official source files are separately attributed here and retain their original source terms.

| Source | Snapshot | Use |
| --- | --- | --- |
| [FCC Text-to-911 Readiness and Certification Registry](https://www.fcc.gov/general/psap-text-911-readiness-and-certification-form) | September 15, 2026 | Readiness requests, text methods, county names and carrier compliance deadlines |
| [U.S. Census TIGERweb county equivalents](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1) | January 2026 vintage; retrieved October 12, 2026 | Map boundaries and FIPS identifiers |
| [U.S. Census ZCTA/county relationship file](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt) | 2020 | ZIP-area intersections with counties |
| [U.S. Census geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) | Current benchmark and geography vintage at request time | Address matching and coordinate-to-county lookup |

The original FCC workbook is retained in `data/source/fcc-registry.xlsx`. Its SHA-256 is recorded in the snapshot and county verification report. Public PSAP contact information appears in the source workbook; the app does not expose those contact numbers as alternatives to 911.

Geographic boundaries and registry readiness listings do not establish live 911 routing, carrier coverage or message delivery. This independent project is not affiliated with the FCC, Census Bureau or any emergency service.
