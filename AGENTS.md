# Repository image rules

- The numbered images in `images/` (`i1.png`, `i2.jpg`, and so on) are homepage thumbnails. Use the next unused `i<number>.<ext>` name for a new thumbnail and update its entry in `src/_data/homepage.yml`.
- Every numbered thumbnail has a 512 × 320 pixel canvas (16:10), matching the desktop card frame. Raster files must be exactly 512 × 320. For an animated GIF, this is the logical screen size; keep its frames and timing. For an SVG, set `width="512" height="320"` and a 16:10 `viewBox`.
- Fill the canvas without stretching the image. Crop around the subject when the source aspect ratio differs. Keep important text and controls visible; check the result at card size and in the narrow square card layout.
- Keep files small without making text or diagrams hard to read. Use JPEG for photographic images, PNG for screenshots or graphics, GIF only for animation, and SVG for vector art. Remove unnecessary metadata. Check dimensions with `magick identify` and run `npm run build` after updating a thumbnail.
