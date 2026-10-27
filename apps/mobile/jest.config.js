// jest-expo's transformIgnorePatterns know pnpm's `.pnpm` store but not Bun's
// isolated `.bun` store; without this, React Native's ESM sources are not transformed.
const preset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
    pattern.replace('(?!(.pnpm|', '(?!(.pnpm|\\.bun|'),
  ),
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Babel injects helper imports into packages/shared/dist, which has no
    // @babel/runtime of its own under isolated installs; Metro falls back to the
    // app's node_modules, Jest needs to be told.
    '^@babel/runtime/(.*)$': '<rootDir>/node_modules/@babel/runtime/$1',
  },
};
