// Next exports segment payloads as nested folders (e.g. __next.work/$d$slug/__PAGE__.txt) on some platforms,
// while the client requests the flat dotted name (__next.work.$d$slug.__PAGE__.txt). Add the flat copies.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("out");
let n = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("__next.")) flat(p, e.name, dir);
    else walk(p);
  }
}
function flat(p, prefix, outDir) {
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const q = path.join(p, e.name);
    const name = `${prefix}.${e.name}`;
    if (e.isDirectory()) flat(q, name, outDir);
    else { fs.copyFileSync(q, path.join(outDir, name)); n++; }
  }
}
walk(root);
console.log(`flatten-rsc: ${n} files`);
