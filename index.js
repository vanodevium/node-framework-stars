import "dotenv/config";

import { readFile, writeFile } from "fs/promises";
import buildReadme from "framework-stars";

const LANG = 'Node.js';
const TOKEN = process.env.TOKEN;

await readFile("./repos.lst", "utf8")
  .then((list) => list.split("\n").filter(Boolean))
  .then((frameworks) => buildReadme(frameworks, LANG, TOKEN))
  .then((readme) => writeFile("README.MD", readme));
