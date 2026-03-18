import { createClient } from "../../lib/supabase/server";

function getInitials(email: string | null) {
  if (!email) {
    return "OK";
  }

  const [name] = email.split("@");
  return name
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  return (
    <div className="space-y-6">
      <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-8 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
          Account and profile
        </h1>
      </article>

      <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[image:var(--app-gradient)] text-2xl font-semibold text-white">
            {getInitials(user?.email ?? null)}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[color:var(--muted)]">Signed in as</p>
            <p className="text-2xl font-semibold text-[color:var(--foreground)]">
              {user?.email ?? "Unknown user"}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
