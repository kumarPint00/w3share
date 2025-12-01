Script: strip_line_comments.js

Destructive utility that removes all // line comments from JS/TS/JSON/JSX/TSX files in-place, skipping common build and vendor dirs.

Usage:

node scripts/strip_line_comments.js /home/ravi/dogeFull

Notes:
- Skips node_modules, dist, build, out, coverage, .git, .next, artifacts, cache, etc.
- Uses a conservative parser to avoid // inside strings and http(s):// URLs.
- Commit your work before running.
