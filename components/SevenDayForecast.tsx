"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Wind,
  AlertTriangle,
  Zap,
  Droplets,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";

interface ForecastDay {
  date: string;
  temp_avg: number;
  temp_min?: number | null;
  temp_max?: number | null;
  humidity: number | null;
  overall_hazard: string;
  rain_hazard: string;
  wind_hazard: string;
  storm_hazard: string;
  flood_hazard: string;
  earthquake_hazard: string;
}

interface ForecastResponse {
  success: boolean;
  message: string;
  count: number;
  data: ForecastDay[];
  location: {
    latitude: number;
    longitude: number;
  };
}

const getDayOfWeek = (dateString: string, language: string): string => {
  const date = new Date(dateString);
  if (language === 'vi') {
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[date.getDay()];
  } else {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  }
};

const getHazardIcon = (hazard: string) => {
  const hazardLower = hazard.toLowerCase();

  switch (hazardLower) {
    case "storm":
      return <AlertTriangle className="w-6 h-6 text-red-600" />;
    case "wind":
      return <Wind className="w-6 h-6 text-orange-500" />;
    case "rain":
      return <CloudRain className="w-6 h-6 text-yellow-500" />;
    case "flood":
      return <Droplets className="w-6 h-6 text-blue-400" />;
    case "no":
      return <Cloud className="w-6 h-6 text-gray-400" />;
    default:
      return <Cloud className="w-6 h-6 text-gray-400" />;
  }
};

const getHazardColor = (hazard: string): string => {
  const hazardLower = hazard.toLowerCase();

  switch (hazardLower) {
    case "storm":
      return "bg-red-100 border-red-300";
    case "wind":
      return "bg-orange-100 border-orange-300";
    case "rain":
      return "bg-yellow-100 border-yellow-300";
    case "flood":
      return "bg-blue-100 border-blue-300";
    case "no":
      return "bg-gray-100 border-gray-300";
    default:
      return "bg-gray-100 border-gray-300";
  }
};

const getOverallHazard = (day: ForecastDay): string => {
  // Trực tiếp lấy từ overall_hazard field
  return day.overall_hazard;
};

export function SevenDayForecast({ lat, lon }: { lat?: number; lon?: number }) {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const language = useStore((state) => state.language);
  const t = useTranslation(language);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tạo URL với query parameters nếu có tọa độ
          const url = new URL("https://travel-safety-backend.onrender.com/api/v1/forecast/");
        if (lat !== undefined && lon !== undefined) {
          url.searchParams.append("lat", lat.toString());
          url.searchParams.append("lon", lon.toString());
        }
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Error:", errorData);
          throw new Error(`Lỗi khi lấy dữ liệu dự đoán (${response.status}): ${errorData}`);
        }

        const data: ForecastResponse = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          setForecast(data.data);
          setLocation(data.location);
          if (data.data.length > 0) {
            setSelectedDay(data.data[0]);
          }
        } else {
          throw new Error("Định dạng dữ liệu không hợp lệ");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
        setError(errorMessage);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">{t.sevenDayForecast}</h2>
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-red-500/30 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-red-400">{t.forecastError}</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (forecast.length === 0) {
    return (
      <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">{t.sevenDayForecast}</h2>
        <p className="text-gray-300">{t.noForecastData}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-white">{t.sevenDayForecast}</h2>
      <div>
        {/* Thanh ngang 7 phần bằng nhau */}
        <div className="w-full grid grid-cols-7 gap-2 mb-6">
          {forecast.map((day, index) => {
            const dayName = getDayOfWeek(day.date, language);
            const overallHazard = getOverallHazard(day);
            const isSelected = selectedDay?.date === day.date;

            return (
              <button
                key={index}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer bg-white/10 backdrop-blur-sm hover:bg-white/20 ${
                  isSelected ? "border-orange-400 shadow-lg shadow-orange-400/50" : "border-white/20"
                }`}
              >
                {/* Ngày trong tuần */}
                <span className="text-xs font-bold text-white mb-2">
                  {dayName}
                </span>

                {/* Icon hazard */}
                <div className="flex justify-center mb-2">
                  {getHazardIcon(overallHazard)}
                </div>

                {/* Ngày */}
                <span className="text-xs text-gray-200">
                  {new Date(day.date).getDate()}
                </span>

                {/* Badge mức độ nguy hiểm */}
                <Badge
                  variant="outline"
                  className="mt-2 text-xs bg-white/20 border-white/30 text-white"
                >
                  {overallHazard}
                </Badge>

                {/* Nhiệt độ */}
                <span className="text-xs font-semibold text-white mt-1">
                  {day.temp_avg.toFixed(1)}°C
                </span>
              </button>
            );
          })}
        </div>

        {/* Chi tiết ngày được chọn */}
        {selectedDay && (
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <h3 className="font-bold text-lg mb-4 text-white">
              {getDayOfWeek(selectedDay.date, language)} - {selectedDay.date}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Cột trái */}
              <div>
                <p className="text-sm text-gray-300">{t.temperature}</p>
                <p className="text-xl font-bold text-white">
                  {selectedDay.temp_min != null && selectedDay.temp_max != null
                    ? `${selectedDay.temp_min.toFixed(1)}°C - ${selectedDay.temp_max.toFixed(1)}°C`
                    : `${selectedDay.temp_avg.toFixed(1)}°C`}
                </p>

                {selectedDay.humidity && (
                  <>
                    <p className="text-sm text-gray-300 mt-3">{t.humidity}</p>
                    <p className="text-xl font-bold text-white">
                      {selectedDay.humidity}%
                    </p>
                  </>
                )}
              </div>

              {/* Cột phải - Mức độ nguy hiểm */}
              <div>
                <p className="text-sm font-semibold text-gray-200 mb-2">
                  ⚠️ {t.mainHazard}
                </p>
                <div className="flex items-center gap-2">
                  {getHazardIcon(selectedDay.overall_hazard)}
                  <Badge 
                    className="text-lg px-3 py-1 bg-white/20 border-white/30 text-white"
                    variant="outline"
                  >
                    {selectedDay.overall_hazard}
                  </Badge>
                </div>
                
                {/* Chi tiết từng loại */}
                <p className="text-xs font-semibold text-gray-300 mt-4 mb-2">{t.details}:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-200">
                    <span>🌧️ {t.rain}:</span>
                    <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">{selectedDay.rain_hazard}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-gray-200">
                    <span>💨 {t.wind}:</span>
                    <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">{selectedDay.wind_hazard}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-gray-200">
                    <span>⛈️ {t.storm}:</span>
                    <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">{selectedDay.storm_hazard}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-gray-200">
                    <span>🌊 {t.flood}:</span>
                    <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">{selectedDay.flood_hazard}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-gray-200">
                    <span>🌍 {t.earthquake}:</span>
                    <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
                      {selectedDay.earthquake_hazard}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
