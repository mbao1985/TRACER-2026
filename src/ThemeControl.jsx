import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

export default function ThemeControl() {
  const [theme, setTheme] = useState(() => {
    try { const saved = localStorage.getItem("tracer-personal-theme"); return ["zambia", "clinical", "dark"].includes(saved) ? saved : "zambia"; } catch { return "zambia"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("tracer-personal-theme", theme); } catch { /* Theme remains usable when storage is blocked. */ }
  }, [theme]);
  return <label className="theme-control"><Palette size={17} aria-hidden="true" /><select aria-label="Dashboard theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="zambia">Zambia Executive</option><option value="clinical">Clinical Light</option><option value="dark">Control Room Dark</option></select></label>;
}
