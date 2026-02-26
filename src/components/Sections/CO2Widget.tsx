"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";

export default function CO2Widget() {
  const { state, dispatch } = useNewsletter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCo2 = async () => {
    setIsLoading(true);
    setError(null);
    dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "loading" } });
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
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "ready" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "CO₂ fetch failed");
      dispatch({ type: "UPDATE_SECTION_STATUS", payload: { id: "co2", status: "empty" } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={fetchCo2}
        disabled={isLoading}
        className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ background: isLoading ? "var(--pd-muted)" : "var(--pd-blue)" }}
      >
        {isLoading ? "Fetching…" : "Fetch CO₂ Data"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {state.co2 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg border border-pd-border">
            <p className="text-sm flex-1">
              <span className="font-bold" style={{ color: "var(--pd-blue)" }}>{state.co2.current}</span>{" "}
              <span className="text-xs text-pd-muted">ppm</span>
              {state.co2.lastYear != null && (
                <span className="text-xs text-pd-muted ml-2">
                  vs {state.co2.lastYear} last year{" "}
                  <span style={{ color: "var(--pd-danger)" }}>+{state.co2.change}</span>
                </span>
              )}
            </p>
            <button
              onClick={() => dispatch({ type: "SET_CO2", payload: null })}
              className="text-xs text-pd-muted hover:text-pd-danger cursor-pointer"
              title="Remove CO₂"
            >✕</button>
          </div>
          <p className="text-xs text-pd-muted text-center">Source: NOAA Mauna Loa Observatory</p>
        </div>
      )}
    </div>
  );
}
