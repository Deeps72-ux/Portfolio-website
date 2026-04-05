import { Bot, Layers, ArrowUpRight } from "lucide-react";

const projects = [
  {
    icon: <Bot size={22} />,
    title: "RAG-based Chatbot",
    description: "Intelligent document Q&A system with retrieval-augmented generation.",
    details: [
      "Document parsing and embedding pipeline",
      "Vector search using FAISS / Milvus",
      "LLM-based query answering",
    ],
    tags: ["Python", "FAISS", "Milvus", "LLM"],
  },
  {
    icon: <Layers size={22} />,
    title: "Full Stack Applications",
    description: "Production-ready web applications with modern architecture.",
    details: [
      "Django / FastAPI backend with React frontend",
      "PostgreSQL database with migrations",
      "Authentication and REST API design",
    ],
    tags: ["Django", "FastAPI", "React", "PostgreSQL"],
  },
];

const ProjectsSection = () => (
  <section id="projects" className="py-[var(--section-gap)]">
    <div className="container mx-auto px-6 max-w-4xl">
      <p className="text-sm font-medium text-primary tracking-wider uppercase mb-3">Projects</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 tracking-tight">
        What I've built
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((p) => (
          <div
            key={p.title}
            className="group relative p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                {p.icon}
              </div>
              <ArrowUpRight size={18} className="text-muted-foreground/40 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{p.description}</p>

            <ul className="space-y-2 mb-5">
              {p.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProjectsSection;
