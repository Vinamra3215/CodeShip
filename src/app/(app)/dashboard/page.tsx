import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {session.user?.name} 👋
          </h1>
          <p className="mt-2 text-zinc-400">
            Your competitive programming journey starts here.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">
            Dashboard charts and stats coming in Week 2.{" "}
            <Link href="/settings" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
              Add your platform handles
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
    </main>
  );
}
