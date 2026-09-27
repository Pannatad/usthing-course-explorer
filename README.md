# HKUST Course Explorer

An offline React Native / Expo app for the [USThing App Team technical test](https://simplistic-plough-ea3.notion.site/App-Team-2026-27-Fall-Technical-Test-Guideline-3dfcd8c4d00080d48650c130cc5f328d). Browse Clear Water Bay courses, filter by semester and department, search code or title, read details, and explore prerequisites recursively.

The blue header and soft blue rows follow the supplied USThing screenshots. [PRODUCT.md](PRODUCT.md) records scope; [DESIGN.md](DESIGN.md) records visual choices. As clarified in the test update, the app excludes section quota, enrolment, availability, and waiting lists.

## Run

Use Node.js 22.13 or newer (verified with 22.22.3):

```bash
npm ci
npm run web
# Or, with a simulator/device available:
npm run ios
npm run android
```

The project uses Expo SDK 57, React Native 0.86, and Expo Router. Generated runtime data is committed: normal startup needs neither Python nor a live catalogue API. Expo Go development requires the Metro server. Standalone offline use must be verified with an installed preview build.

This Mac now has Xcode 26.4.1 and an iOS 26.4 Simulator. For another Mac, install a compatible Xcode and iOS runtime, select its Command Line Tools location, and confirm `xcrun simctl list devices`. See [SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/). Android development requires an emulator or connected device; this machine currently has neither configured.

## Verify and regenerate

```bash
npm run check:data       # Regenerate in a temporary directory; compare names and contents
npm test                # Vitest data tests, then Jest / Expo screen tests
npm run typecheck
npx expo lint
npx expo-doctor
npx expo export --platform all
git diff --check
```

`npm run prepare:data` replaces only `src/data/generated/` after successful generation and validation. Do not edit generated files manually. `test:data` and `test:ui` run the suites independently.

To reproduce the Parquet extraction separately:

```bash
python3 -m venv .venv-data
.venv-data/bin/pip install -r scripts/requirements-data.txt
.venv-data/bin/python scripts/import-hf-catalog.py
npm run prepare:data
npm run check:data
```

Python dependencies are pinned (`pyarrow==21.0.0`). The importer projects only required columns, processes 4,096-row Parquet batches, filters selected terms/campus, and writes incrementally. Downloads replace the cached snapshot only after SHA-256 verification. Both import and preparation use `data/catalog-config.json`.

## Structure

| Path | Responsibility |
| --- | --- |
| `src/app/` | Expo Router catalogue and course detail routes |
| `src/components/` | Course row, search, keyboard-aware picker, prerequisite tree, controlled error screen |
| `src/data/course.ts` | Summary, shared detail, and reconstructed course types |
| `src/data/repository.ts` | Lazy term indexes, search, exact lookup, detail chunk access |
| `src/data/catalog.ts` | Production repository and generated loaders |
| `src/data/prerequisites.ts` | Semester resolution and branch-local cycle tracking |
| `scripts/lib/prerequisite-parser.mjs` | Pure build-time reference scanner |
| `scripts/prepare-courses.mjs` | Version selection, validation, deduplication, artifact generation |
| `tests/` | Data regression tests and small-fixture screen/router tests |
| `docs/validation.md` | Measured results, tested flows, and pending acceptance checks |
| `docs/learning-notes.md` | Implementation explanations and interview exercises |

## Data design

The [UST Archive catalogue](https://huggingface.co/datasets/ust-archive/catalog) is pinned to revision `1ce53f412c5fa9de4ca9169dd82064ded7b7070a`, with Parquet SHA-256 `44e702edd92a3b37fb8f66907f951450fb2ee0d82edd86a7ca6dffe6e7961e34`. The 216,075-row snapshot yields 17,485 source versions in four Clear Water Bay semesters. Newest-version selection and inactive-record removal yield **12,476 course–semester records**. The default semester is 2026–27 Fall; the other semesters are 2025–26 Summer, Spring, and Winter.

A record's identity is **term code + course code**, for example `2610:COMP 2011`. All existing displayed fields are preserved, verified by reconstructing every record against a fixed baseline digest. Identity/status/time fields are validated before version selection; course content is validated after selection. Conflicting newest records with equal timestamps fail with their key. Optional null text becomes empty text; invalid credits fail.

The runtime catalogue separates small summaries from long details:

- Four semester summary files contain code, title, department, credits, detail ID, and prerequisite metadata.
- Identical descriptions, prerequisite wording, corequisites, exclusions, career type, and extracted references share one detail payload. Changed semester-specific text creates a different payload.
- 3,375 payloads are sorted deterministically and stored in **14 chunks of up to 256**. Integer IDs are internal to the snapshot and never appear in routes.
- The manifest stores semester names, departments, counts, provenance hashes, and available semesters per course code. Literal generated `require()` paths work with Metro.
- The quality report records exclusions, duplicate versions, inactive records, unresolved references, and exact artifact sizes. `check:data` also detects stale extra files.

Runtime catalogue JSON fell from **8,905,361 to 4,571,967 bytes (48.7%)**, exceeding the 40% target. This metric includes summaries, details, and manifest; it excludes build-only quality metadata and TypeScript loader code.

Each semester's first access builds a course-code map, department candidates, and normalized searchable strings. Exact lookup is expected O(1); search scans only that department's summaries. List-only browsing never calls detail loaders. The list uses `FlatList`, stable identities, and memoized results, with variable row height for wrapping and larger text.

All chunks still ship with the app. Static `require()` is synchronous, and Metro may retain accessed modules. There is no LRU eviction claim, network chunk download, or claim that only one semester occupies total process memory. The web bundle became smaller, while native Hermes exports became about 2% larger; see the measured table in [validation](docs/validation.md).

## Search, prerequisites, and mobile interactions

Search uppercases and removes whitespace from code/title/query, then applies substring matching. `comp2011` matches `COMP 2011`; title search works too. Semester, department, and query intersect. An unavailable department resets to All when switching semesters. Back through the app stack preserves list state.

Prerequisites retain their original wording as the authority. Generated links recognize known prefixes case-insensitively, unknown uppercase four-letter prefixes (such as `CORE`), and immediate slash/comma/AND/OR shorthand: `LIFS 2040/2210` links both courses. Prose words such as FROM/YEAR and numeric ranges are not expanded. This is a small reference scanner, not eligibility evaluation or a complete natural-language parser.

Expanded trees prefer the root's viewed semester throughout. A missing course uses the newest supplied semester with a visible fallback label, or appears as an unavailable, non-navigable row. Each branch owns its visited set, so cycles stop without hiding shared sibling dependencies. Collapsed nodes use summaries; expanding a node loads its detail chunk. Expansion buttons expose accessibility state.

Catalogue and picker lists retain handled taps while the keyboard is open, dismiss on drag, and explicitly dismiss on selection. The picker uses iOS keyboard avoidance and Android resize, a scrollable option list, a 44-point Close target, and a no-match message. Unknown routes show “Course not found”; corrupt generated data goes to a separate controlled error screen.

## Validation and remaining work

31 automated tests pass, together with data consistency, TypeScript, lint, Expo Doctor, and all-platform exports. Browser flows and focused iOS Expo Go interactions were checked, including single-tap result/picker selection with the software keyboard visible. These checks do not complete standalone, Android, accessibility, or device-performance acceptance. [Validation details and the remaining checklist](docs/validation.md) distinguish each boundary.

`eas.json` supplies internal preview profiles. When EAS access is available:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform ios
npx eas-cli@latest build --profile preview --platform android
```

The iOS profile builds for Simulator; Android produces an APK. EAS currently reports “Not logged in.” Standalone offline and Android checks remain **pending by user decision**. No native projects are checked in or edited manually.

## Submission

The source, generated runtime artifacts, pinned snapshot/extracted JSON, scripts, npm lockfile, Python requirements, and documentation form the local submission package. No Git repository destination or visibility has been chosen, so publication and fresh-remote-clone verification remain pending. Once configured, publish the exact verified commit to a reviewer-accessible repository and submit its URL. Do not claim all-platform acceptance until the pending validation checklist is completed.
