const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    packDetailTitle: { success: false, content: '' },
    itemsInPackList: { success: false, count: 0 },
    availableItemsList: { success: false, count: 0 },
    overallSuccess: false,
    error: null
  };

  try {
    // 1. Load index.html
    // Assuming index.html is in the /app directory
    await page.goto('file:///app/index.html');

    page.on('console', msg => console.log(`Browser Console: ${msg.type()} ${msg.text()}`));

    // Click on "Packs" in the sidebar to make the section visible
    const packsSidebarLink = page.locator('a[data-section="manage-packs"]');
    await packsSidebarLink.waitFor({ state: 'visible', timeout: 10000 });
    await packsSidebarLink.click();

    // Wait for the manage-packs-section to be active
    await page.waitForFunction(() => document.getElementById('manage-packs-section').classList.contains('active'), null, { timeout: 5000 });

    // 2. Wait for the application to initialize and for the pack-list to be populated.
    const firstPackListItem = page.locator('ul#pack-list li').first();
    try {
        await firstPackListItem.waitFor({ state: 'attached', timeout: 15000 });
        await firstPackListItem.waitFor({ state: 'visible', timeout: 15000 });
    } catch (e) {
        results.error = `Timeout waiting for first pack list item after clicking sidebar: ${e.message}`;
        if (await firstPackListItem.count() > 0) {
            results.debug = {
                html: await firstPackListItem.innerHTML(),
                isVisible: await firstPackListItem.isVisible(),
                boundingBox: await firstPackListItem.boundingBox()
            };
            await page.screenshot({ path: 'debug_screenshot.png' });
            results.screenshotPath = 'debug_screenshot.png';
        }
        console.log(JSON.stringify(results));
        await browser.close();
        return;
    }


    // 3. Identify the first pack in the ul#pack-list.
    if (!await firstPackListItem.isVisible()) {
      results.error = "First pack item is not visible even after explicit waits.";
      console.log(JSON.stringify(results));
      await browser.close();
      return;
    }

    // 4. Find the "Gérer" button within this first pack item.
    const gererButton = firstPackListItem.locator('button.view-pack-button');
    try {
        await gererButton.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
        results.error = `Gérer button not visible: ${e.message}`;
        await page.screenshot({ path: 'debug_screenshot_button.png' });
        results.screenshotPath = 'debug_screenshot_button.png';
        console.log(JSON.stringify(results));
        await browser.close();
        return;
    }
    if (!await gererButton.isVisible()) {
        results.error = "Gérer button not found or not visible for the first pack after waiting.";
        console.log(JSON.stringify(results));
        await browser.close();
        return;
    }

    await page.waitForTimeout(500); // Small delay before click

    // 5. Simulate a click on this "Gérer" button.
    await gererButton.click();

    // 6. After the click, inspect the DOM:
    // Wait for the pack detail section to become active and title to appear
    const packDetailTitle = page.locator('h2#pack-detail-title-heading');
    await packDetailTitle.waitFor({ state: 'visible', timeout: 10000 });

    // a. Check if the h2#pack-detail-title-heading element has non-empty textContent.
    const titleElement = await page.locator('h2#pack-detail-title-heading');
    const titleContent = await titleElement.textContent();
    if (titleContent && titleContent.trim() !== '') {
      results.packDetailTitle.success = true;
      results.packDetailTitle.content = titleContent.trim();
    } else {
      results.packDetailTitle.content = 'Title was empty.';
    }

    // b. Check if ul#items-in-pack-list contains at least one li child element.
    // Wait for items to potentially load
    try {
        await page.waitForFunction(() => document.querySelector('ul#items-in-pack-list').children.length > 0, null, { timeout: 5000 });
        const itemsInPackCount = await page.locator('ul#items-in-pack-list li').count();
        if (itemsInPackCount > 0) {
            results.itemsInPackList.success = true;
            results.itemsInPackList.count = itemsInPackCount;
        } else {
            results.itemsInPackList.count = 0;
        }
    } catch (e) {
        results.itemsInPackList.count = 0; // No items found within timeout
        results.itemsInPackList.error = 'Timeout waiting for items in pack or no items found.';
    }


    // c. Check if ul#available-items-list contains at least one li child element.
     try {
        await page.waitForFunction(() => document.querySelector('ul#available-items-list').children.length > 0, null, { timeout: 5000 });
        const availableItemsCount = await page.locator('ul#available-items-list li').count();
        if (availableItemsCount > 0) {
            results.availableItemsList.success = true;
            results.availableItemsList.count = availableItemsCount;
        } else {
            results.availableItemsList.count = 0;
        }
    } catch (e) {
        results.availableItemsList.count = 0; // No items found within timeout
        results.availableItemsList.error = 'Timeout waiting for available items or no items found.';
    }


    if (results.packDetailTitle.success && results.itemsInPackList.success && results.availableItemsList.success) {
      results.overallSuccess = true;
    }

  } catch (e) {
    results.error = e.message;
  } finally {
    console.log(JSON.stringify(results));
    await browser.close();
  }
})();
