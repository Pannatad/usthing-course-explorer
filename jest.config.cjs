module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.ui.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  watchman: false,
};
