import { test, expect } from '@playwright/test';

test('horizontal scrolling features section', async ({ page }) => {
  await page.goto('https://websitetoapp.app');
  
  // Find the scrollable container
  const scrollContainer = page.locator('div[style*="overflow"]').first();
  
  // Check if element exists
  const exists = await scrollContainer.count() > 0;
  console.log('Scroll container exists:', exists);
  
  // Get scroll width vs client width
  const scrollInfo = await scrollContainer.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    overflowX: window.getComputedStyle(el).overflowX,
    canScroll: el.scrollWidth > el.clientWidth
  }));
  
  console.log('Scroll info:', scrollInfo);
  
  // Try to scroll
  await scrollContainer.evaluate((el) => {
    el.scrollLeft = 500;
  });
  
  await page.waitForTimeout(1000);
  
  const scrollLeft = await scrollContainer.evaluate((el) => el.scrollLeft);
  console.log('Scroll position after scroll:', scrollLeft);
});
