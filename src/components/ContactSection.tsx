import { Mail, Github, Linkedin, Code2, ArrowUpRight } from "lucide-react";

const links = [
  { icon: <Mail size={20} />, label: "deepksami@gmail.com", href: "mailto:deepksami@gmail.com" },
  { icon: <Github size={20} />, label: "GitHub", href: "https://github.com/deepksami" },
  { icon: <Linkedin size={20} />, label: "LinkedIn", href: "https://linkedin.com/in/deepksami" },
  { icon: <Code2 size={20} />, label: "LeetCode", href: "https://leetcode.com/deepksami" },
];

const ContactSection = () => (
  <section id="contact" className="py-[var(--section-gap)]">
    <div className="container mx-auto px-6 max-w-4xl">
      <div className="relative p-8 md:p-12 rounded-3xl border border-border/60 bg-card text-center overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30 pointer-events-none" />
        
        <div className="relative">
          <p className="text-sm font-medium text-primary tracking-wider uppercase mb-3">Contact</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Let's connect
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
            Open to interesting conversations and new opportunities.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-border/60 bg-background/80 text-sm font-medium text-foreground hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <span className="text-primary">{l.icon}</span>
                {l.label}
                <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactSection;
