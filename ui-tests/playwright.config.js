/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  webServer: {
    command: 'jlpm start',
    url: 'http://localhost:8888/lab',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: 'general',
      testMatch: 'tests/*.spec.ts'
    },
    {
      name: 'nbgitpuller',
      testMatch: 'nbgitpuller_test/*.spec.ts'
    }
  ]
};
