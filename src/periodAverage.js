const summaryCollections = ["provinces", "districts", "facilities", "facilityLevels", "programmes", "programmeScopes", "commodities"];

export function matchingPeriods(periods, year, month) {
  return periods.filter((period) => (year === "all" || period.month.startsWith(`${year}-`)) && (month === "all" || period.month === month))
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate));
}

export function averageRecords(records) {
  const reported = records.filter((record) => record.rows !== 0);
  if (reported.length) records = reported;
  const result = { ...records.at(-1) };
  for (const key of Object.keys(result)) {
    if (!records.some((record) => typeof record[key] === "number")) continue;
    const values = records.map((record) => record[key]).filter((value) => typeof value === "number" && Number.isFinite(value));
    result[key] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  // Historical item lists describe an individual snapshot, not period averages.
  for (const key of Object.keys(result)) if (Array.isArray(result[key])) result[key] = [];
  return result;
}

export function averageCollection(periods, key) {
  const groups = new Map();
  for (const period of periods) for (const row of period[key] || []) {
    const identity = JSON.stringify([row.province, row.district, row.facilityLevel, row.name]);
    if (!groups.has(identity)) groups.set(identity, []);
    groups.get(identity).push(row);
  }
  return [...groups.values()].map(averageRecords);
}

export function averagePeriods(periods) {
  if (!periods.length) return null;
  const ordered = [...periods].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
  const latest = ordered.at(-1);
  const result = { ...latest, national: averageRecords(ordered.map((period) => period.national)), averageCounts: averageRecords(ordered.map((period) => period.counts)) };
  for (const key of summaryCollections) result[key] = averageCollection(ordered, key);
  result.facilities = latest.facilities;
  result.isPeriodAverage = true;
  result.averageReportCount = ordered.length;
  result.label = `Period average - ${ordered.length} reports`;
  result.source = `${ordered[0].reportDate} to ${latest.reportDate}`;
  // Detailed stock and data-quality decisions must retain source records.
  result.commodityFacilityData = latest.commodityFacilityData;
  return result;
}
