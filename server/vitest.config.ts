import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // NODE_ENV=test makes db/pool.ts connect to DATABASE_URL_TEST, never the dev database
    env: { NODE_ENV: 'test' },
    setupFiles: ['./tests/setup.ts'],
    // All test files share one test database, so run them one after another
    fileParallelism: false,
  },
})
