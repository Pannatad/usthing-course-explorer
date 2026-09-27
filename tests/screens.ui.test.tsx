import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderRouter, screen, fireEvent, testRouter, waitFor } from 'expo-router/testing-library';
import { render } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import Home from '../src/app/index';
import Details from '../src/app/course/[termCode]/[courseCode]';
import Layout from '../src/app/_layout';
import { OptionPicker } from '../src/components/OptionPicker';
import { PrerequisiteExplorer } from '../src/components/PrerequisiteExplorer';
import { catalog, getCourseDetails } from '../src/data/catalog';

jest.mock('../src/data/catalog',()=>{
  const {makeFixtureCatalog}=require('./fixture-catalog');
  const {compactCourseCode}=require('../src/data/repository');
  const catalog=makeFixtureCatalog();
  return {catalog,...catalog,getCourseDetails:(term:string,code:string)=>catalog.getCourseDetails(term,code),compactCourseCode,terms:catalog.getTerms(),defaultTerm:catalog.getTerms()[0]};
});
const mount=(initialUrl='/')=>renderRouter({_layout:Layout,index:Home,'course/[termCode]/[courseCode]':Details},{initialUrl});
const search=(query:string)=>fireEvent.changeText(screen.getByLabelText('Search by course code or title'),query);
const select=(label:string,current:string,next:string)=>{
  fireEvent.press(screen.getByLabelText(`${label}: ${current}`));
  fireEvent.press(screen.getByText(next,{exact:true}));
};
beforeEach(()=>{ jest.clearAllMocks(); });

describe('course discovery and navigation',()=>{
  it('searches code/title and returns from details with filters intact',async()=>{
    const result=mount();search('comp2011');
    expect(screen.getByText('1 course in 2026-27 Fall')).toBeTruthy();
    search('programming with c++');
    select('Department','All departments','CSE');
    fireEvent.press(screen.getByLabelText('Open COMP 2011, Programming with C++'));
    await waitFor(()=>expect(result.getPathname()).toBe('/course/2610/COMP2011'));
    expect(screen.getByText('Learn programming')).toBeTruthy();
    testRouter.back('/');
    expect(screen.getByDisplayValue('programming with c++')).toBeTruthy();
    expect(screen.getByLabelText('Department: CSE')).toBeTruthy();
  });
  it('combines filters and resets an unavailable department when changing semesters',()=>{
    mount();search('comp2011');select('Department','All departments','MATH');
    expect(screen.getByText(/No courses match these filters/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Clear search'));
    select('Semester','2026-27 Fall','2025-26 Summer');
    expect(screen.getByLabelText('Department: All departments')).toBeTruthy();
    expect(screen.getByText('1 course in 2025-26 Summer')).toBeTruthy();
  });
  it('handles invalid routes and courses without prerequisites',()=>{
    mount('/course/bogus/COMP2011');expect(screen.getByText('This course is not in the supplied Clear Water Bay catalogue.')).toBeTruthy();
    testRouter.replace('/course/2610/COMP1023');
    expect(screen.getByText('No listed prerequisites.')).toBeTruthy();
  });
  it('expands lazily, stops a cycle, and collapses a branch',()=>{
    mount('/course/2610/COMP2011');
    expect(screen.getByText('CORE 1120')).toBeTruthy();
    expect(screen.getByText(/Course unavailable/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Show prerequisites for COMP 1028'));
    fireEvent.press(screen.getByLabelText('Show prerequisites for COMP 1021'));
    expect(screen.getByText('Already visited on this path. This branch stops here.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Hide prerequisites for COMP 1028'));
    expect(screen.queryByText('Already visited on this path. This branch stops here.')).toBeNull();
  });
  it('navigates a fallback prerequisite to its actual semester',async()=>{
    const result=mount('/course/2610/ACCT5430');
    expect(screen.getByText('Showing 2025-26 Summer; unavailable in the viewed semester.')).toBeTruthy();
    fireEvent.press(screen.getByText('Open course details →'));
    await waitFor(()=>expect(result.getPathname()).toBe('/course/2540/ACCT5150'));
    expect(screen.getByText('Old accounting course')).toBeTruthy();
  });
});

describe('picker and lazy explorer',()=>{
  it('shows an empty picker search and dismisses the keyboard on closing',()=>{
    const dismiss=jest.spyOn(Keyboard,'dismiss');
    render(<OptionPicker label="Department" value="All" options={Array.from({length:11},(_,i)=>({value:`D${i}`,label:`D${i}`}))} onChange={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Department: All'));
    fireEvent.changeText(screen.getByLabelText('Find department'),'unmatched');
    expect(screen.getByText('No departments match.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Close options'));
    expect(dismiss).toHaveBeenCalled();dismiss.mockRestore();
  });
  it('loads only expanded node details and exposes expanded state',()=>{
    const root=getCourseDetails('2610','COMP2011')!;
    const spy=jest.spyOn(catalog,'getCourseDetails');
    // Render inside the actual router so Link has navigation context.
    renderRouter({index:()=> <PrerequisiteExplorer course={root}/>});
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Show prerequisites for COMP 1028').props.accessibilityState).toEqual({expanded:false});
    fireEvent.press(screen.getByLabelText('Show prerequisites for COMP 1028'));
    expect(spy).toHaveBeenCalledWith('2610','COMP 1028');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Hide prerequisites for COMP 1028').props.accessibilityState).toEqual({expanded:true});
    spy.mockRestore();
  });
});
