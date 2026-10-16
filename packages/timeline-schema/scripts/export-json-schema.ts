// Writes timeline.schema.json (consumed by apps/api). Run after changing src/index.ts.
import { writeFileSync } from "node:fs";
import { jsonSchema } from "../src/index.ts";

const out = new URL("../timeline.schema.json", import.meta.url);
writeFileSync(out, JSON.stringify(jsonSchema(), null, 2) + "\n");
console.log(`wrote ${out.pathname}`);
