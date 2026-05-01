# Frontend QA checklist (manual)

Use this list before demos or submission. Record browser + date beside each major row.

## Cross-browser smoke

| Browser | Align page loads | DP canvas / charts render | Notes |
| ------- | ---------------- | --------------------------- | ----- |
| Chrome  | ☐ | ☐ | |
| Firefox | ☐ | ☐ | |
| Safari  | ☐ | ☐ | |

Look for console errors, broken fonts, or layout collapse on navigation (`/`, `/align`, `/algorithms`, `/benchmark`, `/history`, `/about`).

## Responsive breakpoints

| Width | Layout usable | Inputs + results reachable | Notes |
| ----- | ------------- | --------------------------- | ----- |
| ~375px (phone) | ☐ | ☐ | |
| ~768px (tablet) | ☐ | ☐ | |
| ~1440px (desktop) | ☐ | ☐ | |

Check navbar collapse, stacked panels on `/align`, chart readability on `/benchmark`.

## DP matrix visualiser

| Case | Expected | Pass |
| ---- | -------- | ---- |
| Short DNA pair (~10×10 effective grid) | Values + traceback visible | ☐ |
| Medium (~50×50) | Scroll/zoom still usable; performance acceptable | ☐ |
| Large (~200×200 or policy limit) | Colour mode / warning banner per product behaviour | ☐ |

## Step-through mode

For **NW**, **SW**, **Hirschberg** (tree/matrix per UI), **Gotoh** (matrix tabs):

- ☐ Play completes without freezing  
- ☐ Step forward/backward stays consistent with score  
- ☐ Pause/resume reliable  

## Sequence validation latency

- ☐ Paste invalid characters (e.g. `Z` in DNA mode): warning appears **within ~200ms** after edit settles (no long stall).

## Optional captures for report

Screenshots with viewport annotation: align result + DP view at each breakpoint; benchmark charts after live run.
