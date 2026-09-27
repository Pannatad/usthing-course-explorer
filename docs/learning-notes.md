# Build and interview notes

We will add one short entry per phase. Each entry records what the app does, why it is built that way, and one thing to explain back in your own words.

## Phase 0 — Expo foundation

### High-level understanding

The app is a tree of React components. Expo starts the development server and runs that tree on web or a native device. Expo Router finds screen files in `src/app/`; `_layout.tsx` wraps them in a navigation stack.

### Intuition and small example

In a Vite app, a page might return `<div><p>Hello</p></div>`. Here, the same idea is `<View><Text>Hello</Text></View>`. `StyleSheet.create` holds the styles for those native elements.

### Why this structure

The test's main journey is catalogue → course detail → prerequisite course detail. A stack naturally models opening a detail screen and going back. Tabs, login, and a global state library would add code without helping that journey.

### Code map

1. `package.json` starts Expo Router.
2. `src/app/_layout.tsx` declares the stack.
3. `src/app/index.tsx` renders the home screen at `/`.

### Your hands-on check

Change the main title in `src/app/index.tsx`, save, and reload the preview if needed. Then explain which file supplies the route and which file supplies the visible text.

## Phase 1 — The list-to-detail journey

### High-level understanding

The list shows short course summaries. Selecting one opens a new detail route; the route parameters identify which record to display. Returning to the list uses stack navigation.

### Intuition and small example

The row for `DEMO 2000` links to `/course/2610/DEMO2000`. The detail screen reads `2610` and `DEMO2000`, finds that course, and renders its description and prerequisite text. The row passes an identity, not a copy of the entire course object.

### Why this structure

`CourseRow` is reusable because the real catalogue will render thousands of records with the same row design. The route file stays focused on display and lookup. The three `DEMO` records are explicitly fictional and will be removed when the supplied dataset is connected.

### Your hands-on check

Tap `DEMO 2000`, use Back, then explain which value came from the URL and which value came from the sample course array.

## Phase 2 — Prepare the supplied data

### High-level understanding

The supplied JSON is source material. A Node script converts it into the smaller, typed shape that the app needs. The phone will use the generated semester files, not parse the 28.9 MB source file.

### Intuition and small example

The source has separate `prefix: "COMP"` and `number: "2011"` fields. We combine them into `code: "COMP 2011"`. The source `id` can repeat in other semesters, so the app identifies a record by `termCode + code`, such as `2610:COMP 2011`.

### Why this structure

The build step removes Guangzhou rows because this explorer focuses on Clear Water Bay. It retains the original file for reproducibility and creates four compact semester files (roughly 2 MB each). The manifest lists semesters, departments, and which semester contains each course code.

### Your hands-on check

Open one row in `data/source/courses.json` and compare it with the corresponding row in `src/data/generated/2610.json`. Identify two source fields that the app keeps and one it drops.

## Phase 3 — Real catalogue and details

### High-level understanding

The home screen loads one semester of prepared courses. A row contains a short summary; its detail route looks up the full record by semester and code.

### Intuition and small example

The default 2026–27 Fall term has 3,170 Clear Water Bay records. Tapping `COMP 2011` opens `/course/2610/COMP2011`; the route asks the catalogue for that exact record. The list stays available when you go back.

### Detailed explanation and choice

`catalog.ts` statically references the four generated JSON files, which Metro can bundle. It indexes a term the first time it is requested. `FlatList` mounts a window of rows instead of thousands of cards. Route files display data; lookup and formatting stay in `src/data/`.

### Your hands-on check

Search for `COMP 2011`, open it, then explain why a list of 3,170 cards is better served by `FlatList` than `courses.map(...)` inside a `ScrollView`.

## Phase 4 — Filters and search

### High-level understanding

The screen stores three choices: semester, department, and query. It derives visible results from those choices without modifying the source array.

### Intuition and small example

With Fall + CSE + `comp2011`, one result appears. With Fall + MATH + `comp2011`, zero results appear. Changing to a semester without the chosen department resets the department to All.

### Detailed explanation and choice

`filterCourses` is a pure function. It normalizes case and removes whitespace from the query and searchable fields. `useMemo` only recomputes results when inputs change. A small searchable picker uses native `Modal` and `FlatList`; no picker or search package is needed.

### Your hands-on check

Predict the result count for `MATH` and `comp2011`, then try it. Find where `setQuery` changes state and where `filterCourses` turns state into visible rows.

## Phase 5 — Recursive prerequisites

### High-level understanding

A course's prerequisite text is a statement of conditions. The explorer extracts course codes from that statement to offer navigation, and each linked course can reveal another level.

### Intuition and small example

`COMP 2011` says `COMP 1023 OR COMP 1028`. The page keeps that exact wording and offers links to both. Expanding `COMP 1028` reveals `COMP 1021`. `OR` remains `OR`; the linked list is not presented as a claim that both courses are required.

### Detailed explanation and choice

`extractCourseCodes` uses a small pattern and prefixes known to the supplied catalogue. `resolvePrerequisite` first tries the viewed term, then the newest available term. A `Set` of visited `termCode:courseCode` keys is copied for each branch; revisiting a key stops that branch. The user expands one node at a time, avoiding eager rendering of a large graph. Some natural-language shorthand cannot be linked automatically, so the source text always remains visible.

### Your hands-on check

Open `COMP 2011`, expand `COMP 1028`, and point to where the third course comes from. Then explain how a path-local `Set` stops a cycle without hiding a course used by another branch.

## Phase 6 — Reliability and native UX

### High-level understanding

Tests check data rules that could silently produce wrong results. Manual interaction checks that routes and controls behave like an app, rather than merely compiling.

### Intuition and small example

A test checks that `comp2011` resolves to `COMP 2011`, while `MATH + comp2011` returns no rows. A synthetic `A → B → A` path shows why traversal must stop when `A` appears again.

### Detailed explanation and choice

Vitest covers preprocessing, uniqueness, search, extraction, semester fallback, and path-local cycle logic. TypeScript and lint check code structure. Web and iOS exports verify bundling. Browser checks cover user journeys. Native interaction and performance remain unverified until Xcode and a simulator are installed on this Mac.

### Your hands-on check

Run `npm test`, `npx tsc --noEmit`, and `npx expo lint`. Once a simulator is available, test a small screen: scroll, type in search, switch filters, open details, expand a chain, and use Back.

## Phase 7 — Reproducible submission

### High-level understanding

A reviewer should know how to run the app, where the data came from, and what assumptions shape the UI.

### Intuition and small example

A fresh clone can run `npm ci` and `npm run web` without downloading a course API. `npm run prepare:data` recreates the term files from the included original JSON.

### Detailed explanation and choice

The README records setup, data provenance, route and state structure, matching rules, prerequisite limitations, checks performed, and the missing native verification. The app keeps the required feature set compact; no favourites, timetable, backend, or graph library were added.

### Your hands-on check

Explain to an interviewer: why `termCode + code` is the identity, why generated data is checked in, why `FlatList` is used, and why the original prerequisite sentence must stay on screen.
