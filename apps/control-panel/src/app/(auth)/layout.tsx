import { AuthShader } from '@/components/auth/auth-shader';

/**
 * Chromeless shell for login and onboarding. No sidebar: there is no org to
 * navigate yet, and a nav that leads nowhere is worse than none.
 *
 * On a wide screen the form keeps its own half and the other half is given to
 * the contour-map panel. Below `lg` the panel is `display: none` and costs
 * nothing: the shader never opens a WebGL context until its canvas has a box,
 * so a phone pays for the markup and not the GPU.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>

      {/*
        Sticky and exactly one screen tall, so a long form (onboarding, a
        consent screen with a dozen scopes) scrolls past a panel that stays
        put rather than stretching the gradient to the height of the document.

        The inline gradient is the fallback, and it is underneath the canvas
        rather than inside it: if WebGL is missing or the context is lost, the
        panel is still a lit corner in the right colours instead of a hole.
      */}
      <div
        className="relative hidden overflow-hidden border-l border-[var(--color-line)] lg:sticky lg:top-0 lg:block lg:h-screen lg:w-1/2"
        style={{
          backgroundColor: 'var(--color-bg)',
          backgroundImage:
            'radial-gradient(120% 90% at 78% 28%, rgba(201,212,242,0.28), transparent 62%), radial-gradient(90% 80% at 24% 76%, rgba(242,201,224,0.22), transparent 64%), radial-gradient(70% 60% at 62% 92%, rgba(201,232,212,0.16), transparent 70%)',
        }}
      >
        <AuthShader />

        {/* Feather the seam so the panel resolves into the form's background
            instead of stopping at the border like a pasted image. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[var(--color-bg)] to-transparent" />
      </div>
    </div>
  );
}
