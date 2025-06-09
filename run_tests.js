const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  let browser;
  let mainErrorOccurred = false;

  try { // Outer try for overall browser launch and operation
    console.log('Launching browser...');
    const launchArgs = [];
    if (process.geteuid && process.geteuid() === 0) {
      console.log('Running as root, adding --no-sandbox');
      launchArgs.push('--no-sandbox');
      launchArgs.push('--disable-setuid-sandbox');
    }
    browser = await puppeteer.launch({
      headless: true,
      args: launchArgs
    });
    console.log('Browser launched.');

    const page = await browser.newPage();

    page.on('console', msg => {
      const text = msg.text();
      console.log('PAGE CONSOLE:', text);
      if (text.includes('Tests completed')) {
        const match = text.match(/(\d+) assertions? of (\d+) passed, (\d+) failed\./);
        if (match) {
          const assertions = parseInt(match[2], 10);
          const failed = parseInt(match[3], 10);
          if (failed > 0) {
            console.error(`TESTS FAILED: ${failed} out of ${assertions} assertions failed.`);
          } else {
            console.log(`TESTS PASSED: All ${assertions} assertions passed.`);
          }
        }
      }
    });

    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });

    page.on('requestfailed', request => {
        if (request.failure() && request.failure().errorText) {
            console.error('PAGE REQUEST FAILED:', request.url(), request.failure().errorText);
        }
    });

    const filePath = `file://${path.join(__dirname, 'tests.html')}`;
    console.log(`Navigating to ${filePath}`);
    await page.goto(filePath, { waitUntil: 'domcontentloaded' });
    console.log('Page loaded.');

    // Inner try...catch for test execution logic
    try {
      console.log('Attempting to wait for #qunit selector...');
      await page.waitForSelector('#qunit', { timeout: 15000 });
      console.log('#qunit container detected.');

      console.log('Waiting for QUnit tests to run (increased delay)...');
      await new Promise(resolve => setTimeout(resolve, 7000));

      console.log('Attempting to get content of #qunit div...');
      const qunitDivContent = await page.evaluate(() => {
        const qunitDiv = document.getElementById('qunit');
        return qunitDiv ? qunitDiv.innerText : 'ERROR: #qunit div not found by page.evaluate.';
      });
      console.log('CONTENT OF #qunit DIV (first 1000 chars):\n', qunitDivContent.substring(0,1000));

      // Proceed to check for #qunit-testresult based on the content of #qunit
      // This is a less direct way but might give clues if #qunit-testresult is the specific problem
      if (qunitDivContent.includes('Tests completed') || qunitDivContent.includes('Rerun')) {
        console.log('#qunit div content suggests tests ran. Extracting summary from #qunit-testresult...');
        const summary = await page.evaluate(() => {
          const resultElement = document.getElementById('qunit-testresult');
          return resultElement ? resultElement.innerText : '#qunit-testresult not found within page.evaluate';
        });
        console.log('TEST SUMMARY FROM PAGE:', summary);

        if (summary.includes('failed') || summary.includes('No tests were run') || summary.includes('not found')) {
          mainErrorOccurred = true;
          const failedTests = await page.evaluate(() => {
              const failed = [];
              // Try to get #qunit-tests even if summary extraction was tricky
              const testsContainer = document.getElementById('qunit-tests');
              if (testsContainer) {
                  const tests = testsContainer.querySelectorAll('li.fail');
                  tests.forEach(test => {
                      const testName = test.querySelector('.test-name');
                      const testMessages = [];
                      test.querySelectorAll('.test-message').forEach(msg => {
                          testMessages.push(msg.innerText.trim());
                      });
                      failed.push({
                          name: testName ? testName.innerText.trim() : "Unknown test",
                          messages: testMessages
                      });
                  });
              }
              // Fallback if specific extraction fails but summary indicates issues
              if (failed.length === 0 && document.getElementById('qunit-banner')?.classList.contains('qunit-fail')) {
                   const resultElement = document.getElementById('qunit-testresult');
                   const globalSummary = resultElement ? resultElement.innerText : "No summary found";
                   failed.push({ name: "Global QUnit Failure", messages: [globalSummary] });
              } else if (failed.length === 0 && document.getElementById('qunit')?.innerText?.includes('No tests were run')) {
                  failed.push({ name: "Global Failure", messages: ["No tests were run."] });
              }
              return failed;
          });

          if (failedTests.length > 0) {
              console.error("FAILED TESTS DETAILS:");
              tests.forEach(test => {
                  const testName = test.querySelector('.test-name');
                  const testMessages = [];
                  test.querySelectorAll('.test-message').forEach(msg => {
                      testMessages.push(msg.innerText.trim());
                  });
                  failed.push({
                      name: testName ? testName.innerText.trim() : "Unknown test",
                      messages: testMessages
                  });
              });
              failedTests.forEach(test => {
                  console.error(`  Test: ${test.name}`);
                  test.messages.forEach(msg => console.error(`    - ${msg}`));
              });
          } else { // If failedTests is empty but summary indicated issues
              console.error("Test summary indicated issues, but no specific test failure details extracted. Check #qunit content log.");
          }
        }
      } else {
          console.error("ERROR: QUnit does not seem to have run correctly, or #qunit div content is unexpected.");
          mainErrorOccurred = true;
      }
    } catch (e) {
      mainErrorOccurred = true;
      console.error('Error during test execution/result extraction:', e.message);
      try {
        const pageContent = await page.content();
        console.log("PAGE CONTENT ON ERROR (first 5000 chars):\n", pageContent.substring(0, 5000));
      } catch (contentError) {
        console.error("Error getting page content:", contentError.message);
      }
    }
  } catch (error) { // Outer catch for browser-level errors
    mainErrorOccurred = true;
    console.error('Error running tests with Puppeteer (outer scope):', error);
  } finally { // Outer finally to ensure browser closes
    console.log('Closing browser (in outer finally)...');
    if (browser) {
      await browser.close();
    }
    console.log('Browser closed (in outer finally).');
    if (mainErrorOccurred) {
      // process.exit(1); // Consider if explicit error exit is needed
    }
  }
})();
