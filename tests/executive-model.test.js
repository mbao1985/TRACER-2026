import test from "node:test";
import assert from "node:assert/strict";
import { exportMedicineCsv, medicineSummaries, summaryStockMix } from "../src/executiveModel.js";

const row = (quantity, amc, extra = {}) => ({ item: "Amoxicillin", programme: "EMMS", province: "Lusaka", facility: "Test unit", quantity, amc, mos: 0, ...extra });
test("local stockouts remain visible even when total stock is positive", () => {
  const [medicine] = medicineSummaries([row(0, 20), row(100, 20, { facility: "Other unit" })]);
  assert.equal(medicine.stockouts, 1);
  assert.equal(medicine.availability, .5);
  assert.equal(medicine.quantity, 100);
  assert.equal(medicine.mos, 2.5);
});
test("positive quantity with submitted zero MOS is not a stockout", () => {
  const [medicine] = medicineSummaries([row(20, 20)]);
  assert.equal(medicine.stockouts, 0);
  assert.equal(medicine.low, 1);
});
test("missing inputs stay missing in totals and CSV", () => {
  const medicines = medicineSummaries([row(null, 20), row(10, 10)]);
  assert.equal(medicines[0].quantity, null);
  assert.equal(medicines[0].mos, null);
  assert.equal(medicines[0].availability, 1);
  assert.equal(medicines[0].gaps, 1);
  assert.match(exportMedicineCsv(medicines), /"100.0","","30",""/);
});
test("change is in percentage points and requires a previous observation", () => {
  assert.equal(medicineSummaries([row(10, 10)])[0].change, null);
  assert.equal(medicineSummaries([row(10, 10)], [row(0, 10)])[0].change, 100);
});
test("stock-status mix partitions summary categories and never divides by zero", () => {
  const mix = summaryStockMix({ stockout: 2, nearCritical: 1, understocked: 2, accordingToPlan: 3, abovePlan: 1, overstock: 0, dataGap: 1 });
  assert.equal(mix.reduce((sum, group) => sum + group.count, 0), 10);
  assert.ok(Math.abs(mix.reduce((sum, group) => sum + group.rate, 0) - 1) < 1e-12);
  assert.equal(summaryStockMix({})[0].rate, null);
});
