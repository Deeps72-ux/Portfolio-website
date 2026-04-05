import { Button } from "@/components/ui/button";
import { ArrowDown, Mail, Sparkles } from "lucide-react";

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center justify-center pt-[var(--nav-height)] overflow-hidden">
    {/* Grid background */}
    <div className="absolute inset-0 hero-grid opacity-60" />
    {/* Glow */}
    <div className="absolute inset-0 hero-glow" />

    <div className="relative container mx-auto px-6 text-center max-w-3xl" style={{ animationDelay: "0.1s" }}>
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/80 bg-card/60 backdrop-blur-sm text-sm text-muted-foreground mb-8">
        <Sparkles size={14} className="text-primary" />
        Software Developer
      </div>

      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
        <span className="text-foreground">Hi, I'm </span>
        <span className="gradient-text">Deepan</span>
      </h1>

      <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
        Backend developer crafting scalable APIs and AI&#8209;powered applications with modern tooling.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
          <a href="#projects">
            <ArrowDown size={16} className="mr-2" />
            View Projects
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full px-8">
          <a href="#contact">
            <Mail size={16} className="mr-2" />
            Get in Touch
          </a>
        </Button>
      </div>
    </div>
  </section>
);

export default HeroSection;
