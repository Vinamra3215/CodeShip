"use client";

import { useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";

const PLATFORMS = [
  {
    id: "CODEFORCES" as const,
    label: "Codeforces",
    accent: "border-blue-500/40",
    dot: "bg-blue-500",
    placeholder: "e.g. tourist",
    syncEndpoint: "/api/sync/codeforces",
  },
  {
    id: "LEETCODE" as const,
    label: "LeetCode",
    accent: "border-orange-500/40",
    dot: "bg-orange-500",
    placeholder: "e.g. neal_wu",
    syncEndpoint: null,
  },
  {
    id: "CODECHEF" as const,
    label: "CodeChef",
    accent: "border-amber-500/40",
    dot: "bg-amber-500",
    placeholder: "e.g. gennady",
    syncEndpoint: null,
  },
  {
    id: "GFG" as const,
    label: "GeeksforGeeks",
    accent: "border-green-500/40",
    dot: "bg-green-500",
    placeholder: "e.g. your_handle",
    syncEndpoint: null,
  },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

type ProfileData = {
  id: string;
  name: string;
  email: string;
  college: string;
  profiles: Array<{
    platform: PlatformId;
    username: string;
    problemsSolved: number;
    rating: number | null;
    lastFetched: string | null;
  }>;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getProfile(data: ProfileData | undefined, platform: PlatformId) {
  return data?.profiles?.find((p) => p.platform === platform);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR<ProfileData>("/api/profile", fetcher);

  const [handles, setHandles] = useState<Record<PlatformId, string>>({
    CODEFORCES: "",
    LEETCODE: "",
    CODECHEF: "",
    GFG: "",
  });

  const [saving, setSaving] = useState<Record<PlatformId, boolean>>({
    CODEFORCES: false,
    LEETCODE: false,
    CODECHEF: false,
    GFG: false,
  });

  const [syncing, setSyncing] = useState<Record<PlatformId, boolean>>({
    CODEFORCES: false,
    LEETCODE: false,
    CODECHEF: false,
    GFG: false,
  });

  const [feedback, setFeedback] = useState<Record<PlatformId, { ok: boolean; msg: string } | null>>({
    CODEFORCES: null,
    LEETCODE: null,
    CODECHEF: null,
    GFG: null,
  });

  async function handleSave(platform: PlatformId) {
    const username = handles[platform].trim() || getProfile(data, platform)?.username || "";
    if (!username) return;

    setSaving((s) => ({ ...s, [platform]: true }));
    setFeedback((f) => ({ ...f, [platform]: null }));

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, username }),
    });

    setSaving((s) => ({ ...s, [platform]: false }));
    setFeedback((f) => ({
      ...f,
      [platform]: res.ok
        ? { ok: true, msg: "Handle saved successfully" }
        : { ok: false, msg: "Failed to save. Please try again." },
    }));

    if (res.ok) {
      setHandles((h) => ({ ...h, [platform]: "" }));
      mutate();
      toast.success("Handle saved");
    } else {
      toast.error("Failed to save handle");
    }
  }

  async function handleRemove(platform: PlatformId) {
    const res = await fetch(`/api/profile/${platform.toLowerCase()}`, {
      method: "DELETE",
    });
    if (res.ok) {
      mutate();
      toast.success("Handle removed");
    }
  }

  async function handleSync(platform: PlatformId, endpoint: string) {
    setSyncing((s) => ({ ...s, [platform]: true }));
    setFeedback((f) => ({ ...f, [platform]: null }));

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const result = await res.json();

      if (res.ok) {
        setFeedback((f) => ({
          ...f,
          [platform]: {
            ok: true,
            msg: `Synced! ${result.totalSolved} problems, Rating: ${result.rating ?? "N/A"}, +${result.newProblems} new`,
          },
        }));
        mutate();
        toast.success(`Synced! +${result.newProblems} new problems found`);
      } else {
        setFeedback((f) => ({
          ...f,
          [platform]: { ok: false, msg: result.error || "Sync failed" },
        }));
      }
    } catch {
      setFeedback((f) => ({
        ...f,
        [platform]: { ok: false, msg: "Network error during sync" },
      }));
    }

    setSyncing((s) => ({ ...s, [platform]: false }));
  }

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Connect your competitive programming accounts to start tracking.
        </p>

        {isLoading ? (
          <div className="mt-10 text-center text-zinc-500">Loading...</div>
        ) : (
          <>
            {data && (
              <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Account
                </p>
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-white">{data.name}</p>
                  <p className="text-sm text-zinc-400">{data.email}</p>
                  <p className="text-sm text-zinc-400">{data.college}</p>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Platform Handles
              </p>

              {PLATFORMS.map((platform) => {
                const existing = getProfile(data, platform.id);
                const fb = feedback[platform.id];

                return (
                  <div
                    key={platform.id}
                    className={`rounded-xl border bg-zinc-900 p-6 transition ${
                      existing ? platform.accent : "border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${platform.dot}`} />
                        <span className="font-medium text-white">{platform.label}</span>
                        {existing && (
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                            @{existing.username}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {existing && platform.syncEndpoint && (
                          <button
                            id={`sync-${platform.id.toLowerCase()}`}
                            onClick={() => handleSync(platform.id, platform.syncEndpoint!)}
                            disabled={syncing[platform.id]}
                            className="rounded-lg border border-blue-600/50 px-3 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-600/10 disabled:opacity-50"
                          >
                            {syncing[platform.id] ? (
                              <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                                Syncing…
                              </span>
                            ) : (
                              "Sync now"
                            )}
                          </button>
                        )}
                        {existing && (
                          <button
                            onClick={() => handleRemove(platform.id)}
                            className="text-xs text-zinc-600 transition hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {existing && (
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                        <span>{existing.problemsSolved} problems solved</span>
                        {existing.rating && <span>Rating: {existing.rating}</span>}
                        {existing.lastFetched && (
                          <span>Synced: {timeAgo(existing.lastFetched)}</span>
                        )}
                        {!platform.syncEndpoint && (
                          <span className="italic text-zinc-600">Sync coming soon</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <input
                        id={`handle-${platform.id.toLowerCase()}`}
                        type="text"
                        value={handles[platform.id]}
                        onChange={(e) =>
                          setHandles((h) => ({ ...h, [platform.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSave(platform.id)}
                        placeholder={existing ? `Change @${existing.username}` : platform.placeholder}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        id={`save-${platform.id.toLowerCase()}`}
                        onClick={() => handleSave(platform.id)}
                        disabled={saving[platform.id]}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {saving[platform.id] ? "Saving..." : existing ? "Update" : "Save"}
                      </button>
                    </div>

                    {fb && (
                      <p className={`mt-2 text-xs ${fb.ok ? "text-green-400" : "text-red-400"}`}>
                        {fb.msg}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
