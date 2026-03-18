import { Suspense } from "react";

import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(167,139,250,0.35),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.25),transparent_20%),linear-gradient(180deg,#f8f5ff_0%,#f5f3ff_55%,#eef4ff_100%)]" />
      <div className="absolute left-[-8rem] top-12 h-64 w-64 rounded-full bg-[rgba(124,58,237,0.16)] blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-72 w-72 rounded-full bg-[rgba(59,130,246,0.14)] blur-3xl" />
      <section className="relative w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </section>
    </main>
  );
}
