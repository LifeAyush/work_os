import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
