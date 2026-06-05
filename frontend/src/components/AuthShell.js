import React from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  onGoogle,
}) {
  return (
    <main className="auth-shell min-h-[calc(100vh-88px)] bg-[linear-gradient(135deg,#f7f8f8_0%,#ffffff_42%,#ebe4d7_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="auth-shell-grid mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <section className="auth-hero hidden lg:block">
          <div className="max-w-xl">
            <p className="auth-hero-kicker mb-4 text-sm font-semibold uppercase tracking-normal text-stonebrand-gold">
              Askar Stone
            </p>
            <h1 className="auth-hero-title mb-5 text-5xl font-semibold leading-tight text-stonebrand-charcoal">
              Premium stone ordering, built for real projects.
            </h1>
            <p className="auth-hero-copy text-lg leading-8 text-stonebrand-graphite">
              Browse materials, manage orders, and coordinate custom stone work
              through a clean, secure customer account.
            </p>
            <div className="auth-feature-grid mt-8 grid grid-cols-3 gap-3">
              {["Natural stone", "Custom sizing", "Order tracking"].map((item) => (
                <div
                  key={item}
                  className="auth-feature rounded-lg border border-black/10 bg-white/70 px-4 py-3 text-sm font-medium text-stonebrand-graphite shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-card mx-auto w-full max-w-[440px] rounded-lg border border-black/10 bg-white p-6 shadow-auth sm:p-8">
          <div className="auth-card-header mb-6 text-center">
            <p className="auth-eyebrow mb-2 text-xs font-bold uppercase tracking-normal text-stonebrand-gold">
              {eyebrow}
            </p>
            <h2 className="auth-title m-0 text-3xl font-semibold text-stonebrand-charcoal">
              {title}
            </h2>
            <p className="auth-subtitle mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-600">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="auth-divider my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-normal text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            or
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            className="auth-google-button flex h-12 w-full items-center justify-center gap-3 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-stonebrand-gold hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stonebrand-amber/25"
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>

          {footer && (
            <div className="auth-footer mt-6 text-center text-sm text-stone-600">
              {footer}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function AuthLink({ to, children }) {
  return (
    <Link
      to={to}
      className="auth-link font-semibold text-stonebrand-gold no-underline transition hover:text-stonebrand-charcoal"
    >
      {children}
    </Link>
  );
}
