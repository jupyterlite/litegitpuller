import { expect, test } from '@jupyterlab/galata';

/**
 * ### NOTE:
 * This test is supposed to run with nbgitpuller extension installed, to make
 * sure that the litegitpuller extension is not activated in that case.
 */

//Don't load JupyterLab webpage before running the tests.
//This is required to ensure we capture all log messages.
test.use({ autoGoto: false });

test('should emit a non activation console message', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(
      s =>
        s ===
        '@jupyterlite/litegitpuller is not activated, to avoid conflict with nbgitpuller'
    )
  ).toHaveLength(1);
});
