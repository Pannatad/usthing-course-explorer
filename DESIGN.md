---
name: HKUST Course Explorer
description: Course browsing in the visual language of USThing
colors:
  primary: "#235596"
  primary-soft: "#E3EEFB"
  postgraduate: "#663782"
  postgraduate-soft: "#F2EAF7"
  search-surface: "#F1F4F8"
  canvas: "#FFFFFF"
  ink: "#252525"
  secondary-ink: "#5C5B6B"
  divider: "#D7E2EF"
typography:
  headline:
    fontFamily: "System"
    fontSize: "30px"
    fontWeight: 700
  title:
    fontFamily: "System"
    fontSize: "20px"
    fontWeight: 700
  body:
    fontFamily: "System"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "System"
    fontSize: "14px"
    fontWeight: 600
rounded:
  control: "12px"
  row: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  course-row:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    padding: "18px 20px"
  search-field:
    backgroundColor: "{colors.search-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
---

# Design System: HKUST Course Explorer

## Overview

**Creative North Star: "Academics in Hand"**

A student checks a course between classes on a phone in bright campus light. The UI uses the strong blue navigation and soft blue result surfaces in the supplied USThing screenshots. White space keeps descriptions and prerequisite wording readable.

**Key Characteristics:** familiar navigation, obvious search, compact course rows, and restrained use of blue.

## Colors

Primary blue anchors navigation and course identity. Soft blue marks selectable rows. White keeps detailed reading calm; the gray search surface separates controls from results.

**The Information Rule.** Color identifies navigation and selection; it never substitutes for a label or status message.

## Typography

Use one system sans family. The navigation title is bold and clear; course codes are prominent; titles and body text wrap naturally. Avoid oversized dashboard display text in the catalogue.

## Elevation

Flat tonal layers carry hierarchy. Avoid decorative shadows; dividers and surface colors make grouping clear.

## Components

### Navigation

Solid blue stack header with white title and back action. Home has the same header as the detail screen.

### Search and filters

Place the search field first. Use a pale gray fill, dark readable placeholder, and a visible search icon. Semester and department selectors remain directly below, with at least 44-point tap targets.

### Course rows

Use soft blue rounded rows for UG courses and soft violet rows for PG courses. Show a high-contrast UG/PG badge beside the code, with the code as the strongest text, title below, and credits as supporting metadata. Keep consistent gaps and allow long titles to wrap.

### Course details and prerequisites

Use a white reading surface with distinct section headings and thin dividers. Preserve original prerequisite conditions. Recursive links are readable rows with clear expand and open actions.

## Do's and Don'ts

### Do:

- **Do** keep the USThing blue header and pale blue course-row vocabulary consistent on both screens.
- **Do** give search and filters immediate visual priority.
- **Do** keep text contrast at least 4.5:1 for body and placeholder text.

### Don't:

- **Don't** copy unrelated USThing modules, grade statistics, timetable data, or section information into this course explorer.
- **Don't** use generic dashboard decoration, dense nested cards, or decorative icons that obscure course information.
- **Don't** use a colored side-stripe border to indicate a prerequisite branch.
