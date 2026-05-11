"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPECIALTIES, GRADES } from "../lib/jobs";

function PrivacyDisclosure() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex justify-end">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Anonymous
          <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-8 z-10 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <p className="text-[11px] leading-relaxed text-gray-500">
              <span className="font-semibold text-gray-700">Your anonymity is protected.</span> Reports are stored without any account, email or IP address linked to them. Your grade and specialty are optional, omit them if your role is distinctive enough to identify you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const FORMATS = ["Panel interview", "Portfolio-based", "OSCE / clinical stations", "Situational judgement", "Presentation", "Informal chat", "Other"];
const DIFFICULTIES = [
  { value: 1, label: "Very easy" },
  { value: 2, label: "Easy" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Hard" },
  { value: 5, label: "Very hard" },
];

export default function InterviewForm({
  trusts,
  defaultTrustId,
}: {
  trusts: { id: string; name: string }[];
  defaultTrustId?: string;
}) {
  const router = useRouter();
  const [trustId, setTrustId] = useState(defaultTrustId ?? "");
  const [specialty, setSpecialty] = useState("");
  const [grade, setGrade] = useState("");
  const [format, setFormat] = useState("");
  const [questions, setQuestions] = useState("");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [gotOffer, setGotOffer] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trustId || !specialty) {
      setError("Please select a trust and specialty.");
      return;
    }
    setStatus("submitting");
    setError("");

    const res = await fetch("/api/interview-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trust_id: trustId,
        specialty,
        grade: grade || null,
        format: format || null,
        questions_asked: questions.trim() || null,
        difficulty,
        got_offer: gotOffer,
      }),
    });

    if (res.ok) {
      setStatus("success");
      setTrustId(defaultTrustId ?? ""); setSpecialty(""); setGrade(""); setFormat("");
      setQuestions(""); setDifficulty(null); setGotOffer(null);
      router.refresh(); // re-fetch server component so new submission appears
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: "Submission failed." }));
      setError(msg ?? "Submission failed.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
        <p className="font-medium text-emerald-700">Thanks for sharing!</p>
        <p className="mt-1 text-sm text-emerald-600">Your insight helps doctors prepare for their interviews.</p>
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
      <PrivacyDisclosure />

      {/* Trust */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Trust <span className="text-red-500">*</span>
        </label>
        <select
          value={trustId}
          onChange={(e) => setTrustId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Select a trust…</option>
          {trusts.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Specialty + Grade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Specialty <span className="text-red-500">*</span>
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Select…</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Grade applied for</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Any grade</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Format */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Interview format</label>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(format === f ? "" : f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                format === f
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
                  : "bg-white text-gray-600 ring-gray-200 hover:ring-emerald-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Questions asked */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Questions you were asked</label>
        <textarea
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          rows={4}
          placeholder={"e.g.\n• Tell me about a time you dealt with a difficult colleague\n• Why this trust?\n• Describe a clinical governance situation you were involved in"}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
        />
      </div>

      {/* Difficulty + Outcome */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700">Difficulty</label>
          <div className="flex flex-col gap-1.5">
            {DIFFICULTIES.map((d) => (
              <label key={d.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="difficulty"
                  checked={difficulty === d.value}
                  onChange={() => setDifficulty(d.value)}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-gray-600">{d.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700">Outcome</label>
          <div className="flex flex-col gap-1.5">
            {[{ val: true, label: "Got the offer" }, { val: false, label: "No offer" }].map(({ val, label }) => (
              <label key={String(val)} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="outcome"
                  checked={gotOffer === val}
                  onChange={() => setGotOffer(val)}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {status === "submitting" ? "Submitting…" : "Share experience"}
        </button>
      </div>
    </form>
  );
}
