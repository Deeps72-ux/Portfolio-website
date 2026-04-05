import { Award, ExternalLink } from "lucide-react";

const certs = [
  { name: "Azure Developer Associate", code: "AZ-204", color: "from-blue-500/10 to-indigo-500/10" },
  { name: "Azure Fundamentals", code: "AZ-900", color: "from-cyan-500/10 to-blue-500/10" },
];

const CertificationsSection = () => (
  <section id="certifications" className="py-[var(--section-gap)]">
    <div className="container mx-auto px-6 max-w-4xl">
      <p className="text-sm font-medium text-primary tracking-wider uppercase mb-3">Certifications</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 tracking-tight">
        Credentials
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {certs.map((c) => (
          <div
            key={c.code}
            className="group flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0`}>
              <Award size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.code}</p>
            </div>
            <ExternalLink size={16} className="text-muted-foreground/30 group-hover:text-primary shrink-0 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CertificationsSection;
