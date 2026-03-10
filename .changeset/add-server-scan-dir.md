---
"@commercejs/nuxt": patch
---

Use addServerScanDir instead of manual addTemplate + addServerHandler.
This tells Nitro to treat the package's runtime/server/ directory as
the app's own server/ directory, enabling full auto-import injection
and auto route discovery. Handler source files have no imports and
rely entirely on auto-imports.
