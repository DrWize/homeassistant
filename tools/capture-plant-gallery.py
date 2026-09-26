"""Build red/yellow/green plant-status screenshots for every dashboard theme.

The generator is intentionally configuration-free: themes are discovered from
``*-dashboard.html`` files and plants from ``assets/plant-status/<theme>``.
It serves a temporary, mock Home Assistant configuration locally, so no token or
running Home Assistant instance is needed.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import threading
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from PIL import Image, ImageDraw, ImageFont

try:
    from playwright.async_api import async_playwright
except ImportError as exc:  # pragma: no cover - friendly CLI failure
    raise SystemExit(
        "Playwright is required. Install it with: py -m pip install playwright\n"
        "The script uses your installed Google Chrome; no browser download is needed."
    ) from exc


ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = ROOT / "assets" / "plant-status"
OUTPUT_ROOT = ROOT / "screenshots" / "plant-examples"
VIEWPORT = {"width": 1280, "height": 800}
STATES = (
    ("green", "ok", "HEALTHY", "ALL BOTANICAL PARAMETERS ARE WITHIN NORMAL RANGE."),
    ("yellow", "warning", "WARNING", "ONE BOTANICAL PARAMETER REQUIRES ATTENTION."),
    ("red", "critical", "CRITICAL", "MULTIPLE BOTANICAL PARAMETERS REQUIRE IMMEDIATE ATTENTION."),
)


def discover_catalog() -> dict[str, dict[str, Path]]:
    """Return themes and complete three-state plant artwork sets."""
    catalog: dict[str, dict[str, Path]] = {}
    for dashboard in sorted(ROOT.glob("*-dashboard.html")):
        theme = dashboard.name.removesuffix("-dashboard.html")
        theme_assets = ASSET_ROOT / theme
        if not theme_assets.is_dir():
            continue
        plants: dict[str, Path] = {}
        for plant_dir in sorted(path for path in theme_assets.iterdir() if path.is_dir()):
            slug = plant_dir.name
            if all(any(plant_dir.glob(f"{slug}-{variant}.*")) for variant in ("ok", "not-ok", "bad")):
                canonical = "pilea" if slug == "plant-1" else slug
                plants[canonical] = plant_dir
        if plants:
            catalog[theme] = plants
    return catalog


def mock_entities(plants: list[str]) -> bytes:
    entries = []
    for slug in plants:
        image_set = "plant-1" if slug == "pilea" else slug
        entity_slug = re.sub(r"[^a-z0-9_]+", "_", slug.lower())
        entries.append(
            {
                "entity": f"plant.gallery_{entity_slug}",
                "label": slug.replace("-", " ").title(),
                "imageSet": image_set,
                "sensors": {
                    "moisture": f"sensor.gallery_{entity_slug}_moisture",
                    "temperature": f"sensor.gallery_{entity_slug}_temperature",
                    "humidity": f"sensor.gallery_{entity_slug}_humidity",
                    "illuminance": f"sensor.gallery_{entity_slug}_illuminance",
                    "vpd": f"sensor.gallery_{entity_slug}_vpd",
                    "dli24h": f"sensor.gallery_{entity_slug}_dli",
                    "battery": f"sensor.gallery_{entity_slug}_battery",
                },
            }
        )
    payload = {
        "rooms": [
            {
                "id": "gallery",
                "name": "Gallery",
                "sensors": {"temp": None, "humidity": None, "lux": None},
                "lights": [],
                "power": [],
            }
        ],
        "mediaPlayers": [],
        "integrations": {
            "sun": None,
            "outsideTemp": None,
            "outsideLux": None,
            "outsideTemp24h": None,
            "weather": None,
            "nordpool": None,
            "nordpoolExtra": None,
            "nordpool48h": None,
            "tautulli": None,
            "washer": None,
            "plants": entries,
        },
    }
    return f"const ENTITIES = {json.dumps(payload)};\n".encode()


def make_handler(plants: list[str]):
    entities = mock_entities(plants)
    config = (
        "const HA_HOST='127.0.0.1:9';"
        "const HA_TOKEN='plant-gallery';"
        "const DEV_MODE=false;"
        "const HA_WS='ws://127.0.0.1:9/api/websocket';"
        "const HA_BASE='http://127.0.0.1:9';\n"
    ).encode()

    class GalleryHandler(SimpleHTTPRequestHandler):
        def log_message(self, _format: str, *_args) -> None:
            return

        def do_GET(self) -> None:  # noqa: N802 - stdlib hook name
            path = unquote(urlparse(self.path).path)
            if path.endswith("/config.js") or path == "/config.js":
                return self._send_bytes(config, "text/javascript; charset=utf-8")
            if path.endswith("/entities.js") or path == "/entities.js":
                return self._send_bytes(entities, "text/javascript; charset=utf-8")
            if path.startswith("/local/plant-status/"):
                relative = Path(path.removeprefix("/local/plant-status/"))
                candidate = ASSET_ROOT / relative
                if not candidate.is_file() and len(relative.parts) == 2:
                    theme, filename = relative.parts
                    match = re.match(r"(.+?)-(not-ok|ok|bad)\.(webp|png)$", filename)
                    if match:
                        candidate = ASSET_ROOT / theme / match.group(1) / filename
                if candidate.is_file() and candidate.resolve().is_relative_to(ASSET_ROOT.resolve()):
                    return self._send_bytes(candidate.read_bytes(), f"image/{candidate.suffix[1:]}")
                self.send_error(404)
                return
            super().do_GET()

        def _send_bytes(self, data: bytes, content_type: str) -> None:
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

    return GalleryHandler


@contextmanager
def local_server(plants: list[str]):
    handler = make_handler(plants)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    previous = Path.cwd()
    try:
        # SimpleHTTPRequestHandler serves the process working directory.
        import os

        os.chdir(ROOT)
        thread.start()
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        thread.join(timeout=5)
        os.chdir(previous)


def contact_sheet(frames: list[Path], output: Path, theme: str, plant: str) -> None:
    images = [Image.open(path).convert("RGB") for path in frames]
    width = sum(image.width for image in images)
    header_height = 58
    height = max(image.height for image in images) + header_height
    sheet = Image.new("RGB", (width, height), "#0b0d10")
    draw = ImageDraw.Draw(sheet)
    font_path = Path("C:/Windows/Fonts/segoeuib.ttf")
    font = ImageFont.truetype(str(font_path), 24) if font_path.exists() else ImageFont.load_default()
    x = 0
    for image, (color, _severity, label, _report) in zip(images, STATES):
        sheet.paste(image, (x, header_height))
        draw.rectangle((x, 0, x + image.width, header_height), fill={
            "green": "#167d4a", "yellow": "#9a6b00", "red": "#9d2929"
        }[color])
        title = f"{theme.upper()}  ·  {plant.replace('-', ' ').upper()}  ·  {label}"
        draw.text((x + 20, 14), title, fill="white", font=font)
        x += image.width
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, optimize=True)
    for image in images:
        image.close()


async def capture(args: argparse.Namespace, catalog: dict[str, dict[str, Path]]) -> None:
    selected_themes = [theme for theme in catalog if not args.theme or theme in args.theme]
    all_plants = sorted({plant for theme in selected_themes for plant in catalog[theme]})
    selected_plants = [plant for plant in all_plants if not args.plant or plant in args.plant]
    if not selected_themes or not selected_plants:
        raise SystemExit("No matching complete theme/plant artwork sets were found.")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    generated: list[dict[str, str]] = []
    with local_server(all_plants) as base_url:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(channel="chrome", headless=True)
            page = await browser.new_page(viewport=VIEWPORT, device_scale_factor=1)
            page.on("dialog", lambda dialog: asyncio.create_task(dialog.dismiss()))

            for theme in selected_themes:
                dashboard = f"{theme}-dashboard.html"
                for plant in selected_plants:
                    if plant not in catalog[theme]:
                        continue
                    print(f"{theme:10} {plant:14}", end=" ", flush=True)
                    await page.goto(f"{base_url}/{dashboard}", wait_until="domcontentloaded")
                    await page.wait_for_timeout(900)
                    tab_id = await page.evaluate(
                        "() => document.getElementById('page-plants') ? 'plants' : "
                        "(document.getElementById('page-bioscan') ? 'bioscan' : null)"
                    )
                    if not tab_id:
                        print("SKIP (no plant tab)")
                        continue
                    await page.evaluate("tab => window.switchTab(tab)", tab_id)
                    entity = f"plant.gallery_{re.sub(r'[^a-z0-9_]+', '_', plant.lower())}"
                    opened = await page.evaluate(
                        """entity => {
                          const page = document.querySelector('.page.active') ||
                            document.getElementById('page-plants') || document.getElementById('page-bioscan');
                          const card = [...page.querySelectorAll('button')].find(button =>
                            [...button.attributes].some(attr =>
                              attr.name.startsWith('data-') && attr.name.endsWith('-entity') && attr.value === entity));
                          if (!card) return false;
                          card.click();
                          return true;
                        }""",
                        entity,
                    )
                    if not opened:
                        print("SKIP (no card)")
                        continue
                    await page.wait_for_timeout(250)
                    dialog = page.locator("dialog[open]")
                    await dialog.wait_for(state="visible")
                    frames: list[Path] = []
                    for color, severity, label, report in STATES:
                        await page.evaluate(
                            r"""({severity, label, report}) => {
                              const dialog = document.querySelector('dialog[open]');
                              const stateHost = [...dialog.querySelectorAll('*')].find(el =>
                                ['offline','ok','warning','critical'].some(name => el.classList.contains(name)));
                              if (stateHost) {
                                stateHost.classList.remove('offline','ok','warning','critical');
                                stateHost.classList.add(severity);
                              }
                              const image = dialog.querySelector('img');
                              const variant = severity === 'critical' ? 'bad' : severity === 'ok' ? 'ok' : 'not-ok';
                              if (image) image.src = image.src.replace(/-(?:not-ok|ok|bad)\.(webp|png)(?:\?.*)?$/, `-${variant}.$1`);
                              const state = dialog.querySelector('[role="status"]');
                              if (state) state.textContent = label;
                              const reportNode = dialog.querySelector('[id*="report"]');
                              if (reportNode) reportNode.textContent = report;
                              const values = {moisture:'48.0 %',temperature:'22.4 °C',humidity:'52 %',illuminance:'860 lx',vpd:'1.18 kPa',dli:'8.42 mol/d⋅m²',battery:'94 %'};
                              for (const [key, value] of Object.entries(values)) {
                                const node = dialog.querySelector(`[id$="-${key}"]`);
                                if (node) node.textContent = value;
                              }
                              document.querySelectorAll('.toast,.theme-switcher').forEach(el => el.style.display = 'none');
                            }""",
                            {"severity": severity, "label": label, "report": report},
                        )
                        await page.wait_for_function(
                            "() => { const image=document.querySelector('dialog[open] img'); return !image || image.complete; }"
                        )
                        frame = OUTPUT_ROOT / f"._{theme}-{plant}-{color}.png"
                        await dialog.screenshot(path=str(frame), animations="disabled")
                        frames.append(frame)
                        print(color[0].upper(), end="", flush=True)
                    output = OUTPUT_ROOT / f"{theme}-{plant}.png"
                    contact_sheet(frames, output, theme, plant)
                    for frame in frames:
                        frame.unlink(missing_ok=True)
                    generated.append({"theme": theme, "plant": plant, "file": output.name})
                    print(f"  {output.relative_to(ROOT)}")
            await browser.close()

    manifest = {"generated": generated, "states": [state[0] for state in STATES]}
    (OUTPUT_ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"\nCreated {len(generated)} contact sheet(s) in {OUTPUT_ROOT.relative_to(ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--theme", action="append", help="Capture only this theme (repeatable).")
    parser.add_argument("--plant", action="append", help="Capture only this plant slug (repeatable).")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    asyncio.run(capture(args, discover_catalog()))


if __name__ == "__main__":
    main()
