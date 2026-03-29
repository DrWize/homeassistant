"""Capture a walkthrough GIF of the setup wizard."""
import asyncio
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5502"
SCREENSHOT_DIR = Path(__file__).parent.parent / "screenshots"
VIEWPORT = {"width": 1024, "height": 768}
FRAME_DURATION_MS = 3000  # 3 seconds per frame

# Read token from config.js
CONFIG = Path(__file__).parent.parent / "config.js"
HA_HOST = ""
HA_TOKEN = ""
for line in CONFIG.read_text().splitlines():
    if line.strip().startswith("//"):
        continue
    if "HA_HOST" in line and "'" in line:
        HA_HOST = line.split("'")[1]
    if "HA_TOKEN" in line and "'" in line:
        HA_TOKEN = line.split("'")[1]


async def main():
    SCREENSHOT_DIR.mkdir(exist_ok=True)
    frames = []

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport=VIEWPORT)

        # ── Step 1: Connect page ──
        print("Step 1: Connect page...")
        await page.goto(f"{BASE_URL}/tools/setup.html", wait_until="networkidle")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step1-empty"))

        # Fill in credentials
        print("  Filling host and token...")
        await page.fill('#ha-host', HA_HOST)
        await page.fill('#ha-token', HA_TOKEN)
        frames.append(await capture(page, "step1-filled"))

        # Click Connect
        print("  Connecting...")
        await page.click('button:has-text("Connect")')
        await page.wait_for_timeout(4000)  # wait for WS + entity discovery
        frames.append(await capture(page, "step1-connected"))

        # ── Step 2: Rooms ──
        print("Step 2: Rooms...")
        await page.wait_for_timeout(1000)
        frames.append(await capture(page, "step2-rooms-top"))

        # Scroll down to see more rooms
        await page.evaluate("window.scrollTo(0, 600)")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step2-rooms-bottom"))

        # ── Step 3: Media Players ──
        print("Step 3: Media Players...")
        await page.evaluate("window.scrollTo(0, 0)")
        await page.click('button:has-text("Next: Media Players")')
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step3-media"))

        # ── Step 4: Integrations ──
        print("Step 4: Integrations...")
        await page.click('button:has-text("Next: Integrations")')
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step4-integrations"))

        # ── Step 5: Generate ──
        print("Step 5: Generate output...")
        await page.click('button:has-text("Generate entities.js")')
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step5-output-top"))

        # Scroll to see more of the output
        await page.evaluate("window.scrollTo(0, 400)")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step5-output-bottom"))

        await browser.close()

    # Build GIF
    gif_path = SCREENSHOT_DIR / "setup-wizard-demo.gif"
    pil_frames = [Image.open(f).convert("RGBA") for f in frames]
    pil_frames[0].save(
        str(gif_path),
        save_all=True,
        append_images=pil_frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        optimize=True,
    )
    print(f"\n-> {gif_path} ({gif_path.stat().st_size // 1024} KB)")

    # Clean up temp files
    for f in frames:
        f.unlink(missing_ok=True)

    print("Done!")


async def capture(page, name):
    path = SCREENSHOT_DIR / f"_tmp_setup_{name}.png"
    await page.screenshot(path=str(path))
    return path


if __name__ == "__main__":
    asyncio.run(main())
