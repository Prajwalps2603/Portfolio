// Keeps the QA tools' files on the project drive (drive C: once filled up with leftover browser
// profiles): screenshots default to ./.out, and the headless browser's throwaway profile goes to
// ./.out/tmp instead of %TEMP%. Import it before playwright-core. `.out` is git-ignored.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const OUT_DIR = fileURLToPath(new URL('./.out', import.meta.url));
const tmp = fileURLToPath(new URL('./.out/tmp', import.meta.url));
fs.mkdirSync(tmp, { recursive: true });
process.env.TEMP = tmp;
process.env.TMP = tmp;
