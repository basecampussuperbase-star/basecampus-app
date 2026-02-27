import Link from "next/link";

// Actually, I haven't created the Button component yet. I'll stick to raw HTML/Tailwind for this first pass to avoid errors.

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-20">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Logo / Brand Name */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-6xl font-bold tracking-tighter sm:text-8xl text-foreground">
            BASE<span className="text-wine">.</span>
          </h1>
          <p className="text-sm font-light tracking-[0.2em] text-muted-foreground uppercase">
            Plataforma Educativa Híbrida
          </p>
        </div>

        {/* Value Proposition */}
        <p className="text-xl text-muted-foreground leading-relaxed">
          El lienzo para las ideas de los mentores.
          <br />
          <span className="text-foreground font-medium">Desde Venezuela para el mundo.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <Link href="/register" className="rounded-full bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-black/90 transition-colors">
            Soy Mentor
          </Link>
          <Link href="/dashboard/bookings" className="rounded-full border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            Explorar Espacios
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-8 text-xs text-muted-foreground">
        © 2026 BASE Platform. Todos los derechos reservados.
      </footer>
    </div>
  );
}
