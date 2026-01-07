import { Scissors, Palette, Laptop, Network, Layers, Box } from 'lucide-react';

const Skills = () => {
  const skillCategories = [
    {
      category: 'Fashion & Design',
      icon: Scissors,
      color: 'from-pink-500 to-rose-500',
      skills: [
        'Haute Couture',
        'Pattern Making',
        'Textile Design',
        'Fashion Illustration',
        'Draping',
        'Sustainable Fashion',
        'Trend Forecasting',
        'Collection Development',
      ],
    },
    {
      category: 'Visual Arts',
      icon: Palette,
      color: 'from-cyan-500 to-teal-500',
      skills: [
        'Mixed Media',
        'Digital Art',
        'Color Theory',
        'Composition',
        'Adobe Creative Suite',
        'Conceptual Art',
        'Installation Art',
        'Art Direction',
      ],
    },
    {
      category: 'Blockchain Development',
      icon: Network,
      color: 'from-blue-500 to-cyan-600',
      skills: [
        'Hyperledger Fabric',
        'Chaincode (Go/Node.js)',
        'Smart Contracts',
        'DLT Architecture',
        'Consensus Algorithms',
        'Network Configuration',
        'Certificate Authorities',
        'Channel Management',
      ],
    },
    {
      category: 'Technical Stack',
      icon: Laptop,
      color: 'from-slate-600 to-gray-700',
      skills: [
        'JavaScript/TypeScript',
        'Go',
        'Node.js',
        'Docker',
        'Kubernetes',
        'REST APIs',
        'CouchDB/PostgreSQL',
        'Git',
      ],
    },
    {
      category: 'Tools & Platforms',
      icon: Box,
      color: 'from-teal-600 to-emerald-600',
      skills: [
        'Fabric SDK',
        'Fabric CA',
        'Docker Compose',
        'Postman',
        'Prometheus',
        'Grafana',
        'IPFS',
        'Linux',
      ],
    },
    {
      category: 'Soft Skills',
      icon: Layers,
      color: 'from-amber-500 to-orange-500',
      skills: [
        'Creative Problem Solving',
        'Technical Communication',
        'Project Management',
        'Interdisciplinary Thinking',
        'Team Collaboration',
        'Client Relations',
        'Design Thinking',
        'Innovation',
      ],
    },
  ];

  return (
    <section id="skills" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Skills & Expertise
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive toolkit spanning creative and technical domains
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.category}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${category.color} shadow-md`}
                  >
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {category.category}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-8 lg:p-12 text-center shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-4">
            Unique Interdisciplinary Approach
          </h3>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            My diverse skill set allows me to bridge the gap between creative expression and
            technical implementation, bringing innovative solutions to complex challenges in both
            the fashion industry and blockchain ecosystem.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Skills;
