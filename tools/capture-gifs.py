"""Capture screenshots of each tab for every theme and create demo GIFs."""
import asyncio
import os
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5502"
SCREENSHOT_DIR = Path(__file__).parent.parent / "screenshots"
VIEWPORT = {"width": 1280, "height": 800}
DEFAULT_TABS = ["systems", "controls", "data", "media", "sensors"]
THEMES = {
    "lcars":   ("lcars-dashboard.html",   DEFAULT_TABS),
    "pipboy":  ("pipboy-dashboard.html",  ["stat", "items", "data", "media", "vault"]),
    "c64":     ("c64-dashboard.html",     DEFAULT_TABS),
    "matrix":  ("matrix-dashboard.html",  DEFAULT_TABS),
    "weyland": ("weyland-dashboard.html", DEFAULT_TABS),
    "diablo":  ("diablo-dashboard.html",  DEFAULT_TABS),
    "winamp":  ("winamp-dashboard.html",  ["playlist", "controls", "eq", "media", "vis"]),
}
FRAME_DURATION_MS = 2000  # 2 seconds per tab


async def capture_theme(page, theme_name, html_file, tab_ids):
    """Navigate to a theme dashboard, capture each tab as a screenshot."""
    url = f"{BASE_URL}/{html_file}"
    print(f"\n--- {theme_name.upper()} ---")
    await page.goto(url, wait_until="networkidle")
    await page.wait_for_timeout(6000)  # let WS data load

    frames = []
    for tab_id in tab_ids:
        print(f"  Tab: {tab_id}")
        await page.evaluate(f"switchTab('{tab_id}')")
        await page.wait_for_timeout(1500)  # let render settle

        path = SCREENSHOT_DIR / f"_tmp_{theme_name}_{tab_id}.png"
        await page.screenshot(path=str(path))
        frames.append(Image.open(path).convert("RGBA"))

    # Build GIF
    gif_path = SCREENSHOT_DIR / f"{theme_name}-demo.gif"
    frames[0].save(
        str(gif_path),
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        optimize=True,
    )
    print(f"  -> {gif_path} ({gif_path.stat().st_size // 1024} KB)")

    # Clean up temp PNGs
    for tab_id in tab_ids:
        tmp = SCREENSHOT_DIR / f"_tmp_{theme_name}_{tab_id}.png"
        tmp.unlink(missing_ok=True)


async def main():
    SCREENSHOT_DIR.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport=VIEWPORT)

        for theme_name, (html_file, tab_ids) in THEMES.items():
            await capture_theme(page, theme_name, html_file, tab_ids)

        await browser.close()

    print("\nDone! All GIFs created.")


if __name__ == "__main__":
    asyncio.run(main())
