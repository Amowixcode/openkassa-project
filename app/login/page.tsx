import { Suspense } from "react";

import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-6 py-16">
      <section className="relative w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </section>
    </main>
  );
}
