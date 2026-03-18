import { Suspense } from "react";

import { AuthForm } from "../components/auth-form";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.3),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.22),transparent_18%),linear-gradient(180deg,#faf7ff_0%,#f5f3ff_52%,#eef4ff_100%)]" />
      <div className="absolute left-[-7rem] top-20 h-64 w-64 rounded-full bg-[rgba(167,139,250,0.18)] blur-3xl" />
      <div className="absolute bottom-8 right-[-5rem] h-72 w-72 rounded-full bg-[rgba(59,130,246,0.14)] blur-3xl" />
      <section className="relative w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </section>
    </main>
  );
}
