import { Shield, Network, Database, GitBranch, Lock, Zap } from 'lucide-react';

const TechProjects = () => {
  const projects = [
    {
      id: 1,
      title: 'Supply Chain Transparency Platform',
      description:
        'Built a complete supply chain tracking solution using Hyperledger Fabric to ensure authenticity and transparency in fashion industry.',
      tech: ['Hyperledger Fabric', 'Node.js', 'CouchDB', 'Docker'],
      icon: Network,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: 'Decentralized Identity Management',
      description:
        'Developed a privacy-preserving identity system for artists and creators using distributed ledger technology.',
      tech: ['Hyperledger Fabric', 'Go', 'REST API', 'JWT'],
      icon: Shield,
      color: 'from-teal-500 to-emerald-500',
    },
    {
      id: 3,
      title: 'Smart Contract Asset Registry',
      description:
        'Created an immutable registry for digital art and fashion designs with proof of ownership and licensing.',
      tech: ['Chaincode', 'TypeScript', 'PostgreSQL', 'IPFS'],
      icon: Database,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 4,
      title: 'Private Blockchain Network',
      description:
        'Architected and deployed a multi-organization private blockchain network for luxury brand authentication.',
      tech: ['Hyperledger Fabric', 'Kubernetes', 'Ansible', 'Prometheus'],
      icon: Lock,
      color: 'from-slate-500 to-gray-600',
    },
  ];

  const expertise = [
    { name: 'Hyperledger Fabric', level: 95 },
    { name: 'Chaincode Development', level: 90 },
    { name: 'Network Architecture', level: 85 },
    { name: 'Smart Contracts', level: 88 },
    { name: 'Consensus Mechanisms', level: 82 },
    { name: 'Cryptography', level: 80 },
  ];

  return (
    <section id="tech" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GitBranch className="text-cyan-600" size={36} />
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Technical Projects
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise blockchain solutions built with Hyperledger Fabric
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {projects.map((project) => {
            const IconComponent = project.icon;
            return (
              <div
                key={project.id}
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-cyan-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${project.color} shadow-lg`}
                  >
                    <IconComponent className="text-white" size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 lg:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="text-cyan-400" size={32} />
            <h3 className="text-3xl font-bold text-white">Blockchain Expertise</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expertise.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">{skill.name}</span>
                  <span className="text-cyan-400 font-semibold">{skill.level}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechProjects;
