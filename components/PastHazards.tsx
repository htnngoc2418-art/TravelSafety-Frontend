"use client";

import { useEffect, useState } from 'react';
import LocationSelector from './LocationSelector';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';

interface HazardStat {
  hazard_type: string;
  count: number;
  percentage: number;
  high_events: number;
  mid_high_events: number;
  mid_events: number;
  low_events: number;
  no_events: number;
  top_months?: number[];
  top_provinces?: string[];
}

interface PastHazardsData {
  success: boolean;
  total_records: number;
  year_range: string;
  hazards_stats: HazardStat[];
  top_locations: Record<string, number>;
}

export default function PastHazards() {
  const [data, setData] = useState<PastHazardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(2025);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const language = useStore((s) => s.language);
  const t = useTranslation(language);

  const fetchPastHazards = async (selectedYear: number, prov?: string) => {
    try {
      setLoading(true);
      setError(null);
      let qs = `?year=${selectedYear}`;
      if (prov) qs += `&province=${encodeURIComponent(prov)}`;
      const resp = await fetch(`/api/past-hazards${qs}`);
      if (!resp.ok) throw new Error('Failed to fetch past hazards data');
      const json = await resp.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastHazards(year, selectedProvince);
  }, [year, selectedProvince]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin mb-4">
            <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">{error || 'Không thể tải dữ liệu'}</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: 'high' | 'mid-high' | 'mid' | 'low') => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'mid-high':
        return 'text-orange-500 bg-orange-500/10';
      case 'mid':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{t.statisticsTitle}</h1>
            <p className="text-sm text-white/75">{t.statisticsSubtitle.replace('{year}', String(year)).replace('{count}', String(data.total_records))}</p>
          </div>
        </div>

        <div className="flex-1 max-w-lg">
          <LocationSelector
            mode="province-only"
            onSelect={(info) => {
                setSelectedProvince(info?.province || '');
            }}
            selectedProvince={selectedProvince}
          />
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/75">{t.selectYearLabel}</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border px-3 py-2 bg-white text-black"
            aria-label={t.selectYearLabel}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Pie chart + Main Stats Grid */}
      <div className="mb-8">
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-1/3 flex items-center justify-center">
            <PieChart data={data.hazards_stats} size={220} />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {data.hazards_stats.map((hazard) => (
              <div key={hazard.hazard_type} className="p-4 rounded-lg bg-black/30 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white capitalize">{hazard.hazard_type}</h3>
                  <span className="text-2xl font-bold text-white">{hazard.count}</span>
                </div>
                <div className="text-sm text-white/75 mb-2">{t.percentageLabel} <span className="font-semibold text-white">{hazard.percentage}%</span></div>
                <div className="flex gap-3 flex-wrap">
                  <div className="min-w-[140px]">
                    <div className="text-sm text-white/75">{t.topMonthsLabel}</div>
                      {hazard.top_months && hazard.top_months.length > 0 ? (
                      <div className="mt-2 text-white">
                        <span className="text-white/75">{t.topMonthsLabel}:</span>{' '}
                        <span className="font-semibold">
                          {hazard.top_months
                            .map((m: number) => t.months[m - 1] || `Tháng ${m}`)
                            .join(', ')}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-white/70">{t.noData}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Locations */}
      {Object.keys(data.top_locations).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">{t.topLocationsTitle}</h2>
          <div className="bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Địa Điểm</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-white/70">Số Sự Kiện</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.top_locations).map(([location, count], index) => (
                    <tr key={location} className={`border-b border-white/5`}>
                      <td className="px-4 py-3 text-white">{location}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-3 py-1 bg-amber-600/20 text-white rounded-full text-sm font-semibold">{count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: month name
const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
function monthName(m: number) {
  if (!m || m < 1 || m > 12) return String(m);
  return monthNames[m-1];
}

// Simple SVG Pie Chart
function PieChart({ data, size = 220 }: { data: any[]; size?: number }) {
  const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
  let cumulative = 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  const colors = ['#F59E0B','#FB923C','#F97316','#60A5FA','#F43F5E'];

  const arcs = data.map((d, i) => {
    const value = d.count || 0;
    const startAngle = (cumulative / total) * 360;
    cumulative += value;
    const endAngle = (cumulative / total) * 360;
    const pct = Math.round((value / total) * 100);
    return { startAngle, endAngle, color: colors[i % colors.length], label: d.hazard_type, value, pct };
  });

  // convert polar to cartesian
  const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
    const a = (angleDeg - 90) * Math.PI / 180.0;
    return { x: cx + (r * Math.cos(a)), y: cy + (r * Math.sin(a)) };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polar(x, y, r, endAngle);
    const end = polar(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${x} ${y} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc, i) => (
          <g key={i}>
            <path d={describeArc(cx, cy, r, arc.startAngle, arc.endAngle)} fill={arc.color} stroke="rgba(0,0,0,0.05)" />
            {/* percentage label */}
            {arc.pct > 0 && (() => {
              const mid = (arc.startAngle + arc.endAngle) / 2;
              const pos = polar(cx, cy, r * 0.65, mid);
              return (
                <text x={pos.x} y={pos.y} key={`t-${i}`} fill="#ffffff" fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="central">
                  {arc.pct}%
                </text>
              );
            })()}
          </g>
        ))}
      </svg>

      <div className="flex flex-col text-sm">
        {arcs.map((a, i) => (
          <div key={`leg-${i}`} className="flex items-center gap-2 mb-2">
            <span style={{ background: a.color }} className="w-4 h-4 inline-block rounded-sm border border-white/10" />
            <span className="text-white/90">{a.label}</span>
            <span className="text-white/70 ml-2">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
