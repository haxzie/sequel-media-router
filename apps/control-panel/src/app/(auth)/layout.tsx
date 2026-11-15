/**
 * Chromeless shell for login and onboarding. No sidebar: there is no org to
 * navigate yet, and a nav that leads nowhere is worse than none.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
