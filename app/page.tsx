import Link from "next/link";
import Navbar from "./components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-white px-6 pb-24 pt-20">
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #059669 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Gradient fade over grid */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-transparent to-white" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            NHS job board built for doctors
          </div>

          <h1 className="mb-5 text-[2.75rem] font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-[3.5rem]">
            Find your next{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-emerald-600">NHS role</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 -rotate-1 rounded bg-emerald-100/80" />
            </span>
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-gray-500 sm:text-xl">
            Doctor-specific filters, anonymous trust reviews, and interview
            intel —{" "}
            <span className="font-medium text-gray-700">all in one place.</span>
          </p>

          {/* Search card */}
          <div className="rounded-2xl bg-white p-2 shadow-xl ring-1 ring-gray-200/80">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 ring-1 ring-transparent focus-within:ring-emerald-300 transition-all">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Specialty — e.g. Cardiology, GP, Psychiatry"
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </label>

              <label className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 ring-1 ring-transparent focus-within:ring-emerald-300 transition-all">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Region — e.g. London, Yorkshire"
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </label>

              <Link
                href="/jobs"
                className="rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Search roles
              </Link>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Popular:{" "}
            {["Cardiology", "GP", "Emergency Medicine", "Psychiatry", "Radiology"].map((s, i) => (
              <span key={s}>
                <Link href="/jobs" className="hover:text-emerald-600 transition-colors underline underline-offset-2">
                  {s}
                </Link>
                {i < 4 ? " · " : ""}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-16 gap-y-6 px-6 py-10">
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums text-gray-900">
              6,<span className="text-emerald-600">982</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">live roles</p>
          </div>
          <div className="hidden h-12 w-px bg-gray-200 lg:block" />
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums text-gray-900">
              <span className="text-emerald-600">247</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">NHS trusts listed</p>
          </div>
          <div className="hidden h-12 w-px bg-gray-200 lg:block" />
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums text-gray-900">
              14,<span className="text-emerald-600">300</span>+
            </p>
            <p className="mt-1 text-sm text-gray-500">verified doctor reviews</p>
          </div>
          <div className="hidden h-12 w-px bg-gray-200 lg:block" />
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums text-gray-900">
              <span className="text-emerald-600">Daily</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">updated from NHS Jobs</p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">
              Built for doctors, by doctors
            </h2>
            <p className="text-base text-gray-500">
              Everything generic job boards miss.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-gray-200 hover:ring-emerald-200 hover:shadow-lg transition-all duration-200">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <svg
                  className="h-5.5 w-5.5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  style={{ width: "22px", height: "22px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-[15px] font-semibold text-gray-900">
                Doctor-specific filters
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Filter by grade (FY1 through Consultant), specialty, on-call
                frequency, LTFT-friendly, and trust type. No noise —
                just the roles that match your career stage.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {["FY1", "ST3", "Consultant", "LTFT", "1-in-8"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-gray-200 hover:ring-emerald-200 hover:shadow-lg transition-all duration-200">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <svg
                  className="text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  style={{ width: "22px", height: "22px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-[15px] font-semibold text-gray-900">
                Anonymous trust reviews
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Honest ratings from doctors who've actually worked there. Rota
                quality, consultant support, banding accuracy, culture — before
                you apply.
              </p>
              <div className="mt-5 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    viewBox="0 0 20 20"
                    fill={s <= 4 ? "#059669" : "none"}
                    stroke={s <= 4 ? "#059669" : "#d1d5db"}
                    className="h-4 w-4"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-xs font-medium text-gray-500">
                  4.2 · 38 reviews
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-gray-200 hover:ring-emerald-200 hover:shadow-lg transition-all duration-200">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <svg
                  className="text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  style={{ width: "22px", height: "22px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-[15px] font-semibold text-gray-900">
                Interview intel
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Real questions, panel formats, and preparation tips from doctors
                who've interviewed at each trust — so you walk in ready, not
                guessing.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Portfolio station
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Clinical scenario
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  MMI format
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-emerald-600 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Ready to find your next role?
          </h2>
          <p className="mb-8 text-emerald-100">
            Join 12,000+ NHS doctors who use MedRoles to find roles that
            actually fit their career.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors"
          >
            Browse all {" "}
            <span className="font-bold">6,982</span> roles
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="font-medium text-gray-500">MedRoles</span>
            <span>· Not affiliated with NHS England</span>
            <span>· © 2026</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">For trusts</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
