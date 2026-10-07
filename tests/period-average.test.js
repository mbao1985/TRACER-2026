import test from "node:test";
import assert from "node:assert/strict";
import { averagePeriods, averageRecords, matchingPeriods } from "../src/periodAverage.js";

const makePeriod = (id, month, availability, quantity, mos = null) => ({
  id, reportDate: id, month, label: id, counts: { rows: 10, facilityUnits: 2 },
  national: { name: "Zambia", availability, quantity, mos },
  provinces: [{ name: "Lusaka", availability, quantity, mos }],
  commodityFacilityData: { rows: [[quantity]] },
});
test("All filters match reporting month rather than calendar report date", () => {
  const periods = [makePeriod("2026-10-04", "2026-09", 0.8, 10), makePeriod("2025-09-07", "2025-09", 0.6, 20)];
  assert.equal(matchingPeriods(periods, "2026", "2026-09").length, 1);
  assert.equal(matchingPeriods(periods, "all", "all").length, 2);
  assert.equal(matchingPeriods(periods, "2026", "all").length, 1);
});
test("period summaries use arithmetic means, never summed stock", () => {
  const first = makePeriod("2026-09-06", "2026-09", 0.6, 10, null);
  const last = makePeriod("2026-09-13", "2026-09", 0.8, 30, 4);
  const result = averagePeriods([last, first]);
  assert.equal(result.national.quantity, 20);
  assert.equal(result.national.availability, 0.7);
  assert.equal(result.national.mos, 4);
  assert.equal(result.provinces[0].quantity, 20);
  assert.equal(result.averageReportCount, 2);
  assert.equal(result.commodityFacilityData, last.commodityFacilityData);
  assert.equal(last.national.quantity, 30);
});
test("no matching periods produces no average", () => assert.equal(averagePeriods([]), null));
test("an absent scoped submission is not zero stock or zero availability", () => {
  const result = averageRecords([{ rows: 0, quantity: 0, availability: 0 }, { rows: 10, quantity: 40, availability: 0.8 }]);
  assert.equal(result.quantity, 40);
  assert.equal(result.availability, 0.8);
});
test("historical facility identities do not inflate current reporting units", () => {
  const first = makePeriod("2026-09-06", "2026-09", 0.6, 10);
  const last = makePeriod("2026-09-13", "2026-09", 0.8, 30);
  first.facilities = [{ name: "Old name", rows: 10 }];
  last.facilities = [{ name: "New name", rows: 10 }];
  assert.deepEqual(averagePeriods([first, last]).facilities, last.facilities);
});
