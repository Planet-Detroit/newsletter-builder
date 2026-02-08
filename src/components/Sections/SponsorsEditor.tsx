"use client";

import { useState } from "react";
import { useNewsletter } from "@/context/NewsletterContext";
import { Sponsor, SponsorsData } from "@/types/newsletter";

export default function SponsorsEditor() {
  const { state, dispatch } = useNewsletter();
  const sectionStatus = state.sections.find((s) => s.id === "sponsors")?.status;
  const [editingChampion, setEditingChampion] = useState<number | null>(null);
  const [editingPartner, setEditingPartner] = useState<number | null>(null);
  const [newChampion, setNewChampion] = useState({ name: "", url: "" });
  const [newPartner, setNewPartner] = useState({ name: "", url: "" });

  const updateSponsors = (updated: SponsorsData) => {
    dispatch({ type: "SET_SPONSORS", payload: updated });
  };

  const addChampion = () => {
    if (!newChampion.name.trim()) return;
    updateSponsors({
      ...state.sponsors,
      champions: [...state.sponsors.champions, { name: newChampion.name.trim(), url: newChampion.url.trim() }],
    });
    setNewChampion({ name: "", url: "" });
  };

  const removeChampion = (idx: number) => {
    updateSponsors({
      ...state.sponsors,
      champions: state.sponsors.champions.filter((_, i) => i !== idx),
    });
  };

  const updateChampion = (idx: number, sponsor: Sponsor) => {
    const updated = [...state.sponsors.champions];
    updated[idx] = sponsor;
    updateSponsors({ ...state.sponsors, champions: updated });
    setEditingChampion(null);
  };

  const addPartner = () => {
    if (!newPartner.name.trim()) return;
    updateSponsors({
      ...state.sponsors,
      partners: [...state.sponsors.partners, { name: newPartner.name.trim(), url: newPartner.url.trim() }],
    });
    setNewPartner({ name: "", url: "" });
  };

  const removePartner = (idx: number) => {
    updateSponsors({
      ...state.sponsors,
      partners: state.sponsors.partners.filter((_, i) => i !== idx),
    });
  };

  const updatePartner = (idx: number, sponsor: Sponsor) => {
    const updated = [...state.sponsors.partners];
    updated[idx] = sponsor;
    updateSponsors({ ...state.sponsors, partners: updated });
    setEditingPartner(null);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-pd-muted">
        Edit the Planet Champions and Impact Partners that appear at the bottom of each newsletter.
        Click a name to edit, or use the buttons to add/remove.
      </p>

      {/* Planet Champions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider" style={{ color: "var(--pd-blue)" }}>
          Planet Champions
        </h3>
        <div className="space-y-2">
          {state.sponsors.champions.map((sponsor, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {editingChampion === idx ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={sponsor.name}
                    onChange={(e) => {
                      const updated = [...state.sponsors.champions];
                      updated[idx] = { ...sponsor, name: e.target.value };
                      updateSponsors({ ...state.sponsors, champions: updated });
                    }}
                    className="flex-1 px-2 py-1.5 border border-pd-blue rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={sponsor.url}
                    onChange={(e) => {
                      const updated = [...state.sponsors.champions];
                      updated[idx] = { ...sponsor, url: e.target.value };
                      updateSponsors({ ...state.sponsors, champions: updated });
                    }}
                    className="flex-1 px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="URL (optional)"
                  />
                  <button
                    onClick={() => updateChampion(idx, sponsor)}
                    className="px-2 py-1.5 text-xs font-medium text-white rounded"
                    style={{ background: "var(--pd-blue)" }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setEditingChampion(idx)}
                    className="flex-1 text-left px-3 py-2 text-sm border border-pd-border rounded-lg hover:border-pd-blue hover:bg-pd-blue-50 transition-colors"
                  >
                    <span className="font-medium">{sponsor.name}</span>
                    {sponsor.url && <span className="text-xs text-pd-muted ml-2">{sponsor.url}</span>}
                  </button>
                  <button
                    onClick={() => removeChampion(idx)}
                    className="w-7 h-7 flex items-center justify-center rounded text-pd-muted hover:text-red-500 hover:bg-red-50 transition-colors text-xs"
                  >
                    x
                  </button>
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newChampion.name}
              onChange={(e) => setNewChampion((s) => ({ ...s, name: e.target.value }))}
              placeholder="New champion name..."
              className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue"
              onKeyDown={(e) => e.key === "Enter" && addChampion()}
            />
            <input
              type="text"
              value={newChampion.url}
              onChange={(e) => setNewChampion((s) => ({ ...s, url: e.target.value }))}
              placeholder="URL (optional)"
              className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue"
              onKeyDown={(e) => e.key === "Enter" && addChampion()}
            />
            <button
              onClick={addChampion}
              disabled={!newChampion.name.trim()}
              className="px-3 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: "var(--pd-blue)" }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-pd-border" />

      {/* Impact Partners */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider" style={{ color: "var(--pd-blue)" }}>
          Impact Partners
        </h3>
        <div className="space-y-2">
          {state.sponsors.partners.map((sponsor, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {editingPartner === idx ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={sponsor.name}
                    onChange={(e) => {
                      const updated = [...state.sponsors.partners];
                      updated[idx] = { ...sponsor, name: e.target.value };
                      updateSponsors({ ...state.sponsors, partners: updated });
                    }}
                    className="flex-1 px-2 py-1.5 border border-pd-blue rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={sponsor.url}
                    onChange={(e) => {
                      const updated = [...state.sponsors.partners];
                      updated[idx] = { ...sponsor, url: e.target.value };
                      updateSponsors({ ...state.sponsors, partners: updated });
                    }}
                    className="flex-1 px-2 py-1.5 border border-pd-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-pd-blue"
                    placeholder="URL (optional)"
                  />
                  <button
                    onClick={() => updatePartner(idx, sponsor)}
                    className="px-2 py-1.5 text-xs font-medium text-white rounded"
                    style={{ background: "var(--pd-blue)" }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setEditingPartner(idx)}
                    className="flex-1 text-left px-3 py-1.5 text-sm border border-pd-border rounded hover:border-pd-blue hover:bg-pd-blue-50 transition-colors"
                  >
                    <span>{sponsor.name}</span>
                    {sponsor.url && <span className="text-xs text-pd-muted ml-2">{sponsor.url}</span>}
                  </button>
                  <button
                    onClick={() => removePartner(idx)}
                    className="w-7 h-7 flex items-center justify-center rounded text-pd-muted hover:text-red-500 hover:bg-red-50 transition-colors text-xs"
                  >
                    x
                  </button>
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newPartner.name}
              onChange={(e) => setNewPartner((s) => ({ ...s, name: e.target.value }))}
              placeholder="New partner name..."
              className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue"
              onKeyDown={(e) => e.key === "Enter" && addPartner()}
            />
            <input
              type="text"
              value={newPartner.url}
              onChange={(e) => setNewPartner((s) => ({ ...s, url: e.target.value }))}
              placeholder="URL (optional)"
              className="flex-1 px-3 py-2 border border-pd-border rounded-lg text-sm focus:outline-none focus:border-pd-blue"
              onKeyDown={(e) => e.key === "Enter" && addPartner()}
            />
            <button
              onClick={addPartner}
              disabled={!newPartner.name.trim()}
              className="px-3 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: "var(--pd-blue)" }}
            >
              Add
            </button>
          </div>
        </div>
        <p className="text-xs text-pd-muted mt-3">
          {state.sponsors.partners.length} partners listed
        </p>
      </div>

      <button
        onClick={() =>
          dispatch({
            type: "UPDATE_SECTION_STATUS",
            payload: { id: "sponsors", status: sectionStatus === "ready" ? "needs_attention" : "ready" },
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
  );
}
