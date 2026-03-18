import { Suspense } from "react";

import { AuthForm } from "../components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fde68a,_#fff7ed_40%,_#f8fafc_85%)] px-6 py-16">
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
