import Link from "next/link";

const FEATURES = [
  {
    icon: "📊",
    title: "Unified Dashboard",
    desc: "View Codeforces, LeetCode, CodeChef and GFG stats in one place.",
  },
  {
    icon: "📈",
    title: "Rating Tracker",
    desc: "Interactive charts showing your rating history across platforms.",
  },
  {
    icon: "🏷️",
    title: "Topic Analysis",
    desc: "Know your strengths and weaknesses with topic-wise breakdowns.",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "Compare with IIT Jodhpur peers across all platforms.",
  },
  {
    icon: "🤖",
    title: "AI Coach",
    desc: "Get personalized practice suggestions powered by Gemini.",
  },
  {
    icon: "🔄",
    title: "Auto Sync",
    desc: "Background sync keeps your data fresh with staleness detection.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold tracking-tight">
          Code<span className="text-indigo-400">ship</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 w-fit rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
          Built for IIT Jodhpur students
        </div>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Track all your{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            CP profiles
          </span>{" "}
          in one place
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-400">
          Aggregate your Codeforces, LeetCode, CodeChef and GFG stats into a
          single dashboard. Analyze topics, compare with peers, and get
          AI-powered coaching.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Sign in →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        Codeship — Built with Next.js, Prisma, and Gemini AI
      </footer>
    </main>
  );
}
