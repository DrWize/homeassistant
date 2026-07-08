"""Retake system screenshots for every dashboard using headless Playwright."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5502"
SCREENSHOT_DIR = Path(__file__).parent.parent / "screenshots"
VIEWPORT = {"width": 1280, "height": 800}
THEMES = {
    "lcars":   "lcars-dashboard.html",
    "pipboy":  "pipboy-dashboard.html",
    "c64":     "c64-dashboard.html",
    "matrix":  "matrix-dashboard.html",
    "weyland": "weyland-dashboard.html",
    "diablo":  "diablo-dashboard.html",
    "winamp":  "winamp-dashboard.html",
    "t2":      "t2-dashboard.html",
}


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport=VIEWPORT)

        for name, html in THEMES.items():
            print(f"  {name}...", end=" ")
            await page.goto(f"{BASE_URL}/{html}", wait_until="networkidle")
            await page.wait_for_timeout(6000)
            await page.evaluate("switchTab('systems')")
            await page.wait_for_timeout(1500)
            path = SCREENSHOT_DIR / f"{name}-systems.png"
            await page.screenshot(path=str(path))
            print(f"{path.stat().st_size // 1024} KB")

        await browser.close()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
