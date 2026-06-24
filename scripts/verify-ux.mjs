import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const email = process.env.SEED_EMAIL || 'phamdungcm1981@gmail.com';
const password = process.env.SEED_PASSWORD || 'prim@stkm01';
const artifactDir = path.resolve(process.cwd(), 'artifacts', 'ux-checks');

function normalizeBaseUrl(url) {
  return url.replace(/\/$/, '');
}

async function isVisible(page, text) {
  return page
    .getByText(text, { exact: false })
    .first()
    .isVisible()
    .catch(() => false);
}

async function gotoReady(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
}

async function assertVisible(page, text, label) {
  if (!(await isVisible(page, text))) {
    throw new Error(`${label}: expected to find visible text "${text}"`);
  }
}

async function clickFirstVisible(page, patterns) {
  for (const pattern of patterns) {
    const locator = page.getByText(pattern, { exact: false }).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click();
      return true;
    }
  }
  return false;
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDir, `${name}.png`),
    fullPage: true,
  });
}

async function login(page, rootUrl) {
  await gotoReady(page, `${rootUrl}/vi/login`);
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/vi\/(menu|$)/, { timeout: 45000 }).catch(async () => {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  });

  if (page.url().includes('/login')) {
    throw new Error('Login failed. Check seed account, auth env, and database.');
  }
}

async function verifyStockIn(page, rootUrl, results) {
  await gotoReady(page, `${rootUrl}/vi/menu/stock-in`);
  await capture(page, 'stock-in');
  await assertVisible(page, 'Ghi nhận nhập kho', 'stock-in CTA');
  results.push({ flow: 'stock-in', ok: true });
}

async function verifyStockOut(page, rootUrl, results) {
  await gotoReady(page, `${rootUrl}/vi/menu/stock-out`);
  await assertVisible(page, 'Xem lại phiếu xuất', 'stock-out review CTA');

  await clickFirstVisible(page, ['Bán lẻ', 'Ban le']);
  await page.waitForTimeout(500);

  await capture(page, 'stock-out-retail');
  await assertVisible(page, 'Thêm hàng tặng', 'retail gift action');
  await assertVisible(page, 'Ghi nợ cho khách', 'retail debt action');
  results.push({ flow: 'stock-out-retail', ok: true });
}

async function verifyReturnTab(page, rootUrl, results) {
  await gotoReady(page, `${rootUrl}/vi/menu/stock-out`);
  await clickFirstVisible(page, ['Đổi trả']);
  await page.waitForTimeout(500);
  await capture(page, 'return-exchange');
  await assertVisible(page, 'Số lượng trả', 'return quantity label');
  await assertVisible(page, 'Số lượng đổi', 'replacement quantity label');
  results.push({ flow: 'return-exchange', ok: true });
}

async function main() {
  const rootUrl = normalizeBaseUrl(baseUrl);
  fs.mkdirSync(artifactDir, { recursive: true });

  const results = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleMessages = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    consoleMessages.push({ type: 'pageerror', text: error.message });
  });

  try {
    await login(page, rootUrl);
    await capture(page, 'after-login');
    await verifyStockIn(page, rootUrl, results);
    await verifyStockOut(page, rootUrl, results);
    await verifyReturnTab(page, rootUrl, results);

    const resultPath = path.join(artifactDir, 'results.json');
    fs.writeFileSync(
      resultPath,
      JSON.stringify({ baseUrl: rootUrl, results, consoleMessages }, null, 2),
      'utf8'
    );
    console.log(`UX smoke check passed for ${rootUrl}`);
    console.log(`Artifacts: ${artifactDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
