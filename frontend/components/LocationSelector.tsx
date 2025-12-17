"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";

interface LocationInfo {
  province: string;
  area?: string;
  lat?: string;
  lon?: string;
  [key: string]: any;
}

export default function LocationSelector({
  onSelect,
  selectedProvince = "",
  selectedArea = "",
  mode = "province-area",
}: {
  onSelect: (info: LocationInfo | null) => void;
  selectedProvince: string;
  selectedArea?: string;
  mode?: "province-only" | "province-area";
}) {
  const language = useStore((state) => state.language);
  const t = useTranslation(language);

  // ==========================
  // STATES
  // ==========================
  const [provinces, setProvinces] = useState<string[]>([]);
  const [provincesMap, setProvincesMap] = useState<Record<string, any>>({});

  // These only used in "province-area"
  const [areas, setAreas] = useState<string[]>([]);
  const [provincesAreasMap, setProvincesAreasMap] = useState<Record<string, any>>({});

  const [province, setProvince] = useState(selectedProvince);
  const [area, setArea] = useState(selectedArea);

  // ==========================
  // LOAD BILINGUAL MAP
  // ==========================
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/data/provinces_map.json");
        if (r.ok) setProvincesMap(await r.json());
      } catch {}
      if (mode === "province-only") return;
      try {
        const s = await fetch("/data/provinces_areas_map.json");
        if (s.ok) setProvincesAreasMap(await s.json());
      } catch {}
    })();
  }, [mode]);

  // ==========================
  // LOAD PROVINCES
  // ==========================
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/locations/provinces");
        if (res.ok) setProvinces(await res.json());
      } catch {}
    })();
  }, []);

  // ==========================
  // LOAD AREAS WHEN PROVINCE CHANGES
  // (only if mode = province-area)
  // ==========================
  useEffect(() => {
    if (mode === "province-only") return;

    if (!province) {
      setAreas([]);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/locations/areas?province=${encodeURIComponent(province)}`);
        if (res.ok) setAreas(await res.json());
      } catch {}
    })();
  }, [province, mode]);

  // ==========================
  // Province change handler
  // ==========================
  const handleProvinceChange = (value: string) => {
    setProvince(value);

    if (mode === "province-only") {
      onSelect({ province: value });
      return;
    }

    // Reset area
    setArea("");
    onSelect({ province: value, area: "", lat: "", lon: "" });
  };

  // ==========================
  // Area change handler (NOT USED in province-only)
  // ==========================
  const handleAreaChange = async (value: string) => {
    setArea(value);

    try {
      const res = await fetch(
        `/api/locations/info?province=${encodeURIComponent(province)}&area=${encodeURIComponent(value)}`
      );
      if (!res.ok) return onSelect(null);

      const info = await res.json();
      onSelect(info);
    } catch {
      onSelect(null);
    }
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">

      {/* DROPDOWN PROVINCE */}
      <select
        className="bg-white text-black px-4 py-2 rounded-xl w-full"
        value={province}
        onChange={(e) => handleProvinceChange(e.target.value)}
      >
        <option value="">{t.selectProvince}</option>

        {provinces.map((p, i) => {
          const label = provincesMap[p]
            ? provincesMap[p][language === "en" ? "en" : "vi"]
            : p;
          return (
            <option key={`${p}-${i}`} value={p}>
              {label}
            </option>
          );
        })}
      </select>

      {/* AREA DROPDOWN — only shown in full mode */}
      {mode === "province-area" && (
        <select
          className="bg-white text-black px-4 py-2 rounded-xl w-full"
          value={area}
          onChange={(e) => handleAreaChange(e.target.value)}
          disabled={!province}
        >
          <option value="">{t.selectArea}</option>

          {areas.map((a, i) => {
            const clean = a.trim();
            const provMap = provincesAreasMap[province];
            const display =
              provMap && provMap.areas && provMap.areas[clean]
                ? provMap.areas[clean][language === "en" ? "en" : "vi"]
                : clean;

            return (
              <option key={`${province}-${clean}-${i}`} value={clean}>
                {display}
              </option>
            );
          })}
        </select>
      )}

    </div>
  );
}
