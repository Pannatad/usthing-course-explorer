# Validation record — 2026-09-27

This record separates automated correctness, observed development UX, and uncompleted release acceptance. Android and standalone checks are pending by user decision. The source is published in a public GitHub repository.

## Environment

- macOS host: Apple M5 Pro, arm64; baseline/host benchmark on Node 22.22.3; clean-clone verification on Node 24.19.0.
- App: Expo 57.0.25, React Native 0.86.3, React 19.2.3, Expo Router 57.0.23.
- Native smoke test: Xcode 26.4.1, iPhone 17 Pro Simulator, iOS 26.4 (23E244), Expo Go development session via Metro on port 8082.
- Web: Codex in-app Chromium browser against the same Metro server.
- No configured Android SDK/device; EAS CLI reports “Not logged in.” No production/native release performance measurements were taken.

## Correctness and reproducibility

- 24 Vitest tests cover the pipeline, source preservation, deterministic ordering, prerequisite extraction/resolution, search, loader access, corruption handling, and a bounded repository workload.
- 7 Jest / jest-expo / React Native Testing Library tests cover router flows and UI state using a small fixture catalogue.
- TypeScript, Expo lint, `check:data`, Expo Doctor (21/21), and iOS/Android/web export passed.
- The Python importer was rerun in an isolated environment with `pyarrow==21.0.0`; regenerated data matched committed runtime artifacts exactly.
- All 12,476 course–semester records reconstruct with unchanged displayed fields against the pre-refactor baseline digest in `tests/catalog-baseline.json`.
- Equal-newest timestamp conflicts fail; newer inactive records remove the course; invalid obsolete content does not reject a valid newer record. Invalid credit values fail. Optional null text is normalized.
- `check:data` checks both file contents and names, including stale extra files, without rewriting tracked files.
- Data and UI runners have disjoint filename patterns. RNTL 13.3.3 is used with Expo Router's synchronous test helpers; React Test Renderer matches React 19.2.3.

The build report contains 17,485 selected source versions, 4,938 duplicate versions, 71 inactive latest records, 12,476 active identities, 3,375 unique detail payloads, and 229 unresolved prerequisite occurrences. Campus/term exclusions in that report are zero because the importer already filtered the full 216,075-row Parquet source. An unresolved occurrence is a reference absent from the supplied scope, not proof that the source is wrong.

`npm audit --omit=dev --audit-level=high` passed the high-severity threshold, but reported 14 moderate transitive advisories in the Expo/Router tree. They are not represented as fixed; avoid breaking SDK versions with a forced audit update. Recheck upstream compatible fixes before release.

## Clean local clone

Candidate `17a4be3` was cloned into a new temporary directory without sharing `node_modules`. On Node 24.19.0, `npm ci`, `check:data`, all 31 tests, typecheck, Expo lint, Expo Doctor (21/21), all-platform export, and `git diff --check` passed. The clone remained clean. Subsequent changes added only this verification record, clarified supported Node versions, and pinned `.nvmrc`; they did not alter application code, data, or dependencies.

The public [GitHub repository](https://github.com/Pannatad/usthing-course-explorer) was created on 2026-09-28. Remote `main` matched local commit `ff58a48`. A fresh clone of that remote commit passed `npm ci`, `check:data`, all 31 tests, typecheck, Expo lint, and `git diff --check` on Node 24.19.0. This publication note is the only subsequent committed change; no uncommitted local feature work was included in the push.

## Size measurements

Same host and Expo export mode before/after. Bytes are exact file sizes, not download-compressed sizes or installed application sizes.

| Artifact | Before | After | Change |
| --- | ---: | ---: | ---: |
| Runtime catalogue JSON, including manifest | 8,905,361 | 4,571,967 | −48.66% |
| iOS Hermes export | 4,876,016 | 4,978,687 | +2.11% |
| Android Hermes export | 5,191,263 | 5,294,267 | +1.98% |
| Web JS export | 9,751,918 | 5,419,648 | −44.42% |

Runtime JSON excludes the build-only quality report and TypeScript registry. Deduplication beats the 40% JSON target, but did **not** shrink the native Hermes export. Native memory/startup effects remain unmeasured. Chunking controls repository access; Metro still owns and can retain all required modules.

## Host-only repository measurements

Raw results: [host-benchmark.json](validation/host-benchmark.json). Reproduce with:

```bash
CATALOG_BENCHMARK_OUTPUT=/tmp/catalog-benchmark.json npm run test:data -- tests/performance.test.ts
```

On Node 22.22.3 / Apple M5 Pro: first term indexing 3.66 ms; 120 search/filter operations median 0.034 ms, p95 0.128 ms; first detail access 0.456 ms, repeated access 0.007 ms. After 20 repeated four-semester browse/detail cycles, application-owned caches remained at four term indexes and the same two detail chunks. List-only search invoked zero detail loaders.

This is a repository microbenchmark, not a native render, cold launch, memory, or input-to-paint benchmark. The native p95 <50 ms and visible update <150 ms acceptance targets are **not yet verified**. No before/after native performance comparison is available.

## Observed interaction checks

### iOS Expo Go — focused smoke checks passed

- Catalogue launches and displays source records; department filtering works.
- Search `comp2011` with Summer + CSE produces one matching result.
- With the native software keyboard visibly present, one tap on the CSE picker option commits it and closes the picker.
- With the native software keyboard visibly present, one tap on COMP 2011 opens its detail screen and dismisses the keyboard.
- COMP 2011 shows original prerequisite wording. Expanding COMP 1028 reveals COMP 1021, with expanded accessibility state.
- App Back retains Summer, CSE, and `comp2011`.

These were Simulator development checks, not physical-device or standalone offline tests. The full iOS acceptance matrix below remains incomplete.

### Web — focused smoke checks passed

- Default catalogue renders, code search filters, and all four semester choices retain the query.
- LIFS 4060 shows `LIFS 2040/2210, and LIFS 3140` unchanged and all three references.
- Expanding LIFS 2210 shows LIFS 1901 and LIFS 1902; its detail link opens the correct Fall record.
- App Back returns through the detail stack and preserves `lifs4060` on the catalogue.
- Automated fixture screen tests additionally verify title search, intersected filters, department reset, empty results/picker, fallback navigation, unavailable references, cycles, and invalid routes.

Mocked screen tests do not prove native keyboard behavior. A web preview also does not prove cold-launch offline support; there is no service worker.

## Pending acceptance before submission

1. Configure EAS access/project, build the internal iOS Simulator app and Android APK with the committed preview profile, and record build identifiers.
2. Run the complete catalogue/search/filter/back/four-semester/LIFS 4060 flow on both standalone platforms. Repeat with network disabled. Android has not been interaction-tested.
3. On native, verify title search, unavailable/fallback/cyclic cases, no-prerequisite courses, long list/branch scrolling, small screens, enlarged system text, picker Close reachability, and keyboard drag dismissal. Fixture tests cover the graph cases but do not replace device UX checks.
4. On the same named device/build mode, measure five cold launches (median/max), at least 50 search/filter operations (median/p95), first/repeated term and detail access, and memory over twenty browse/detail/back cycles. Record loaded chunks separately from process memory. Targets: search p95 <50 ms, updates usually <150 ms, no visible stalls/blank flashes/lost taps, no continued application-cache growth for a fixed warmed working set.
5. Submit the [public repository URL](https://github.com/Pannatad/usthing-course-explorer) through the technical-test form after completing the required checks. The repository is published and its original code state passed fresh remote-clone verification; form submission has not occurred.

The implementation is ready for these checks, but overall all-platform/submission acceptance is not claimed complete.
