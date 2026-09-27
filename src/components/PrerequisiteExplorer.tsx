import { Link } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { compactCourseCode, getCourseDetails, terms } from '@/data/catalog';
import { courseKey, type Course } from '@/data/course';
import { extendPath, isAlreadyInPath, resolvePrerequisite } from '@/data/prerequisites';
import { colors } from '@/theme';

type NodeProps = {
  code: string;
  preferredTermCode: string;
  path: ReadonlySet<string>;
};

function PrerequisiteNode({ code, preferredTermCode, path }: NodeProps) {
  const [expanded, setExpanded] = useState(false);
  const resolution = resolvePrerequisite(code, preferredTermCode);

  if (resolution.status === 'unavailable') {
    return (
      <View style={styles.node}>
        <Text style={styles.nodeCode}>{code}</Text>
        <Text style={styles.hint}>Course unavailable in the supplied Clear Water Bay semesters.</Text>
      </View>
    );
  }

  const course = resolution.summary;
  const repeated = isAlreadyInPath(course, path);
  const detail = expanded && !repeated ? getCourseDetails(course.termCode, course.code) : undefined;
  const references = detail?.prerequisiteCodes ?? [];
  const nextPath = extendPath(course, path);

  return (
    <View style={styles.node}>
      <Text style={styles.nodeCode}>{course.code}</Text>
      <Text style={styles.nodeTitle}>{course.title}</Text>
      {course.termCode !== preferredTermCode && (
        <Text style={styles.hint}>Showing {terms.find((term) => term.code === course.termCode)?.name}; unavailable in the viewed semester.</Text>
      )}
      <Link
        href={{ pathname: '/course/[termCode]/[courseCode]', params: { termCode: course.termCode, courseCode: compactCourseCode(course.code) } }}
        style={styles.link}
        onPress={() => Keyboard.dismiss()}>
        Open course details →
      </Link>
      {repeated ? (
        <Text style={styles.hint}>Already visited on this path. This branch stops here.</Text>
      ) : course.prerequisiteCount > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${expanded ? 'Hide' : 'Show'} prerequisites for ${course.code}`}
            onPress={() => setExpanded(!expanded)}
            style={styles.expandButton}>
            <Text style={styles.expandText}>{expanded ? 'Hide' : 'Show'} prerequisites ({course.prerequisiteCount})</Text>
          </Pressable>
          {expanded && (
            <View style={styles.children}>
              <Text style={styles.logic}>{detail?.prerequisite}</Text>
              {references.map((reference) => (
                <PrerequisiteNode key={reference} code={reference} preferredTermCode={preferredTermCode} path={nextPath} />
              ))}
            </View>
          )}
        </>
      ) : course.hasPrerequisite ? (
        <Text style={styles.hint}>No linked course codes in this prerequisite text.</Text>
      ) : (
        <Text style={styles.hint}>No listed prerequisites.</Text>
      )}
    </View>
  );
}

export function PrerequisiteExplorer({ course }: { course: Course }) {
  const references = course.prerequisiteCodes;
  if (!course.prerequisite) return <Text style={styles.hint}>No listed prerequisites.</Text>;
  if (!references.length) return <Text style={styles.hint}>No course codes could be linked from this text.</Text>;

  const path = new Set([courseKey(course)]);
  return (
    <View style={styles.root}>
      <Text style={styles.intro}>Referenced courses ({course.prerequisiteCount})</Text>
      {references.map((code) => (
        <PrerequisiteNode key={code} code={code} preferredTermCode={course.termCode} path={path} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4, marginTop: 10 },
  intro: { color: colors.secondaryText, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  node: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 12, gap: 6 },
  nodeCode: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  nodeTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  hint: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700', paddingVertical: 8, alignSelf: 'flex-start' },
  expandButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', backgroundColor: colors.courseSurface, borderRadius: 8, paddingHorizontal: 12 },
  expandText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  children: { marginTop: 6, marginLeft: 14, gap: 4 },
  logic: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
});
