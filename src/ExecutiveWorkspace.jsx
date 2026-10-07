import { Fragment, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Columns3, Download, Search } from "lucide-react";
import { exportMedicineCsv, medicineSummaries, STOCK_GROUPS, summaryStockMix } from "./executiveModel.js";

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const pct = (value) => finite(value) ? `${(value * 100).toFixed(1)}%` : "-";
const num = (value) => finite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "-";
const provinceName = (name) => String(name || "").replace(/ PROVINCE$/i, "").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function Panel({ title, basis, children, className = "" }) {
  return <article className={`insight-panel ${className}`}><header><h3>{title}</h3><span>{basis}</span></header>{children}</article>;
}

function RankedBars({ rows, metric = "availability", onSelect, reference }) {
  const isMos = metric === "mos";
  const maximum = isMos ? Math.max(6, ...rows.map((row) => finite(row.mos) ? row.mos : 0)) : 1;
  return <div className={`ranked-bars ${isMos ? "mos-bars" : ""}`}>
    {rows.map((row) => <button type="button" key={row.name || row.id} onClick={() => onSelect?.(row)} disabled={!onSelect} title={`${row.label || provinceName(row.name)}: ${isMos ? num(row[metric]) + " months" : pct(row[metric])}`}>
      <span>{row.label || provinceName(row.name)}</span><i>{finite(row[metric]) && <b style={{ width: `${Math.max(0, Math.min(100, row[metric] / maximum * 100))}%` }} />}{finite(reference) && <em style={{ left: `${reference / maximum * 100}%` }} />}</i><strong>{isMos ? num(row[metric]) : pct(row[metric])}</strong>
    </button>)}
    <div className="chart-scale"><span>0{isMos ? "" : "%"}</span><span>{isMos ? `${num(maximum)} months` : "100%"}</span></div>
    {finite(reference) && <small className="chart-note">Dashed marker: {isMos ? `${num(reference)} months` : `national availability ${pct(reference)}`}</small>}
  </div>;
}

function Trend({ rows }) {
  const width = 600, height = 190, left = 40, right = 18, top = 12, bottom = 36;
  const point = (row, index) => ({ x: left + index / Math.max(1, rows.length - 1) * (width - left - right), y: top + (1 - row.availability) * (height - top - bottom) });
  const segments = [];
  let current = [];
  rows.forEach((row, index) => { if (finite(row.availability)) current.push(point(row, index)); else { if (current.length) segments.push(current); current = []; } });
  if (current.length) segments.push(current);
  return <div className="trend-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly availability from loaded reports. Missing submissions are not plotted as zero.">
    {[0, .25, .5, .75, 1].map((tick) => <g key={tick}><line className="gridline" x1={left} x2={width - right} y1={point({ availability: tick }, 0).y} y2={point({ availability: tick }, 0).y} /><text x={left - 8} y={point({ availability: tick }, 0).y + 4} textAnchor="end">{tick * 100}%</text></g>)}
    {segments.map((segment, index) => <polyline key={index} points={segment.map((value) => `${value.x},${value.y}`).join(" ")} fill="none" className="trend-line" />)}
    {rows.map((row, index) => <g key={row.id}>{finite(row.availability) ? <circle cx={point(row, index).x} cy={point(row, index).y} r="3.5"><title>{row.date}: {pct(row.availability)}</title></circle> : <text x={point({ availability: .5 }, index).x} y="80" textAnchor="middle">No report</text>}{(index === 0 || index === rows.length - 1 || index % Math.max(1, Math.ceil(rows.length / 5)) === 0) && <text x={point({ availability: 0 }, index).x} y={height - 12} textAnchor="middle">{row.date.slice(5)}</text>}</g>)}
  </svg><small className="chart-note">Report dates · {rows.length} loaded weeks · Availability (%)</small></div>;
}

function StockMix({ rows }) {
  return <div className="stock-mix">{rows.map((row) => <div className="mix-row" key={row.name}><span>{provinceName(row.name)}</span><div>{summaryStockMix(row).map((group) => <i key={group.key} style={{ width: `${(group.rate || 0) * 100}%`, background: group.color }} title={`${group.label}: ${pct(group.rate)} (${num(group.count)} submitted rows)`}>{group.rate >= .13 ? `${Math.round(group.rate * 100)}%` : ""}</i>)}</div></div>)}<div className="chart-legend">{STOCK_GROUPS.map((group) => <span key={group.key}><i style={{ background: group.color }} />{group.label}</span>)}</div><small className="chart-note">Share of submitted commodity rows; not a count of facilities.</small></div>;
}

function Reporting({ rows }) {
  return <div className="reporting-bars">{rows.map((row) => <div key={row.name}><span>{provinceName(row.name)}</span><i><b style={{ width: `${row.expected ? row.reported / row.expected * 100 : 0}%` }} /></i><strong>{row.reported}/{row.expected}</strong></div>)}<small className="chart-note">Complete / expected DHO district reports · HC + HP rule</small></div>;
}

function Heatmap({ medicines, provinces }) {
  const sample = medicines.slice(0, 6);
  return <div className="heatmap-scroll"><table className="risk-heatmap"><thead><tr><th>Medicine</th>{provinces.map((province) => <th key={province.name}>{provinceName(province.name)}</th>)}</tr></thead><tbody>{sample.map((medicine) => <tr key={medicine.key}><th title={medicine.name}>{medicine.name}</th>{provinces.map((province) => {
    const rows = medicine.details.filter((row) => row.province === province.name && finite(row.quantity) && row.quantity >= 0);
    const rate = rows.length ? rows.filter((row) => row.quantity > 0).length / rows.length : null;
    return <td key={province.name} className={rate === null ? "heat-gap" : rate < .5 ? "heat-critical" : rate < .8 ? "heat-low" : "heat-good"} title={`${medicine.name} · ${provinceName(province.name)}: ${rows.length} valid submitted observations`}>{pct(rate)}</td>;
  })}</tr>)}</tbody></table><div className="chart-legend"><span>Availability: ≥80%</span><span>50–79.9%</span><span>&lt;50%</span><span>- No data</span></div></div>;
}

const columns = [
  { key: "name", label: "Medicine" }, { key: "programme", label: "Programme" }, { key: "availability", label: "Availability" },
  { key: "quantity", label: "SOH" }, { key: "amc", label: "AMC" }, { key: "mos", label: "MOS" }, { key: "stockouts", label: "Reporting-unit risk" }, { key: "change", label: "Change" },
];

function RiskBadge({ medicine }) {
  return <span className={`risk-badge ${medicine.stockouts ? "risk-red" : medicine.low ? "risk-amber" : medicine.gaps ? "risk-gray" : medicine.excess ? "risk-blue" : "risk-teal"}`} title="Count of cleared reporting-unit observations"><CircleAlert size={13} aria-hidden="true" />{medicine.stockouts ? `${medicine.stockouts} stockout` : medicine.low ? `${medicine.low} low stock` : medicine.gaps ? `${medicine.gaps} data gaps` : medicine.excess ? `${medicine.excess} above plan` : "According to plan"}</span>;
}

function MedicineTable({ medicines, reportDate }) {
  const [query, setQuery] = useState("");
  const [programme, setProgramme] = useState("all");
  const [density, setDensity] = useState("compact");
  const [visible, setVisible] = useState(columns.map((column) => column.key));
  const [sort, setSort] = useState({ key: "stockouts", direction: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState(null);
  const [detailPage, setDetailPage] = useState(1);
  const shownColumns = columns.filter((column) => visible.includes(column.key));
  const programmes = [...new Set(medicines.map((row) => row.programme))].sort();
  const filtered = medicines.filter((row) => (!query || `${row.name} ${row.programme}`.toLowerCase().includes(query.toLowerCase())) && (programme === "all" || row.programme === programme)).sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    return (typeof av === "string" ? av.localeCompare(bv) : (av || 0) - (bv || 0)) * sort.direction || a.name.localeCompare(b.name);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const exportRows = () => {
    const url = URL.createObjectURL(new Blob([exportMedicineCsv(filtered)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `priority-medicines-${reportDate}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <section className="medicine-workspace" aria-label="Priority medicines table"><header className="workspace-heading"><div><h2>Priority medicines</h2><span>Latest report · {reportDate} · Change compares available reporting footprints</span></div></header>
    <div className="medicine-toolbar"><label className="medicine-search"><Search size={16} aria-hidden="true" /><input aria-label="Search priority medicines" placeholder="Search medicine or programme" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
      <select aria-label="Priority medicine programme" value={programme} onChange={(event) => { setProgramme(event.target.value); setPage(1); }}><option value="all">All programmes</option>{programmes.map((value) => <option key={value}>{value}</option>)}</select>
      <div className="density-control" aria-label="Table density">{["compact", "comfortable"].map((value) => <button key={value} type="button" aria-pressed={density === value} onClick={() => setDensity(value)}>{value === "compact" ? "Compact" : "Comfortable"}</button>)}</div>
      <details className="column-picker"><summary aria-label="Choose medicine columns" title="Choose columns"><Columns3 size={18} /></summary><div>{columns.map((column) => <label key={column.key}><input type="checkbox" checked={visible.includes(column.key)} disabled={column.key === "name"} onChange={(event) => setVisible((values) => event.target.checked ? [...values, column.key] : values.filter((key) => key !== column.key))} />{column.label}</label>)}</div></details>
      <button type="button" className="icon-tool" onClick={exportRows} aria-label="Download filtered medicine CSV" title="Download filtered medicine CSV"><Download size={18} /></button>
    </div>
    <div className={`medicine-table-scroll density-${density}`}><table><thead><tr>{shownColumns.map((column) => <th key={column.key} className={column.key === "name" || column.key === "programme" ? "" : "numeric"} aria-sort={sort.key === column.key ? sort.direction === 1 ? "ascending" : "descending" : "none"}><button type="button" onClick={() => setSort((value) => ({ key: column.key, direction: value.key === column.key ? -value.direction : column.key === "name" ? 1 : -1 }))}>{column.label}<ArrowUpDown size={12} aria-hidden="true" /></button></th>)}</tr></thead><tbody>
      {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((medicine) => <Fragment key={medicine.key}><tr className={expanded === medicine.key ? "expanded-medicine" : ""}>{shownColumns.map((column) => <td key={column.key} className={column.key === "name" || column.key === "programme" ? "" : "numeric"}>
        {column.key === "name" ? <button type="button" className="medicine-name" aria-expanded={expanded === medicine.key} onClick={() => { setExpanded(expanded === medicine.key ? null : medicine.key); setDetailPage(1); }}>{expanded === medicine.key ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<span>{medicine.name}</span></button>
          : column.key === "programme" ? medicine.programme
            : column.key === "availability" ? <span className="table-availability"><i><b style={{ width: `${(medicine.availability || 0) * 100}%` }} /></i>{pct(medicine.availability)}</span>
              : column.key === "stockouts" ? <RiskBadge medicine={medicine} />
                : column.key === "change" ? <span className={medicine.change < 0 ? "change-down" : "change-up"}>{finite(medicine.change) && medicine.change !== 0 ? medicine.change > 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : null}{finite(medicine.change) ? `${medicine.change > 0 ? "+" : ""}${medicine.change.toFixed(1)} pp` : "-"}</span>
                  : num(medicine[column.key])}
      </td>)}</tr>{expanded === medicine.key && <tr className="medicine-detail"><td colSpan={shownColumns.length}><div><strong>{medicine.name} · Reporting-unit detail</strong><span>{medicine.details.length} observations · latest source records</span></div><table><thead><tr><th>Province</th><th>Reporting unit</th><th className="numeric">SOH</th><th className="numeric">AMC</th><th className="numeric">Calculated MOS</th><th>Status</th></tr></thead><tbody>{medicine.details.slice((detailPage - 1) * 10, detailPage * 10).map((row, index) => <tr key={index}><td>{provinceName(row.province)}</td><td>{row.facility} · {row.district}</td><td className="numeric">{num(row.quantity)}</td><td className="numeric">{num(row.amc)}</td><td className="numeric">{num(row.calculatedMos)}</td><td>{row.status}</td></tr>)}</tbody></table><div className="detail-pagination"><button type="button" aria-label="Previous reporting units" disabled={detailPage <= 1} onClick={() => setDetailPage((value) => value - 1)}><ChevronLeft size={16} /></button><span>{detailPage} / {Math.max(1, Math.ceil(medicine.details.length / 10))}</span><button type="button" aria-label="Next reporting units" disabled={detailPage * 10 >= medicine.details.length} onClick={() => setDetailPage((value) => value + 1)}><ChevronRight size={16} /></button></div></td></tr>}</Fragment>)}
      {!filtered.length && <tr><td colSpan={shownColumns.length}>No medicines match the current filters.</td></tr>}
    </tbody></table></div>
    <footer className="medicine-pagination"><span>{filtered.length} medicines · Missing values remain missing</span><label>Rows <select aria-label="Medicine rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" aria-label="Previous medicine page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage}/{pages}</span><button type="button" aria-label="Next medicine page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></footer>
  </section>;
}

export default function ExecutiveWorkspace({ trend, provinces, levels, kpis, detailRows, previousRows, reportingRows, reportingUnitCount, heldCount, reportDate, averaged, onProvince, onNavigate }) {
  const medicines = useMemo(() => medicineSummaries(detailRows, previousRows), [detailRows, previousRows]);
  const reporting = useMemo(() => {
    const groups = new Map();
    for (const row of reportingRows) { const name = row.province; if (!groups.has(name)) groups.set(name, { name, expected: 0, reported: 0 }); const group = groups.get(name); group.expected += 1; if (row.reported) group.reported += 1; }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [reportingRows]);
  const basis = averaged ? "Period average" : "Selected report";
  const expected = reporting.reduce((sum, row) => sum + row.expected, 0);
  const received = reporting.reduce((sum, row) => sum + row.reported, 0);
  return <section className="executive-workspace">
    <div className="overview-kpis">{[
      ["Availability", pct(kpis.availability), basis], ["Average MOS", num(kpis.mos), basis], ["Reporting units", num(reportingUnitCount), "Latest submitted stock reports"], ["DHO reporting coverage", expected ? pct(received / expected) : "-", `${received}/${expected} districts · latest report`],
    ].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <div className="insight-grid">
      <Panel title="National availability trend" basis="Loaded reporting weeks"><Trend rows={trend.slice(-12)} /></Panel>
      <Panel title="Province performance" basis={basis}><RankedBars rows={provinces.slice(0, 5)} reference={kpis.availability} onSelect={(row) => onProvince(row.name)} /><button className="chart-drill" type="button" onClick={() => onNavigate("provincial")}>View all provinces <ChevronRight size={13} /></button></Panel>
      <Panel title="Facility-level availability" basis={basis}><RankedBars rows={levels} /></Panel>
      <Panel title="Facility-level months of stock" basis={basis}><RankedBars rows={levels} metric="mos" reference={2} /></Panel>
      <Panel title="Stock-status distribution" basis={`${basis} · lowest availability`}><StockMix rows={[...provinces].sort((a, b) => a.availability - b.availability).slice(0, 5)} /><button className="chart-drill" type="button" onClick={() => onNavigate("national")}>View national stock status <ChevronRight size={13} /></button></Panel>
      <Panel title="Reporting completeness" basis="Latest report · lowest coverage"><Reporting rows={[...reporting].sort((a, b) => a.reported / a.expected - b.reported / b.expected).slice(0, 5)} /><button className="chart-drill" type="button" onClick={() => onNavigate("reporting")}>View all reporting districts <ChevronRight size={13} /></button></Panel>
    </div>
    <Panel title="Medicine availability by province" basis="Latest report"><Heatmap medicines={medicines} provinces={provinces} /></Panel>
    <div className="cleared-records"><span>Medicine details use {detailRows.length.toLocaleString()} data-quality-cleared observations; {heldCount.toLocaleString()} held records are excluded.</span><button type="button" onClick={() => onNavigate("gate")}>Review data-quality gate <ChevronRight size={13} /></button></div>
    <MedicineTable medicines={medicines} reportDate={reportDate} />
    <div className="priority-followup"><strong>Priority follow-up</strong><button type="button" onClick={() => onNavigate("facilities")}>Facility stockouts</button><button type="button" onClick={() => onNavigate("quality")}>Missing submissions</button><button type="button" onClick={() => onNavigate("actions")}>Redistribution follow-up</button></div>
  </section>;
}
