#!/usr/bin/env python3
"""Pllato HTML -> PDF renderer (Chromium via Playwright, preinstalled browser)."""
import sys, pathlib
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

def render(html_path, pdf_path):
    url = "file://" + str(pathlib.Path(html_path).resolve())
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        pg = b.new_page()
        pg.goto(url, wait_until="networkidle")
        pg.emulate_media(media="print")
        pg.pdf(path=pdf_path, format="A4", print_background=True,
               margin={"top":"0","right":"0","bottom":"0","left":"0"})
        b.close()
    print("rendered", pdf_path)

def shots(html_path, ids, prefix, w=1180, h=900):
    url = "file://" + str(pathlib.Path(html_path).resolve())
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        pg = b.new_page(viewport={"width":w,"height":h}, device_scale_factor=2)
        pg.goto(url, wait_until="networkidle"); pg.wait_for_timeout(400)
        for sid in ids:
            el = pg.query_selector("#"+sid)
            if el: el.screenshot(path=f"{prefix}_{sid}.png"); print("shot", sid)
        b.close()

if __name__ == "__main__":
    if sys.argv[1] == "pdf":
        render(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "shots":
        shots(sys.argv[2], sys.argv[4:], sys.argv[3])
