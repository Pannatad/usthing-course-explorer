# Two-course comparison

## High-level understanding

Students can compare two distinct courses from one semester. Open **Compare two courses** from the catalogue, or **Compare with another course** from a detail screen to preselect that course. The comparison is temporary and lives on its own screen; normal stack navigation returns to the catalogue or detail screen.

## Small example

Select COMP 2011 as course A, search for COMP 2012 as course B, and compare their credits, level, and original prerequisite wording. Expand descriptions or corequisites/exclusions only when needed. Open either course's full details and use Back to return to the comparison.

## Design and implementation

- `src/app/compare.tsx` reads optional semester/course route parameters and renders the feature. Invalid initial values fall back to the default semester or an empty selection.
- `src/features/comparison/CourseComparison.tsx` coordinates the semester, the two selected codes, and which slot is being chosen. `CourseChooser.tsx` owns its own search query and uses the existing summary search with a virtualized `FlatList`; only selected courses request full details.
- Either slot has visible Change and Remove controls. Selecting the same course for both slots is disabled. Cancelling the chooser preserves the previous selection.
- Semester changes retain courses present in the new semester and clear unavailable selections with an explanation. The comparison never silently mixes semesters.
- Short fields appear side by side when there is room. Longer text is stacked and labelled by course code. Narrow screens wrap the slots and short fields into a single column.
- Prerequisites initially show at most three lines with a full-wording toggle. Descriptions and additional requirements are collapsed initially. Text comes directly from the catalogue; there is no eligibility inference or generated summary.
- `ComparisonDetails.tsx` owns disclosure state; `Field` renders each pair of values; `ComparisonAction` and `Toggle` provide consistent controls.
- Selections remain when opening a course detail and returning. They are not saved across app restarts or a fresh visit to comparison.

## Verification

The comparison tests cover distinct selection, unchanged prerequisite wording, disclosure, cancelling/replacing/removing, semester changes, empty search, detail preselection, and returning from details. The UI suite passes 20 tests. Browser interaction and visual checks passed at 390- and 320-pixel widths. TypeScript and Expo lint pass. Physical-device and Android interaction checks for this feature remain unverified.
