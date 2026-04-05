import { Code2, Brain, Zap } from "lucide-react";

const highlights = [
  {
    icon: <Code2 size={20} />,
    title: "Backend Engineering",
    desc: "Building production APIs with Django, FastAPI, and PostgreSQL — clean, maintainable, and well-tested.",
  },
  {
    icon: <Brain size={20} />,
    title: "AI Applications",
    desc: "RAG-based systems using FAISS and Milvus for intelligent document retrieval and LLM-powered Q&A.",
  },
  {
    icon: <Zap size={20} />,
    title: "Real-time & Async",
    desc: "Celery for background task processing and WebSockets for real-time communication features.",
  },
];

const AboutSection = () => (
  <section id="about" className="py-[var(--section-gap)]">
    <div className="container mx-auto px-6 max-w-4xl">
      <p className="text-sm font-medium text-primary tracking-wider uppercase mb-3">About</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
        What I do
      </h2>
      <p className="text-muted-foreground text-lg max-w-2xl mb-12 leading-relaxed">
        Software Developer working in an Agile environment, currently deepening skills in data structures, algorithms, and system design.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
              {h.icon}
            </div>
            <h3 className="font-semibold text-foreground mb-2">{h.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
