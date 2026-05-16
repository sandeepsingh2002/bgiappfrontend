import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-slate-100 p-6">
      <div className="w-full max-w-2xl rounded-3xl border bg-white/80 p-10 shadow-xl backdrop-blur">
        <h1 className="text-4xl font-bold tracking-tight">Supply Chain Traceability Portal</h1>
        <p className="mt-4 text-muted-foreground">
          Open the admin control room to manage verification requests and inspect movement history.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex rounded-md bg-primary px-5 py-2.5 text-primary-foreground" href="/admin/login">
            Go to Admin Login
          </Link>
          <Link className="inline-flex rounded-md bg-green-600 px-5 py-2.5 text-white hover:bg-green-700" href="/marketplace">
            Browse Marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
