/**
 * Patches @initia/interwovenkit-react/dist/index.js to remove the
 * `useEffectEvent` import from 'react'. Webpack's static ESM analysis
 * cannot detect it through react/index.js's conditional require() and
 * replaces it with undefined at bundle time.
 *
 * We provide a compatible polyfill using stable React hooks instead.
 * Re-run automatically via postinstall.
 */
const fs = require("fs");
const path = require("path");

const target = path.resolve(
  __dirname,
  "../node_modules/@initia/interwovenkit-react/dist/index.js"
);

let src = fs.readFileSync(target, "utf8");

// Already patched?
if (src.includes("/* ik-patched */")) {
  console.log("patch-ik: already applied, skipping.");
  process.exit(0);
}

// Remove useEffectEvent from the import line and inject a polyfill below it.
// Aliases from the import: Je=useRef, G=useEffect, Se=useCallback
const OLD_IMPORT =
  "useEffectEvent as fn, ";
const NEW_IMPORT = "";

const POLYFILL = `\n/* ik-patched */\nvar fn = function useEffectEventPolyfill(callback) {\n  var ref = Je(callback);\n  G(function() { ref.current = callback; });\n  return Se(function() { return ref.current.apply(this, arguments); }, []);\n};\n`;

if (!src.includes(OLD_IMPORT)) {
  console.log("patch-ik: pattern not found — may already be fixed upstream.");
  process.exit(0);
}

src = src.replace(OLD_IMPORT, NEW_IMPORT);

// Insert polyfill after the first import statement (line 9)
const firstImportEnd = src.indexOf('from "react";') + 'from "react";'.length;
src = src.slice(0, firstImportEnd) + POLYFILL + src.slice(firstImportEnd);

fs.writeFileSync(target, src);
console.log("patch-ik: applied useEffectEvent polyfill to interwovenkit-react.");
