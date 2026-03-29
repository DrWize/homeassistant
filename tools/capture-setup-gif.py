"""Capture a walkthrough GIF of the setup wizard with sensitive data redacted."""
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

# ── Redaction scripts (run before specific screenshots) ──

REDACT_CONNECT = """
(function() {
  const t = document.getElementById('ha-token');
  if (t && t.value.length > 10) { t.type = 'text'; t.value = 'eyJhbG...REDACTED...Bw'; t.style.color = '#666'; }
  const h = document.getElementById('ha-host');
  if (h && h.value.match(/\\d+\\.\\d+\\.\\d+\\.\\d+/)) h.value = h.value.replace(/(\\d+\\.\\d+\\.\\d+\\.)\\d+/, '$1xx');
})();
"""

REDACT_MEDIA = """
(function() {
  // Blur personal names in media player labels and dropdowns
  document.querySelectorAll('.light-row input[type="text"], .light-row select').forEach(el => {
    const v = el.value || el.options?.[el.selectedIndex]?.text || '';
    // Redact names that look personal (contain possessives, usernames, real names)
    if (v.match(/joakim|sara|thisisme|plex.*chrome|plex.*cast|tab a9/i)) {
      if (el.tagName === 'INPUT') el.value = 'Media Device';
      if (el.tagName === 'SELECT') {
        const opt = el.options[el.selectedIndex];
        if (opt) opt.text = 'media_player.device';
      }
    }
  });
  // Also blur the label inputs that show personal device names
  document.querySelectorAll('input[type="text"]').forEach(inp => {
    const v = inp.value;
    if (v.match(/joakim|sara|thisisme|tab a9/i)) inp.value = 'Media Device';
    if (v.match(/Spotify.*[A-Z]/)) inp.value = 'Spotify Connect';
    if (v.match(/Plex.*thisisme/i)) inp.value = 'Plex Client';
  });
})();
"""

REDACT_OUTPUT = """
(function() {
  const el = document.getElementById('output');
  if (!el || el.textContent.length < 50) return;
  let t = el.textContent;
  // Redact Plex/Tautulli references
  t = t.replace(/sensor\\.plex_session_[a-z0-9_]+/g, 'sensor.plex_session_x_tautulli');
  t = t.replace(/sensor\\.tautulli_[a-z0-9_]+/g, 'sensor.tautulli_metric');
  // Redact personal media player labels
  t = t.replace(/(label: ')[^']*tab[^']*'/gi, "$1Tablet'");
  t = t.replace(/(label: ')[^']*joakim[^']*'/gi, "$1Media Device'");
  t = t.replace(/(label: ')[^']*sara[^']*'/gi, "$1Spotify Connect'");
  t = t.replace(/(label: ')[^']*thisisme[^']*'/gi, "$1Plex Client'");
  t = t.replace(/(label: ')[^']*Plex.*Chrome[^']*'/gi, "$1Plex Web'");
  t = t.replace(/(label: ')[^']*Plex.*Cast[^']*'/gi, "$1Plex Cast'");
  // Redact media_player entity IDs that contain personal names
  t = t.replace(/media_player\.[a-z0-9_]*joakim[a-z0-9_]*/gi, 'media_player.device');
  t = t.replace(/media_player\.[a-z0-9_]*plex[a-z0-9_]*/gi, 'media_player.plex_client');
  el.textContent = t;
})();
"""


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
        frames.append(await capture(page, "step1-filled", REDACT_CONNECT))

        # Click Connect — re-fill real values since redaction changed them
        print("  Connecting...")
        await page.fill('#ha-host', HA_HOST)
        await page.fill('#ha-token', HA_TOKEN)
        await page.click('button:has-text("Connect")')
        await page.wait_for_timeout(5000)
        frames.append(await capture(page, "step1-connected", REDACT_CONNECT))

        # ── Step 2: Rooms ──
        print("Step 2: Rooms...")
        await page.wait_for_timeout(1000)
        frames.append(await capture(page, "step2-rooms-top"))

        await page.evaluate("window.scrollTo(0, 600)")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step2-rooms-bottom"))

        # ── Step 3: Media Players ──
        print("Step 3: Media Players...")
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(300)
        await page.evaluate("goStep(3)")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step3-media", REDACT_MEDIA))

        # ── Step 4: Integrations ──
        print("Step 4: Integrations...")
        await page.evaluate("goStep(4)")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step4-integrations"))

        # ── Step 5: Generate ──
        print("Step 5: Generate output...")
        await page.evaluate("generateOutput()")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step5-output-top", REDACT_OUTPUT))

        await page.evaluate("window.scrollTo(0, 400)")
        await page.wait_for_timeout(500)
        frames.append(await capture(page, "step5-output-bottom", REDACT_OUTPUT))

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


async def capture(page, name, redact=None):
    if redact:
        await page.evaluate(redact)
    path = SCREENSHOT_DIR / f"_tmp_setup_{name}.png"
    await page.screenshot(path=str(path))
    return path


if __name__ == "__main__":
    asyncio.run(main())
