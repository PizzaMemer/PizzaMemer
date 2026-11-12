import { defineConfig } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/PizzaMemer/`,
    channel: 'chrome',
    headless: true,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'bureau',
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `npm run build && npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/PizzaMemer/`,
    timeout: 240_000,
    reuseExistingServer: true,
  },
});
