"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";

export default function CO2Widget() {
  const { state, dispatch } = useNewsletter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "loading" } });

    try {
      // Fetch all environmental data in parallel
      const [co2Res, aqiRes, lakeRes] = await Promise.allSettled([
        fetch("/api/co2"),
        fetch("/api/air-quality"),
        fetch("/api/lake-levels"),
      ]);

      // Process CO2
      if (co2Res.status === "fulfilled" && co2Res.value.ok) {
        const data = await co2Res.value.json();
        if (!data.error) {
          dispatch({
            type: "SET_CO2",
            payload: { current: data.current, lastYear: data.lastYear, change: data.change, date: data.date },
          });
        }
      }

      // Process Air Quality
      if (aqiRes.status === "fulfilled" && aqiRes.value.ok) {
        const data = await aqiRes.value.json();
        if (data.aqi != null && !data.demo) {
          dispatch({
            type: "SET_AIR_QUALITY",
            payload: {
              aqi: data.aqi,
              category: data.category,
              parameter: data.parameter,
              color: data.color,
              dateObserved: data.dateObserved,
            },
          });
        }
      }

      // Process Lake Levels
      if (lakeRes.status === "fulfilled" && lakeRes.value.ok) {
        const data = await lakeRes.value.json();
        if (data.erie != null || data.michiganHuron != null) {
          dispatch({
            type: "SET_LAKE_LEVELS",
            payload: {
              erie: data.erie ?? null,
              michiganHuron: data.michiganHuron ?? null,
              erieChange: data.erieChange ?? null,
              michiganHuronChange: data.michiganHuronChange ?? null,
              date: data.date || "",
            },
          });
        }
      }

      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "ready" } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      setError(msg);
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "empty" } });
    } finally {
      setIsLoading(false);
    }
  };

  const trendArrow = (change: number | null) => {
    if (change == null) return "";
    if (change > 0) return "↑";
    if (change < 0) return "↓";
    return "→";
  };

  const hasAnyData = state.co2 || state.airQuality || state.lakeLevels;

  return (
    <div className="space-y-4">
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ background: isLoading ? "var(--pd-muted)" : "var(--pd-blue)" }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching environmental data...
          </span>
        ) : (
          "Fetch Environmental Data"
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {hasAnyData && (
        <div className="space-y-3">
          {/* CO2 */}
          {state.co2 && (
            <div className="flex items-center gap-3 p-3 bg-pd-blue-50 rounded-lg border border-pd-blue/20">
              <span className="text-2xl">🌡️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-pd-muted uppercase tracking-wider">CO&#8322; (Mauna Loa)</p>
                <p className="text-lg font-bold" style={{ color: "var(--pd-blue)" }}>
                  {state.co2.current} <span className="text-sm font-normal">ppm</span>
                </p>
              </div>
              <div className="text-right">
                {state.co2.lastYear && (
                  <p className="text-xs text-pd-muted">
                    vs {state.co2.lastYear}{" "}
                    <span style={{ color: "var(--pd-danger)" }}>+{state.co2.change}</span>
                  </p>
                )}
                <p className="text-xs text-pd-muted">{state.co2.date}</p>
              </div>
            </div>
          )}

          {/* Air Quality */}
          {state.airQuality && (
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: `${state.airQuality.color}10`, borderColor: `${state.airQuality.color}30` }}>
              <span className="text-2xl">💨</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-pd-muted uppercase tracking-wider">Detroit Air Quality</p>
                <p className="text-lg font-bold" style={{ color: state.airQuality.color }}>
                  AQI {state.airQuality.aqi} <span className="text-sm font-normal">· {state.airQuality.category}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-pd-muted">{state.airQuality.parameter}</p>
                <p className="text-xs text-pd-muted">{state.airQuality.dateObserved}</p>
              </div>
            </div>
          )}

          {/* Lake Levels */}
          {state.lakeLevels && (state.lakeLevels.erie != null || state.lakeLevels.michiganHuron != null) && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200/30">
              <span className="text-2xl">🌊</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-pd-muted uppercase tracking-wider">Great Lakes Levels</p>
                <div className="flex gap-4 mt-1">
                  {state.lakeLevels.erie != null && (
                    <div>
                      <span className="text-sm font-bold" style={{ color: "var(--pd-blue)" }}>
                        Erie: {state.lakeLevels.erie}m
                      </span>
                      {state.lakeLevels.erieChange != null && (
                        <span className="text-xs text-pd-muted ml-1">
                          {trendArrow(state.lakeLevels.erieChange)}{Math.abs(state.lakeLevels.erieChange)}
                        </span>
                      )}
                    </div>
                  )}
                  {state.lakeLevels.michiganHuron != null && (
                    <div>
                      <span className="text-sm font-bold" style={{ color: "var(--pd-blue)" }}>
                        MI-Huron: {state.lakeLevels.michiganHuron}m
                      </span>
                      {state.lakeLevels.michiganHuronChange != null && (
                        <span className="text-xs text-pd-muted ml-1">
                          {trendArrow(state.lakeLevels.michiganHuronChange)}{Math.abs(state.lakeLevels.michiganHuronChange)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Source attribution */}
          <p className="text-xs text-pd-muted text-center">
            Data: NOAA{state.airQuality ? " · EPA AirNow" : ""}{state.lakeLevels ? " · NOAA GLERL" : ""}
            {" · "}
            <a
              href="https://www.omnicalculator.com/ecology/co2-birthday"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--pd-blue)" }}
            >
              CO&#8322; when you were born?
            </a>
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
