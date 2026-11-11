// Minimal static server for the exported site in ./out (used by `npm run preview`).
// Honors NEXT_PUBLIC_BASE_PATH so a GitHub Pages build (/Portfolio) can be previewed locally too.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.env.PORT || 4173);
const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".ktx2": "image/ktx2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

if (!fs.existsSync(root)) {
  console.error("No ./out folder. Run `npm run build` first.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (base) {
      if (urlPath !== base && !urlPath.startsWith(base + "/")) {
        const nf = path.join(root, "404.html");
        res.writeHead(404, { "Content-Type": types[".html"] });
        fs.existsSync(nf) ? fs.createReadStream(nf).pipe(res) : res.end("Not found");
        return;
      }
      urlPath = urlPath.slice(base.length) || "/";
    }
    let file = path.join(root, urlPath);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) file = path.join(root, "404.html");
    const status = file.endsWith("404.html") && !urlPath.includes("404") ? 404 : 200;
    res.writeHead(status, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving ./out at http://localhost:${port}${base || ""}/`));
