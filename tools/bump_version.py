#!/usr/bin/env python3
"""Stamp a new cache-busting version on the site.

- Adds/updates ?v=<version> on every local CSS, JS and image URL in index.html
- Updates SITE_VERSION in index.html and writes version.json
Run automatically by .githooks/pre-commit, or by hand: python3 tools/bump_version.py
"""
import json, re, time, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
version = time.strftime('%Y%m%d%H%M%S')

html_path = root / 'index.html'
html = html_path.read_text()

asset = re.compile(r'((?:src|href|srcset)=")((?!https?:|//|#|mailto:|data:)[^"?]+\.(?:css|js|png|jpe?g|webp|svg|avif))(?:\?v=[^"]*)?(")')
html = asset.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={version}{m.group(3)}', html)
html = re.sub(r'(var SITE_VERSION = ")[^"]*(")', rf'\g<1>{version}\g<2>', html)

html_path.write_text(html)
(root / 'version.json').write_text(json.dumps({'version': version}) + '\n')
print(f'Site version {version}')
