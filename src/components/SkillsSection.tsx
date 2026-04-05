const categories = [
  { title: "Languages", items: ["Python", "C++", "JavaScript", "TypeScript", "SQL"] },
  { title: "Backend", items: ["Django", "FastAPI", "REST APIs"] },
  { title: "Frontend", items: ["React", "TypeScript"] },
  { title: "Databases", items: ["PostgreSQL"] },
  { title: "DevOps & Tools", items: ["Docker", "Postman", "Git", "Azure"] },
  { title: "Concepts", items: ["RAG", "Vector DBs", "Async Processing", "WebSockets"] },
];

const SkillsSection = () => (
  <section id="skills" className="py-[var(--section-gap)] relative">
    <div className="container mx-auto px-6 max-w-4xl">
      <p className="text-sm font-medium text-primary tracking-wider uppercase mb-3">Skills</p>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 tracking-tight">
        Tech stack
      </h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              {cat.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-card border border-border/60 text-foreground hover:border-primary/40 hover:bg-accent transition-all duration-200 cursor-default"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SkillsSection;
