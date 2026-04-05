import { Briefcase } from "lucide-react";

const bullets = [
  "Built backend APIs using Django and FastAPI for production services",
  "Developed RAG systems with FAISS and Milvus for intelligent vector search",
  "Implemented Celery-based async pipelines for background processing",
  "Built real-time communication features using WebSockets",
];

const ExperienceSection = () => (
  <section id="experience" className="py-[var(--section-gap)]">
    <div className="container mx-auto px-6 max-w-4xl">
      <p className="text-sm font-medium text-primary tracking-wider uppercase mb-3">Experience</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 tracking-tight">
        Where I've worked
      </h2>

      <div className="relative p-6 md:p-8 rounded-2xl border border-border/60 bg-card">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Software Developer</h3>
            <p className="text-primary font-medium">Bonbloc Technologies</p>
          </div>
        </div>

        <ul className="space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-muted-foreground">
              <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default ExperienceSection;
