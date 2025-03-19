import { defineConfig } from 'vitest/config';
/// <reference types="vitest" />
export default defineConfig({
  test: {
    // Set the test environment (e.g., 'node', 'jsdom')
    environment: 'node',

    // Specify a directory for test files
    include: ['**/*spec.{ts,js}'],

    // Exclude specific files or directories from testing
    exclude: ['node_modules', 'dist'],

    // Set a global timeout for tests
    testTimeout: 5000,

    // Enable or disable watch mode
    watch: true,
    globalSetup: './example-application/test/setup/global-setup-vitest.ts',

    // Configure coverage reporting
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
