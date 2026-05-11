"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SPECIALTIES, GRADES } from "../lib/jobs";

const RATINGS = [1, 2, 3, 4, 5];

function TrustCombobox({
  trusts,
  value,
  onChange,
}: {
  trusts: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = trusts.find((t) => t.id === value) ?? null;
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? trusts.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : trusts.slice(0, 50);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed but didn't pick, revert input to selected name
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selected]);

  function select(trust: { id: string; name: string }) {
    onChange(trust.id);
    setQuery(trust.name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder="Search trusts…"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.map((t) => (
            <li
              key={t.id}
              onMouseDown={() => select(t)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                t.id === value ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-600">{label}</p>
      <div className="flex gap-0.5">
        {RATINGS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(null)}
            className="p-0.5"
          >
            <svg
              viewBox="0 0 20 20"
              fill={(hover ?? value ?? 0) >= s ? "#059669" : "none"}
              stroke={(hover ?? value ?? 0) >= s ? "#059669" : "#d1d5db"}
              className="h-5 w-5 transition-colors"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewForm({
  trusts,
  defaultTrustId,
}: {
  trusts: { id: string; name: string }[];
  defaultTrustId?: string;
}) {
  const router = useRouter();
  const [trustId, setTrustId] = useState(defaultTrustId ?? "");
  const [grade, setGrade] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [overall, setOverall] = useState<number | null>(null);
  const [training, setTraining] = useState<number | null>(null);
  const [rota, setRota] = useState<number | null>(null);
  const [culture, setCulture] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trustId || overall === null) {
      setError("Please select a trust and give an overall rating.");
      return;
    }
    setStatus("submitting");
    setError("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trust_id: trustId,
        grade: grade || null,
        specialty: specialty || null,
        overall_rating: overall,
        training_rating: training,
        rota_rating: rota,
        culture_rating: culture,
        review_text: text.trim() || null,
      }),
    });

    if (res.ok) {
      setStatus("success");
      setTrustId(defaultTrustId ?? ""); setGrade(""); setSpecialty(""); setText("");
      setOverall(null); setTraining(null); setRota(null); setCulture(null);
      router.refresh();
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: "Submission failed." }));
      setError(msg ?? "Submission failed.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
        <p className="font-medium text-emerald-700">Thank you for your review!</p>
        <p className="mt-1 text-sm text-emerald-600">Your experience helps other doctors make better decisions.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-emerald-700 underline hover:no-underline"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Trust */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Trust <span className="text-red-500">*</span>
        </label>
        <TrustCombobox trusts={trusts} value={trustId} onChange={setTrustId} />
      </div>

      {/* Grade + Specialty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Any grade</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Specialty</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Any specialty</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StarPicker label="Overall *" value={overall} onChange={setOverall} />
        <StarPicker label="Training" value={training} onChange={setTraining} />
        <StarPicker label="Rota" value={rota} onChange={setRota} />
        <StarPicker label="Culture" value={culture} onChange={setCulture} />
      </div>

      {/* Review text */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Your review</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="What was it like working here? How was the team, workload, support for training…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
        />
        <p className="mt-1.5 text-[11px] text-gray-400">
          Do not include names of colleagues or patients, patient details, or contact information.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="rounded-lg bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
        <p className="text-[11px] leading-relaxed text-gray-500">
          <span className="font-semibold text-gray-600">Your anonymity is protected.</span> Reviews are stored without any account, email, or IP address linked to them. Your grade and specialty are optional — omit them if your role is distinctive enough to identify you.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Completely anonymous — no account needed.</p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {status === "submitting" ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
