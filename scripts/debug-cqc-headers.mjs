// Show the first 30 rows of the Providers sheet
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import yauzl from "yauzl";
import sax from "sax";

const CQC_ODS_URL =
  "https://www.cqc.org.uk/sites/default/files/2026-04/01_April_2026_Latest_ratings.ods";
const tmp = join(tmpdir(), "cqc_debug.ods");

console.log("Downloading…");
const res = await fetch(CQC_ODS_URL, { headers: { "User-Agent": "MedRoles/1.0" } });
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(tmp, buf);

await new Promise((resolve, reject) => {
  yauzl.open(tmp, { lazyEntries: true }, (err, zip) => {
    if (err) return reject(err);
    zip.readEntry();
    zip.on("entry", (entry) => {
      if (entry.fileName !== "content.xml") return zip.readEntry();
      zip.openReadStream(entry, (err2, stream) => {
        if (err2) return reject(err2);

        const parser = sax.createStream(true, {});
        let inProvidersSheet = false;
        let rowIdx = 0;
        let cells = [], inText = false, cellText = "", repeatCount = 1;
        let headers = null;

        parser.on("opentag", (node) => {
          if (node.name === "table:table") {
            inProvidersSheet = node.attributes["table:name"] === "Providers";
            rowIdx = 0; headers = null;
          } else if (!inProvidersSheet) return;
          else if (node.name === "table:table-row") { cells = []; }
          else if (node.name === "table:table-cell" || node.name === "table:covered-table-cell") {
            repeatCount = parseInt(node.attributes["table:number-columns-repeated"] ?? "1", 10);
            cellText = ""; inText = false;
          } else if (node.name === "text:p") inText = true;
        });

        parser.on("text", (t) => { if (inText && inProvidersSheet) cellText += t; });

        parser.on("closetag", (n) => {
          if (!inProvidersSheet) return;
          if (n === "text:p") {
            inText = false;
          } else if (n === "table:table-cell" || n === "table:covered-table-cell") {
            for (let i = 0; i < Math.min(repeatCount, 2); i++) cells.push(cellText);
            cellText = ""; repeatCount = 1;
          } else if (n === "table:table-row") {
            if (rowIdx === 0) {
              headers = cells.slice();
              console.log("Headers:", headers.map((h, i) => `[${i}]${h}`).join(", "));
            } else if (rowIdx <= 30) {
              const obj = {};
              headers.forEach((h, i) => { if (cells[i]?.trim()) obj[h] = cells[i]; });
              console.log(`Row ${rowIdx}:`, JSON.stringify(obj));
            } else {
              stream.destroy();
              resolve();
            }
            rowIdx++;
          }
        });

        parser.on("error", (e) => {
          if (e.message?.includes("premature")) return resolve();
          reject(e);
        });
        parser.on("end", resolve);
        stream.pipe(parser);
      });
    });
    zip.on("error", reject);
  });
});

if (existsSync(tmp)) unlinkSync(tmp);
