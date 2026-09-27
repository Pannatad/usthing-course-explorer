# HKUST Course Explorer

A local-data React Native/Expo app for the [USThing App Team technical test](https://simplistic-plough-ea3.notion.site/App-Team-2026-27-Fall-Technical-Test-Guideline-3dfcd8c4d00080d48650c130cc5f328d). Browse Clear Water Bay courses, filter by semester and department, search course code or title, read details, and follow prerequisites recursively.

The later test update removes all section-specific information. This app does not display section quota, enrolment, availability, or waiting lists.

## Run

Use Node.js 22.13 or newer. In this repository:

```bash
npm ci
npm run web
```

For an iOS Simulator after installing a compatible Xcode and simulator runtime:

```bash
npm run ios
```

The project uses Expo Router and Expo SDK 57. A development server URL appears in Terminal. Edit a screen, save it, and Expo refreshes the preview. The browser is useful for fast feedback, but native validation still requires a simulator or device.

## Verify and regenerate data

```bash
npm run prepare:data
npm test
npx tsc --noEmit
npx expo lint
npx expo export --platform ios
npx expo export --platform web
```

`prepare:data` reads the checked-in source and overwrites the generated files. The generated files are included, so regeneration is optional for a normal run. They should never be edited by hand.

## What is where

| Path | Responsibility |
| --- | --- |
| `src/app/_layout.tsx` | One stack navigator with home and course detail routes. |
| `src/app/index.tsx` | Catalogue, local filter state, search box, result count, and `FlatList`. |
| `src/app/course/[termCode]/[courseCode].tsx` | Details for the record named by route parameters. |
| `src/components/` | Reusable course row, option picker, and prerequisite explorer. |
| `src/data/catalog.ts` | Loads each prepared term once and indexes it by course code. |
| `src/data/search.ts` | Pure department and code/title filtering. |
| `src/data/prerequisites.ts` | Extracts course-code links, resolves semesters, and tracks a traversal path. |
| `scripts/prepare-courses.mjs` | Converts the original JSON into four compact term files and a manifest. |
| `docs/learning-notes.md` | Phase-by-phase explanations and interview checks. |

## Data and identity

The source is `data/source/courses.json` from the [optional USThing starter repository](https://github.com/USThing/AppTechTest2627Fall) at commit `a37d444069d15fcb6e6631473f55c8bf3a9d3458` (SHA-256 `c0e342da1c1674c93ad4f466383d2ea99e7732ab2a830e1a7bc17dcb7772a4d1`). It has 15,178 records across four semesters. The app intentionally keeps the 12,427 `MAIN` (Clear Water Bay) records and excludes Guangzhou rows. The original 28.9 MB file is in the repository for reproducibility and is never imported into the app bundle.

The script keeps code, title, department, term, credits, description, prerequisite, corequisite, exclusion, and career type. It writes term files to `src/data/generated/` and a manifest with semester labels, departments, counts, and available terms per course code. The latest supplied term, **2026–27 Fall**, is selected initially.

A course record is identified by **term code + course code**. Source `id` values repeat across terms, but this pair is unique within the selected Clear Water Bay records. For example, `2610:COMP 2011` and `2530:COMP 2011` are different records.

## Behaviour and decisions

- The list uses `FlatList` so the app does not mount every course row at once. It displays code, title, and credits; the detail route shows longer fields.
- Search ignores case and spaces. `comp2011` matches `COMP 2011`. Department filtering and search both apply to the selected semester. A department that does not exist in a newly selected semester resets to All.
- The original prerequisite text remains visible, including `AND`, `OR`, alternatives, and other conditions. The explorer extracts linked course codes but does not claim to interpret those conditions.
- A linked prerequisite uses the viewed semester when present. Otherwise it opens the most recent supplied semester for that code and labels the fallback. If the code is absent, the explorer explains that it is unavailable.
- Each expanded branch tracks its own visited course records. A cycle stops that branch, while the same course can still appear in a different branch. Expansion is user driven, so a deep graph is not rendered all at once.
- Course-code extraction uses prefixes present in the supplied catalogue. This avoids treating phrases such as “from 2022” as course codes. A reference with a prefix absent from the catalogue remains readable in the original text but cannot become a link. The app does not parse shorthand such as “COMP 1023 or 1028” into a second link.
- State lives on the list screen. There is no backend, login, global state library, or network request for catalogue data.

## Validation status

On 2026-09-27, six pure-function tests, TypeScript, Expo lint, web export, and iOS JavaScript bundling passed. Regenerating the data produced no changes. A fresh local clone passed `npm ci`, tests, typecheck, and lint. The browser preview was manually checked for the real Fall list, code search, semester/department controls, empty state, course details, direct/recursive prerequisites, semester fallback, unavailable references, and a missing detail route.

**iOS Simulator interaction has not been tested yet.** This Mac currently has Command Line Tools but no Xcode or `simctl`. Xcode and an iOS Simulator runtime must be installed before claiming native UX verification. The bundle export confirms the JavaScript can be compiled for iOS; it does not replace a simulator run. No measured native scrolling or tap performance claim is made.

## Submission

No Git remote is configured in this local repository yet. Publish it to a repository accessible to reviewers, then submit that URL through the test form. Before submitting, run the verification commands and perform the native simulator flow described above. The large source file and generated files are intentionally committed so a reviewer can reproduce the data preparation and run the app offline.
