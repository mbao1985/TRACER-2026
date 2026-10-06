import { mkdir, readFile, writeFile } from "node:fs/promises";

const dashboardUrl = new URL(process.env.DASHBOARD_URL || "");
if (dashboardUrl.protocol !== "https:") {
  throw new Error("DASHBOARD_URL must be the HTTPS address of your secure dashboard.");
}
const accessUrl = dashboardUrl.origin + "/request-access";
const template = await readFile(new URL("../public-access-redirect/index.html", import.meta.url), "utf8");
const html = template.replaceAll("https://tracer-secure-dashboard.onrender.com/request-access", accessUrl);
if (!html.includes(accessUrl) || html.includes("https://tracer-secure-dashboard.onrender.com")) {
  throw new Error("The access redirect template could not be configured.");
}
const outputDir = new URL("../public-access-mbao/", import.meta.url);
await mkdir(outputDir, { recursive: true });
await writeFile(new URL("index.html", outputDir), html);
