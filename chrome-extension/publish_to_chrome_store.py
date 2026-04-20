"""
Publish WebToApp Chrome extension to Chrome Web Store.
Uses Edge with persistent profile (must be logged into Google developer account).
"""
import asyncio
import os
import sys
import random
import time

sys.stdout.reconfigure(line_buffering=True)

PROFILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "..", "play-console-cli", "edge-playconsole-profile")
EXTENSION_ZIP = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             "..", "webtoapp-chrome-extension.zip")
SCREENSHOT1 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshot1.png")
SCREENSHOT2 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshot2.png")

CWS_URL = "https://chrome.google.com/webstore/devconsole"

DESCRIPTION = """Mobile Readiness Analyzer — Check if any website is ready for app conversion.

This extension analyzes the current website and gives it a mobile-readiness score based on 8 technical checks. It helps developers and business owners understand how well a website would work as a mobile app.

HOW IT WORKS:
1. Browse to any website
2. Click the WebToApp extension icon
3. Click "Analyze for App Conversion" to get your readiness score
4. View detailed results: viewport, HTTPS, responsive design, PWA, service worker, favicon, images
5. If the score is good, click the link to visit WebsiteToApp.app to start the conversion process

WHAT IT CHECKS (8-point analysis):
- HTTPS enabled (secure connection)
- Mobile viewport meta tag present
- Responsive design detected
- Favicon available (used as app icon)
- Web App Manifest found
- Service Worker registered (offline support)
- Images loading correctly
- No mixed content issues

Each check shows a pass/fail indicator with a final percentage score.

USEFUL FOR:
- Web developers checking mobile readiness before app conversion
- Business owners evaluating if their website is app-ready
- Freelancers assessing client websites for mobile app projects
- QA testers validating mobile compatibility

The extension only reads the current page's HTML to perform analysis. No data is collected or transmitted. Results are displayed locally in the popup.

Visit https://websitetoapp.app for website to app conversion service."""

PRIVACY_POLICY = "https://websitetoapp.app/privacy-policy"


async def run():
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            PROFILE_DIR,
            executable_path="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            headless=False,
            viewport={"width": 1400, "height": 900},
            slow_mo=80,
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = browser.pages[0] if browser.pages else await browser.new_page()

        # Navigate to Chrome Web Store Developer Console
        print("[1] Opening Chrome Web Store Developer Console...")
        await page.goto(CWS_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000)

        # Check if logged in
        if "accounts.google.com" in page.url:
            print("NOT LOGGED IN - Please log into Google account.")
            print("Waiting up to 3 minutes...")
            for i in range(36):
                await page.wait_for_timeout(5000)
                if "accounts.google.com" not in page.url:
                    print("  Logged in!")
                    break
                if i % 6 == 5:
                    print(f"  Still waiting... {180 - (i+1)*5}s remaining")

        await page.wait_for_timeout(3000)
        print(f"  Current URL: {page.url}")

        # Check if developer registration is needed ($5 fee)
        page_text = await page.text_content("body") or ""
        if "register" in page_text.lower() and "developer" in page_text.lower():
            print("\n[!] Developer registration required ($5 fee).")

            # Check the agreement checkbox if not already checked
            checkbox = page.locator('input[type="checkbox"]').first
            if await checkbox.count() > 0:
                checked = await checkbox.is_checked()
                if not checked:
                    await checkbox.click()
                    print("  Checked developer agreement")
                    await page.wait_for_timeout(1000)

            # Click "Pay registration fee"
            pay_btn = page.locator('button:has-text("Pay registration fee"), a:has-text("Pay registration fee")').first
            if await pay_btn.is_visible(timeout=3000):
                await pay_btn.click()
                print("  Clicked 'Pay registration fee' — complete payment in the browser.")
                print("  Waiting up to 5 minutes for payment completion...")
                for i in range(60):
                    await page.wait_for_timeout(5000)
                    cur_url = page.url
                    cur_text = (await page.text_content("body") or "").lower()
                    if "devconsole" in cur_url and "register" not in cur_url:
                        print(f"  Registration complete! ({(i+1)*5}s)")
                        break
                    if "new item" in cur_text or "your items" in cur_text:
                        print(f"  Dashboard loaded! ({(i+1)*5}s)")
                        break
                    if i % 12 == 11:
                        print(f"  Still waiting... {300 - (i+1)*5}s remaining")
                else:
                    print("  Timeout waiting for registration. Check browser.")
                    await page.screenshot(path="debug_cws_payment.png")
            else:
                print("  Pay button not found. Complete registration manually in the browser.")
                print("  Waiting 3 minutes...")
                await page.wait_for_timeout(180000)

            await page.wait_for_timeout(3000)
            # Navigate to dashboard after registration
            await page.goto(CWS_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(5000)

        # Click "New Item" or "Add new item" button
        print("\n[2] Looking for 'New Item' button...")
        await page.wait_for_timeout(3000)

        new_item_btn = None
        for sel in [
            'button:has-text("New item")',
            'button:has-text("Add new item")',
            'button:has-text("New Item")',
            '[aria-label="New item"]',
            'button:has-text("Upload")',
        ]:
            btn = page.locator(sel).first
            if await btn.is_visible(timeout=2000):
                new_item_btn = btn
                print(f"  Found button: {sel}")
                break

        if not new_item_btn:
            # Try finding via JS
            found = await page.evaluate("""() => {
                const btns = document.querySelectorAll('button, a');
                for (const b of btns) {
                    const txt = b.textContent.trim().toLowerCase();
                    if (txt.includes('new item') || txt.includes('add new') || txt.includes('upload')) {
                        return b.textContent.trim();
                    }
                }
                return null;
            }""")
            if found:
                new_item_btn = page.locator(f'button:has-text("{found}"), a:has-text("{found}")').first
                print(f"  Found via JS: {found}")
            else:
                print("  'New Item' button not found")
                await page.screenshot(path="debug_cws_dashboard.png")
                print("  Screenshot: debug_cws_dashboard.png")
                # Maybe we need to navigate directly
                await page.goto("https://chrome.google.com/webstore/devconsole/register", wait_until="domcontentloaded")
                await page.wait_for_timeout(5000)
                await page.screenshot(path="debug_cws_register2.png")

        if new_item_btn:
            # Dismiss any overlay/modal first
            try:
                await page.evaluate("""() => {
                    // Close any modal overlays
                    const overlays = document.querySelectorAll('[class*="overlay"], [class*="IE5DDf"], [class*="Sx9Kwc"]');
                    overlays.forEach(o => { if (o.style) o.style.display = 'none'; });
                    // Click any dismiss/close buttons
                    const closeBtns = document.querySelectorAll('[aria-label="Close"], [aria-label="Dismiss"], button[jsname="j6LnOb"]');
                    closeBtns.forEach(b => b.click());
                }""")
                await page.wait_for_timeout(2000)
            except Exception:
                pass

            # Try force click or JS click
            try:
                await new_item_btn.click(force=True, timeout=5000)
            except Exception:
                await page.evaluate("""() => {
                    const btns = document.querySelectorAll('button');
                    for (const b of btns) {
                        if (b.textContent.trim().toLowerCase().includes('new item') ||
                            b.getAttribute('aria-label')?.toLowerCase().includes('new item')) {
                            b.click();
                            return true;
                        }
                    }
                    return false;
                }""")
            await page.wait_for_timeout(3000)
            print("  Clicked 'New Item'")

        # Upload ZIP file
        print("\n[3] Uploading extension ZIP...")
        file_input = page.locator('input[type="file"]').first
        if await file_input.count() > 0:
            await file_input.set_input_files(EXTENSION_ZIP)
            print(f"  ZIP uploaded: {os.path.basename(EXTENSION_ZIP)}")
        else:
            # Try drag-drop area or browse button
            browse_btn = page.locator('button:has-text("Browse"), button:has-text("Choose file")').first
            if await browse_btn.is_visible(timeout=3000):
                # This should trigger a file dialog — use file chooser
                async with page.expect_file_chooser() as fc_info:
                    await browse_btn.click()
                file_chooser = await fc_info.value
                await file_chooser.set_files(EXTENSION_ZIP)
                print(f"  ZIP uploaded via file chooser")
            else:
                print("  No file input found!")
                await page.screenshot(path="debug_cws_upload.png")

        # Wait for upload processing
        print("  Waiting for upload to process...")
        for i in range(30):
            await page.wait_for_timeout(3000)
            # Check for success message or next step
            body_text = (await page.text_content("body") or "").lower()
            if "successfully" in body_text or "uploaded" in body_text or "store listing" in body_text:
                print(f"  Upload complete! ({(i+1)*3}s)")
                break
            if "error" in body_text and "upload" in body_text:
                print(f"  Upload error detected")
                await page.screenshot(path="debug_cws_error.png")
                break
            if i % 5 == 0:
                print(f"  Still processing... ({(i+1)*3}s)")

        await page.wait_for_timeout(3000)
        await page.screenshot(path="debug_cws_after_upload.png")
        print("  Screenshot: debug_cws_after_upload.png")

        # Fill in Store Listing
        print("\n[4] Filling store listing...")

        # Description
        desc_field = page.locator('textarea[aria-label*="Description"], textarea[name*="description"], textarea#description').first
        if await desc_field.is_visible(timeout=3000):
            await desc_field.fill(DESCRIPTION)
            print("  Description filled")
        else:
            # Try contenteditable
            desc_editor = page.locator('[contenteditable="true"]').first
            if await desc_editor.is_visible(timeout=3000):
                await desc_editor.click()
                await page.keyboard.type(DESCRIPTION, delay=5)
                print("  Description typed")

        await page.wait_for_timeout(1000)

        # Category
        cat_select = page.locator('select:has(option:has-text("Productivity")), [aria-label*="Category"]').first
        if await cat_select.is_visible(timeout=2000):
            await cat_select.select_option(label="Productivity")
            print("  Category: Productivity")
        else:
            # Try clicking category dropdown
            cat_btn = page.locator('button:has-text("Category"), [role="listbox"]').first
            if await cat_btn.is_visible(timeout=2000):
                await cat_btn.click()
                await page.wait_for_timeout(1000)
                prod_opt = page.locator('text="Productivity"').first
                if await prod_opt.is_visible(timeout=2000):
                    await prod_opt.click()
                    print("  Category: Productivity")

        # Language
        lang_select = page.locator('select:has(option:has-text("English")), [aria-label*="Language"]').first
        if await lang_select.is_visible(timeout=2000):
            await lang_select.select_option(label="English")
            print("  Language: English")

        # Upload screenshots
        print("\n[5] Uploading screenshots...")
        screenshot_inputs = page.locator('input[type="file"][accept*="image"]')
        input_count = await screenshot_inputs.count()
        if input_count > 0:
            files = [SCREENSHOT1, SCREENSHOT2]
            existing = [f for f in files if os.path.exists(f)]
            if existing:
                await screenshot_inputs.first.set_input_files(existing)
                print(f"  Uploaded {len(existing)} screenshots")
        else:
            print("  Screenshot upload input not found — may need manual upload")

        await page.wait_for_timeout(2000)

        # Privacy policy
        privacy_field = page.locator('input[aria-label*="Privacy policy"], input[name*="privacy"], input[placeholder*="privacy"]').first
        if await privacy_field.is_visible(timeout=2000):
            await privacy_field.fill(PRIVACY_POLICY)
            print(f"  Privacy policy: {PRIVACY_POLICY}")

        # Single purpose description (required by Chrome Web Store)
        purpose_field = page.locator('textarea[aria-label*="single purpose"], textarea[name*="justification"]').first
        if await purpose_field.is_visible(timeout=2000):
            await purpose_field.fill("This extension converts the current website into an Android app by opening WebsiteToApp.app with the current URL pre-filled.")
            print("  Single purpose justification filled")

        await page.wait_for_timeout(2000)
        await page.screenshot(path="debug_cws_listing.png")
        print("  Screenshot: debug_cws_listing.png")

        # Save draft / Submit for review
        print("\n[6] Saving and submitting...")
        save_btn = page.locator('button:has-text("Save draft"), button:has-text("Save")').first
        if await save_btn.is_visible(timeout=3000):
            await save_btn.click()
            await page.wait_for_timeout(3000)
            print("  Draft saved")

        submit_btn = page.locator('button:has-text("Submit for review"), button:has-text("Publish")').first
        if await submit_btn.is_visible(timeout=3000):
            await submit_btn.click()
            await page.wait_for_timeout(5000)
            print("  Submitted for review!")
        else:
            print("  Submit button not found — may need manual submission")
            print("  Check the developer console and fill any missing fields")

        await page.screenshot(path="debug_cws_final.png")
        print("\n  Final screenshot: debug_cws_final.png")
        print("\nDone! Browser staying open for 2 minutes for manual adjustments.")
        await page.wait_for_timeout(120000)
        await browser.close()


asyncio.run(run())
