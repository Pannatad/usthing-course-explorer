import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import { render } from '@testing-library/react-native';
import Compare from '../src/app/compare';
import Home from '../src/app/index';
import Details from '../src/app/course/[termCode]/[courseCode]';
import Layout from '../src/app/_layout';
import { CourseComparison } from '../src/features/comparison/CourseComparison';

jest.mock('../src/data/catalog', () => {
  const { makeFixtureCatalog } = require('./fixture-catalog');
  const { compactCourseCode } = require('../src/data/repository');
  const catalog = makeFixtureCatalog();
  return { catalog, ...catalog, compactCourseCode, terms: catalog.getTerms(), defaultTerm: catalog.getTerms()[0] };
});

const choose = (slot: string, code: string, title: string) => {
  fireEvent.press(screen.getByLabelText(`Choose course ${slot}`));
  fireEvent.changeText(screen.getByLabelText('Search by course code or title'), code.replace(/ /g, '').toLowerCase());
  fireEvent.press(screen.getByLabelText(`Select ${code}, ${title}`));
};

describe('two-course comparison', () => {
  it('selects distinct courses, preserves original wording, and reveals details on demand', () => {
    render(<CourseComparison />);
    choose('A', 'COMP 2011', 'Programming with C++');
    fireEvent.press(screen.getByLabelText('Choose course B'));
    expect(screen.getByLabelText('Select COMP 2011, Programming with C++')).toBeDisabled();
    fireEvent.press(screen.getByLabelText('Select COMP 1023, Introduction to Python'));
    expect(screen.getByText('COMP 1023 OR COMP 1028; CORE 1120')).toBeTruthy();
    expect(screen.getByText('No listed prerequisites.')).toBeTruthy();
    expect(screen.queryByText('Learn programming')).toBeNull();
    fireEvent.press(screen.getByText('Show descriptions'));
    expect(screen.getByText('Learn programming')).toBeTruthy();
    expect(screen.getByText('Python foundations')).toBeTruthy();
    fireEvent.press(screen.getByText('Show full prerequisite wording'));
    expect(screen.getByText('COMP 1023 OR COMP 1028; CORE 1120').props.numberOfLines).toBeUndefined();
    fireEvent.press(screen.getByLabelText('Change course B'));
    fireEvent.press(screen.getByLabelText('Back to comparison'));
    expect(screen.getByText('Introduction to Python')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remove course B'));
    expect(screen.queryByText('Credits')).toBeNull();
    expect(screen.getByLabelText('Choose course B')).toBeTruthy();
  });

  it('clears unavailable selections on semester change and handles empty searches', () => {
    render(<CourseComparison initialTerm="2610" initialCourse="COMP2011" />);
    fireEvent.press(screen.getByLabelText('Comparison semester: 2026-27 Fall'));
    fireEvent.press(screen.getByText('2025-26 Summer'));
    expect(screen.getByLabelText('Choose course A')).toBeTruthy();
    expect(screen.getByText(/A selected course is not listed/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Choose course A'));
    fireEvent.changeText(screen.getByLabelText('Search by course code or title'), 'absent');
    expect(screen.getByText('No courses match. Try another code or title.')).toBeTruthy();
  });

  it('opens from a detail screen with that course selected and preserves comparison on back', async () => {
    const result = renderRouter({ _layout: Layout, index: Home, compare: Compare, 'course/[termCode]/[courseCode]': Details }, { initialUrl: '/course/2610/COMP2011' });
    fireEvent.press(screen.getByText('Compare with another course →'));
    await waitFor(() => expect(result.getPathname()).toBe('/compare'));
    expect(screen.getByText('Programming with C++')).toBeTruthy();
    choose('B', 'COMP 1023', 'Introduction to Python');
    fireEvent.press(screen.getByText('Open COMP 1023 details →'));
    await waitFor(() => expect(result.getPathname()).toBe('/course/2610/COMP1023'));
    testRouter.back('/compare?termCode=2610&courseCode=COMP+2011');
    expect(screen.getByText('Programming with C++')).toBeTruthy();
    expect(screen.getByText('Introduction to Python')).toBeTruthy();
  });
});
