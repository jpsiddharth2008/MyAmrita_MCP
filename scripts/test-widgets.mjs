import { chromium } from 'playwright';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Production bundles with a synthetic host; never contacts the student portal.
const browser = await chromium.launch({ channel: process.env.WIDGET_BROWSER || 'msedge', headless: true });
const fixtures = JSON.parse(await readFile(new URL('./widget-fixtures.json', import.meta.url), 'utf8'));
await mkdir('.work/screenshots', { recursive: true });
let checks = 0;
try {
  for (const [route, fixture] of Object.entries(fixtures)) {
    const html = await readFile(`src/widgets/out/${route}.html`, 'utf8');
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', r => r.abort());
    await page.setContent(html);
    await page.getByText('Connecting to host…').waitFor(); checks++;
    const inject = async (output, theme = 'light') => {
      await page.evaluate(({ output, theme }) => {
        window.openai = { toolOutput: output, theme };
        window.dispatchEvent(new CustomEvent('openai:ready'));
        window.dispatchEvent(new CustomEvent('openai:set_globals', { detail: { globals: { toolOutput: output, theme } } }));
      }, { output, theme });
    };
    await inject(null);
    await page.getByText('Waiting for tool results…').waitFor(); checks++;
    await inject({ error: 'session_expired', message: 'Synthetic session expired.' });
    await page.getByRole('alert').getByText('Sign in again').waitFor(); checks++;
    await inject({ unexpected: true });
    await page.getByRole('alert').getByText(/unexpected response/).waitFor(); checks++;
    for (const test of fixture.cases) {
      await inject({ structuredContent: test.data });
      for (const expected of test.text) await page.getByText(expected, { exact: true }).first().waitFor();
      checks++;
    }
    await inject(fixture.cases[0].data, 'dark');
    await page.locator('main[data-theme="dark"]').waitFor(); checks++;
    if (fixture.filter) {
      const { label, value, absent } = fixture.filter;
      const control = page.getByLabel(label, { exact: true });
      if (await control.evaluate(el => el.tagName) === 'SELECT') await control.selectOption(value);
      else if (await control.getAttribute('type') === 'checkbox') await control.check();
      else await control.fill(value);
      await page.getByText(absent, { exact: true }).waitFor({ state: 'hidden' }); checks++;
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route}: horizontal overflow`);
    await page.screenshot({ path: `.work/screenshots/${route}-mobile-dark.png`, fullPage: true });
    await page.setViewportSize({ width: 1000, height: 800 });
    await inject(fixture.cases[0].data);
    await page.locator('main[data-theme="light"]').waitFor();
    await page.screenshot({ path: `.work/screenshots/${route}-desktop.png`, fullPage: true });
    assert.deepEqual(errors, [], `${route}: browser errors`); checks++;
    await page.close();
    console.log(`PASS ${route}`);
  }
  const routes = (await readdir('src/widgets/out')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)).sort();
  assert.deepEqual(routes, Object.keys(fixtures).sort(), 'Every bundled widget needs test fixtures');
  console.log(`Passed ${checks} browser checks across ${routes.length} production widgets.`);
} finally { await browser.close(); }
