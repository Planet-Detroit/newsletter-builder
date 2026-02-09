"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";

export default function CO2Widget() {
  const { state, dispatch } = useNewsletter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Individual loading states
  const [loadingCo2, setLoadingCo2] = useState(false);
  const [loadingAqi, setLoadingAqi] = useState(false);
  const [loadingLakes, setLoadingLakes] = useState(false);

  const fetchCo2 = async () => {
    setLoadingCo2(true);
    setError(null);
    try {
      const res = await fetch("/api/co2");
      if (!res.ok) throw new Error("CO₂ fetch failed");
      const data = await res.json();
      if (!data.error) {
        dispatch({
          type: "SET_CO2",
          payload: { current: data.current, lastYear: data.lastYear, change: data.change, date: data.date },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "CO₂ fetch failed");
    } finally {
      setLoadingCo2(false);
    }
  };

  const fetchAqi = async () => {
    setLoadingAqi(true);
    setError(null);
    try {
      const res = await fetch("/api/air-quality");
      if (!res.ok) throw new Error("AQI fetch failed");
      const data = await res.json();
      if (data.aqi != null && !data.demo) {
        dispatch({
          type: "SET_AIR_QUALITY",
          payload: { aqi: data.aqi, category: data.category, parameter: data.parameter, color: data.color, dateObserved: data.dateObserved },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AQI fetch failed");
    } finally {
      setLoadingAqi(false);
    }
  };

  const fetchLakes = async () => {
    setLoadingLakes(true);
    setError(null);
    try {
      const res = await fetch("/api/lake-levels");
      if (!res.ok) throw new Error("Lake levels fetch failed");
      const data = await res.json();
      if (data.erie != null || data.michiganHuron != null) {
        dispatch({
          type: "SET_LAKE_LEVELS",
          payload: { erie: data.erie ?? null, michiganHuron: data.michiganHuron ?? null, erieChange: data.erieChange ?? null, michiganHuronChange: data.michiganHuronChange ?? null, date: data.date || "" },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lake levels fetch failed");
    } finally {
      setLoadingLakes(false);
    }
  };

  const handleFetchAll = async () => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "loading" } });
    await Promise.allSettled([fetchCo2(), fetchAqi(), fetchLakes()]);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "ready" } });
    setIsLoading(false);
  };

  const trendArrow = (change: number | null) => {
    if (change == null) return "";
    if (change > 0) return "↑";
    if (change < 0) return "↓";
    return "→";
  };

  const hasAnyData = state.co2 || state.airQuality || state.lakeLevels;

  return (
    <div className="space-y-3">
      {/* Fetch buttons — individual or all */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleFetchAll}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          style={{ background: isLoading ? "var(--pd-muted)" : "var(--pd-blue)" }}
        >
          {isLoading ? "Fetching…" : "Fetch All"}
        </button>
        <button
          onClick={fetchCo2}
          disabled={loadingCo2}
          className="px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
          style={{ borderColor: "var(--pd-border)", color: "var(--pd-blue)" }}
        >
          {loadingCo2 ? "…" : "CO₂"}
        </button>
        <button
          onClick={fetchAqi}
          disabled={loadingAqi}
          className="px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
          style={{ borderColor: "var(--pd-border)", color: "var(--pd-blue)" }}
        >
          {loadingAqi ? "…" : "AQI"}
        </button>
        <button
          onClick={fetchLakes}
          disabled={loadingLakes}
          className="px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
          style={{ borderColor: "var(--pd-border)", color: "var(--pd-blue)" }}
        >
          {loadingLakes ? "…" : "Lakes"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {hasAnyData && (
        <div className="space-y-1.5">
          {/* CO2 */}
          {state.co2 && (
            <div className="flex items-center gap-2 py-1.5">
              <span className="text-sm">🌡️</span>
              <p className="text-sm flex-1">
                <span className="font-medium text-pd-muted text-xs uppercase tracking-wider">CO₂</span>{" "}
                <span className="font-bold" style={{ color: "var(--pd-blue)" }}>{state.co2.current}</span>{" "}
                <span className="text-xs text-pd-muted">ppm</span>
                {state.co2.lastYear && (
                  <span className="text-xs text-pd-muted ml-1.5">
                    vs {state.co2.lastYear} <span style={{ color: "var(--pd-danger)" }}>+{state.co2.change}</span>
                  </span>
                )}
              </p>
              <button
                onClick={() => dispatch({ type: "SET_CO2", payload: null })}
                className="text-xs text-pd-muted hover:text-pd-danger cursor-pointer"
                title="Remove CO₂"
              >✕</button>
            </div>
          )}

          {/* Air Quality */}
          {state.airQuality && (
            <div className="flex items-center gap-2 py-1.5">
              <span className="text-sm">💨</span>
              <p className="text-sm flex-1">
                <span className="font-medium text-pd-muted text-xs uppercase tracking-wider">AQI</span>{" "}
                <span className="font-bold" style={{ color: state.airQuality.color }}>{state.airQuality.aqi}</span>{" "}
                <span className="text-xs text-pd-muted">· {state.airQuality.category}</span>
                <span className="text-xs text-pd-muted ml-1.5">{state.airQuality.dateObserved}</span>
              </p>
              <button
                onClick={() => dispatch({ type: "SET_AIR_QUALITY", payload: null })}
                className="text-xs text-pd-muted hover:text-pd-danger cursor-pointer"
                title="Remove AQI"
              >✕</button>
            </div>
          )}

          {/* Lake Levels */}
          {state.lakeLevels && (state.lakeLevels.erie != null || state.lakeLevels.michiganHuron != null) && (
            <div className="flex items-center gap-2 py-1.5">
              <span className="text-sm">🌊</span>
              <div className="text-sm flex-1">
                <span className="font-medium text-pd-muted text-xs uppercase tracking-wider">Lakes</span>{" "}
                {state.lakeLevels.erie != null && (
                  <span>
                    <span className="font-bold" style={{ color: "var(--pd-blue)" }}>Erie {state.lakeLevels.erie}m</span>
                    {state.lakeLevels.erieChange != null && (
                      <span className="text-xs text-pd-muted ml-0.5">{trendArrow(state.lakeLevels.erieChange)}{Math.abs(state.lakeLevels.erieChange)}</span>
                    )}
                  </span>
                )}
                {state.lakeLevels.michiganHuron != null && (
                  <span className="ml-2">
                    <span className="font-bold" style={{ color: "var(--pd-blue)" }}>MI-Huron {state.lakeLevels.michiganHuron}m</span>
                    {state.lakeLevels.michiganHuronChange != null && (
                      <span className="text-xs text-pd-muted ml-0.5">{trendArrow(state.lakeLevels.michiganHuronChange)}{Math.abs(state.lakeLevels.michiganHuronChange)}</span>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => dispatch({ type: "SET_LAKE_LEVELS", payload: null })}
                className="text-xs text-pd-muted hover:text-pd-danger cursor-pointer"
                title="Remove lake levels"
              >✕</button>
            </div>
          )}

          {/* Source attribution */}
          <p className="text-xs text-pd-muted text-center pt-1">
            Data: NOAA{state.airQuality ? " · EPA AirNow" : ""}{state.lakeLevels ? " · NOAA GLERL" : ""}
          </p>
        </div>
      )}

      {!state.airQuality && state.co2 && (
        <p className="text-xs text-pd-muted text-center italic">
          Add AIRNOW_API_KEY to .env for Detroit air quality data.{" "}
          <a href="https://www.airnowapi.org/account/request/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--pd-blue)" }}>
            Get a free key
          </a>
        </p>
      )}
    </div>
  );
}
