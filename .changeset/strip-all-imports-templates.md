---
"@commercejs/nuxt": patch
---

Strip ALL imports from handler templates generated in .nuxt/ and
rely entirely on Nitro's auto-import system. Templates in .nuxt/
receive auto-imports unlike files in node_modules/.
