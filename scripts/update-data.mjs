import fs from "node:fs/promises";

const url = "https://madererafrouxeira.com/compramos-madera-precio-del-eucalipto/";
const html = await (await fetch(url)).text();
const updated = html.match(/Actualizado:\s*([^.<]+)/i)?.[1]?.trim();
const rows = [...html.matchAll(/Eucalipto\s+(glóbulus|globulus|nitens)[\s\S]{0,180}?(Mayor|Menor) de 35 cm[\s\S]{0,120}?([0-9]+)\s*[–-]\s*([0-9]+)\s*€\/?Tm/gi)];
if (!updated || rows.length < 4) throw new Error("No se ha podido reconocer la tabla de precios de la fuente");
const parsed = { globulus: {}, nitens: {} };
for (const [, rawSpecies, size, low, high] of rows) {
  if (!size.toLowerCase().startsWith("mayor")) continue;
  parsed[rawSpecies.toLowerCase().replace("glóbulus", "globulus")].large = { low: Number(low), high: Number(high) };
}
const current = JSON.parse(await fs.readFile("data/prices.json", "utf8"));
current.lastChecked = new Date().toISOString().slice(0, 10);
current.updateStatus = "success";
const isoDate = updated.match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/i);
const months = { enero:"01", febrero:"02", marzo:"03", abril:"04", mayo:"05", junio:"06", julio:"07", agosto:"08", septiembre:"09", octubre:"10", noviembre:"11", diciembre:"12" };
if (isoDate) current.lastUpdated = `${isoDate[3]}-${months[isoDate[2].toLowerCase()]}-${isoDate[1].padStart(2,"0")}`;
current.prices = parsed;
current.primarySourceId = "frouxeira-2026-09";
await fs.writeFile("data/prices.json", JSON.stringify(current, null, 2) + "\n");
console.log(`Actualizado desde ${url}: ${updated}`);
