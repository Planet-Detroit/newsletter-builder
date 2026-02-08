"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { AdSlot } from "@/types/newsletter";

const POSITIONS = [
  { value: "after-intro" as const, label: "After Intro" },
  { value: "after-pd-stories" as const, label: "After PD Stories" },
  { value: "after-reading" as const, label: "After What We're Reading" },
  { value: "before-footer" as const, label: "Before Footer" },
];

export default function AdManager() {
  const { state, dispatch } = useNewsletter();
  const sectionStatus = state.sections.find((s) => s.id === "ads")?.status;
  const [newAd, setNewAd] = useState({ name: "", html: "", position: "after-intro" as AdSlot["position"] });

  const addAd = () => {
    if (!newAd.name || !newAd.html) return;
    const ad: AdSlot = {
      id: `ad-${Date.now()}`,
      name: newAd.name,
      htmlContent: newAd.html,
      position: newAd.position,
      active: true,
    };
    dispatch({ type: "SET_ADS", payload: [...state.ads, ad] });
    setNewAd({ name: "", html: "", position: "after-intro" });
  };

  const toggleAd = (id: string) => {
    const updated = state.ads.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    dispatch({ type: "SET_ADS", payload: updated });
  };

  const removeAd = (id: string) => {
    dispatch({ type: "SET_ADS", payload: state.ads.filter((a) => a.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-pd-border rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-foreground">Add New Ad Slot</h4>
        <input
          type="text"
          value={newAd.name}
          onChange={(e) => setNewAd((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ad name (e.g., Sponsor - February)"
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue"
        />
        <select
          value={newAd.position}
          onChange={(e) => setNewAd((p) => ({ ...p, position: e.target.value as AdSlot["position"] }))}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue"
        >
          {POSITIONS.map((pos) => (
            <option key={pos.value} value={pos.value}>{pos.label}</option>
          ))}
        </select>
        <textarea
          value={newAd.html}
          onChange={(e) => setNewAd((p) => ({ ...p, html: e.target.value }))}
          placeholder="Paste ad HTML here..."
          rows={5}
          className="w-full px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue font-mono"
        />
        <button
          onClick={addAd}
          disabled={!newAd.name || !newAd.html}
          className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
          style={{ background: "var(--pd-blue)" }}
        >
          Add Ad Slot
        </button>
      </div>

      {state.ads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Active Ad Slots</h4>
          {state.ads.map((ad) => (
            <div key={ad.id} className="flex items-center justify-between p-3 border border-pd-border rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAd(ad.id)}
                  className={`w-10 h-5 rounded-full transition-colors ${ad.active ? "bg-pd-blue" : "bg-slate-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${ad.active ? "translate-x-5" : ""}`} />
                </button>
                <div>
                  <p className="text-sm font-medium">{ad.name}</p>
                  <p className="text-xs text-pd-muted">
                    {POSITIONS.find((p) => p.value === ad.position)?.label}
                  </p>
                </div>
              </div>
              <button onClick={() => removeAd(ad.id)} className="text-pd-danger text-xs hover:underline">
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={() =>
              dispatch({
                type: "UPDATE_SECTION_STATUS",
                payload: { id: "ads", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
              })
            }
            className="w-full px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors cursor-pointer"
            style={
              sectionStatus === "ready"
                ? { borderColor: "var(--pd-success)", background: "var(--pd-success)", color: "#fff" }
                : { borderColor: "var(--pd-success)", color: "var(--pd-success)" }
            }
          >
            {sectionStatus === "ready" ? "✓ Ready — click to unmark" : "Mark as Ready"}
          </button>
        </div>
      )}
    </div>
  );
}
