# Thomas's personal site

This is a standalone site: edit `index.html`, `assets/style.css`, and
`assets/scene.js` directly. Hugo copies it to `/~thomas-trenty/` without templates
or an extra build step. The photo is shared with Thomas's member card.

The decorative scene uses a locally bundled Three.js 0.186.0 (MIT; license in
`assets/vendor/THREE-LICENSE.txt`). It falls back to an SVG without JavaScript or
WebGL, respects reduced motion, and stops animating when offscreen or hidden.

To update the vendor bundle, install a pinned Three.js release and esbuild in a
temporary folder, then bundle Three's `build/three.module.js` with
`--bundle --minify --format=esm --legal-comments=inline` into
`assets/vendor/three.js`. Copy that release's license too. None of this is needed
to edit or publish the page normally.
