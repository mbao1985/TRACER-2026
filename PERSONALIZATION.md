# TRACER-2026 Personal Dashboard

## Visual changes

### Refined medicine artwork

The borrowed cover was edited using the built-in image-generation tool and saved as `public/images/dashboard-medicines-refined.png`. The original remains unchanged. The executive and ZAMMSA covers now use the refined image.

Art direction: a panoramic, realistic pharmacy scene with clear amber vials, white bottles, medicine cartons and silver blister strips; soft daylight; quiet deep-green space for the dashboard heading; and a thin green/gold/red/black worktop trim. Decorative dots and large digital ribbons were removed. No medicine brands, clinical claims or labels were added.

Generation prompt: "Improve the supplied pharmacy medicine cover into a refined photographic dashboard asset, preserving its medicine supply-chain theme and Zambia green/gold/red/black identity. Use a panoramic composition with clear space on the left for separately rendered white text, sharply detailed medicines on the right, realistic materials, soft daylight and restrained physical colour trim. Avoid text, logos, watermarks, oversized scattered pills, decorative dots and excessive haze."

- Adapted the Zambia Guidelines Navigator medicine-cover asset: medicine packs, bottles and blister strips, with a green executive overlay.
- Used NSCCU green, gold, red and black accents, alongside restrained blue and amber status colours.
- Replaced the capsule-photo executive banner with National Medicines Executive Intelligence branding.
- Reduced header height and separated the personal theme into `src/mbao-theme.css`.
- Kept Ministry of Health branding, Control Tower identity and Zanga Musakuzi's attribution.
- Made mobile filters a two-column layout with labelled navigation groups and a compact Copilot button.

## All-period filters

Year, month and week each have an All option. Choosing All months selects all reporting weeks in the chosen year; All years selects every available year, month and week. A specific week returns to its actual report snapshot. Reporting months come from the dataset, so 4 October remains September Week 5.

Executive, national, provincial and programme summary figures use the arithmetic mean of available report summaries, with each reporting week weighted equally. Stock quantities are averaged, never added across repeated snapshots. Missing numeric values are omitted, not converted to zero. A scoped reporting unit with no submitted rows in a week does not add a zero-availability observation.

Reporting completeness, facility counts, facility-level stock details, commodity detail, alerts, data quality, forecasts, redistribution and facility CSV exports use the latest actual report in the selected range. Their basis is labelled in the interface. Period-average stock is not a current stock position and must not be used to authorise a transfer. Existing Generate Report, ZAMMSA, vaccine, reporting-rate and comparison workspaces keep their specialist date controls.

The range banner identifies the number of reports and the first/last reporting dates. Single-week defaults and source data are unchanged. Historical names and reporting units change across years; they are not counted as additional current facilities.

## Upstream and hosting

These changes belong to `mbao1985/TRACER-2026`, not `PharmZanga/tracer`. No changes to authentication, API keys, databases, hosting configuration or upstream publication rules are required.

Keep the separate `render-mbao.yaml` Blueprint when deploying. Continue to use GitHub's **Sync fork > Update branch**, not **Discard commits**, to retain personal changes. Review conflicts in `src/App.jsx` when upstream filter or layout code changes; the personal stylesheet and averaging helper are separate files to reduce conflict size.

## Verification

### Approved analytical workspace

The executive overview now has four headline indicators, a two-column six-panel chart grid, a medicine/province heatmap, a priority-medicine workspace and follow-up links. The original facility-level chart remains available in the other modules. Province overview bars show the five strongest available results; stock-status bars show the five lowest-availability provinces, and completeness bars show the five lowest DHO reporting rates. Drill-through links reach the complete workspaces. Province bars also filter the overview.

Availability and MOS use separate scales. No illustrative mockup figures, invented targets or invented chart observations were carried into the working dashboard. Trend lines use up to the last 12 loaded reporting periods within the selected range, stopping at the selected snapshot. Missing observations are not connected across the gap.

The reporting coverage indicator explicitly measures complete **DHO district** submissions under the existing Health Centre/Health Post rule. It is not facility-report coverage: the number of submitted reporting units and the number of complete districts have different denominators. Current overview figures are 397 submitted units and 114/116 complete DHO districts (98.3%).

Medicine tables and the heatmap use latest-report observations cleared by the existing data-quality gate. The excluded-record count and a link to the gate are displayed. Risk badges identify reporting-unit observations with stockouts or low stock; they do not imply all national stock of that medicine is zero. Detailed statuses reuse `analyseTracerCommodity`. SOH and AMC totals remain missing if any included value is missing, and calculated MOS is not produced from incomplete totals. Availability excludes unknown quantities; CSV export preserves missing numeric fields. Changes are percentage points versus the preceding loaded report and may reflect changes in the reporting footprint.

The priority table has name/programme search, programme filtering, sortable columns, column visibility, compact/comfortable density, a frozen medicine column, sticky headers, expandable paginated source records, row pagination and filtered CSV export. Existing module tables receive the shared header, spacing and numeric typography treatment without replacing their existing behaviour.

The theme selector offers Zambia Executive (default), Clinical Light and Control Room Dark. The choice is saved locally in the browser, never in authentication or source datasets. Status colours stay consistent across themes. The independent `src/analytical-workspace.css` contains these additions.

- Added focused tests for reporting-month selection, All ranges, arithmetic averages, missing MOS, source-data preservation and empty selections.
- Checked desktop (1440 px) and mobile (390 px) rendering, all three All controls, single-year restoration and application errors.
- Ran the full existing test suite, data audit, tracer-publication verification and production build.

Local preview is separate from the live Render deployment. No remote push or live deployment is performed by creating this preview.
