const Footer = () => (
  <footer className="py-8 border-t border-border/50">
    <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>© {new Date().getFullYear()} Deepan Kulandaisami</span>
      <span className="text-muted-foreground/60">Built with React & Tailwind</span>
    </div>
  </footer>
);

export default Footer;
