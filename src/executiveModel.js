import { analyseTracerCommodity } from "./facilityTracerAnalysis.js";

const number = (value) => typeof value === "number" && Number.isFinite(value);
export const STOCK_GROUPS = [
  { key: "stockout", label: "Stockout", color: "#d71920" },
  { key: "low", label: "Low stock", color: "#db980b" },
  { key: "adequate", label: "According to plan", color: "#078b79" },
  { key: "excess", label: "Above plan", color: "#287fc0" },
  { key: "gap", label: "Data gap", color: "#87928e" },
];

export function summaryStockMix(summary) {
  const values = [summary.stockout, (summary.nearCritical || 0) + (summary.understocked || 0), summary.accordingToPlan,
    (summary.abovePlan || 0) + (summary.overstock || 0), summary.dataGap].map((value) => Math.max(0, Number(value) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  return STOCK_GROUPS.map((group, index) => ({ ...group, count: values[index], rate: total ? values[index] / total : null }));
}

function completeSum(rows, key) {
  return rows.length && rows.every((row) => number(row[key]) && row[key] >= 0)
    ? rows.reduce((sum, row) => sum + row[key], 0) : null;
}

export function medicineSummaries(sourceRows, previousRows = []) {
  const groups = new Map();
  for (const row of sourceRows) {
    const key = JSON.stringify([row.item, row.programme || "Unspecified"]);
    if (!groups.has(key)) groups.set(key, { key, name: row.item, programme: row.programme || "Unspecified", details: [] });
    groups.get(key).details.push(analyseTracerCommodity(row));
  }
  const previous = previousRows.length ? new Map(medicineSummaries(previousRows).map((row) => [row.key, row])) : new Map();
  return [...groups.values()].map((group) => {
    const known = group.details.filter((row) => number(row.quantity) && row.quantity >= 0);
    const quantity = completeSum(group.details, "quantity");
    const amc = completeSum(group.details, "amc");
    const availability = known.length ? known.filter((row) => row.quantity > 0).length / known.length : null;
    const stockouts = group.details.filter((row) => row.status === "Confirmed stock-out").length;
    const low = group.details.filter((row) => ["Critical low stock", "Low stock"].includes(row.status)).length;
    const gaps = group.details.filter((row) => row.status === "Data-quality exception").length;
    const excess = group.details.filter((row) => row.status === "Overstocked").length;
    const before = previous.get(group.key);
    return { ...group, quantity, amc, availability, stockouts, low, gaps, excess, mos: number(quantity) && number(amc) && amc > 0 ? quantity / amc : null,
      change: number(before?.availability) && number(availability) ? (availability - before.availability) * 100 : null };
  }).sort((a, b) => b.stockouts - a.stockouts || b.low - a.low || b.gaps - a.gaps || a.name.localeCompare(b.name));
}

export function exportMedicineCsv(rows) {
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const values = [["Medicine", "Programme", "Availability (%)", "SOH", "AMC", "Calculated MOS", "Stockout reporting units", "Low-stock reporting units", "Data gaps", "Change (percentage points)"],
    ...rows.map((row) => [row.name, row.programme, number(row.availability) ? (row.availability * 100).toFixed(1) : "", row.quantity, row.amc,
      number(row.mos) ? row.mos.toFixed(2) : "", row.stockouts, row.low, row.gaps, number(row.change) ? row.change.toFixed(1) : ""])];
  return values.map((row) => row.map(cell).join(",")).join("\r\n");
}
