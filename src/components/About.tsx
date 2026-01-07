import { Palette, Code2, Sparkles } from 'lucide-react';

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Where Art Meets Technology
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A unique blend of creative expression and technical expertise
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="prose prose-lg text-gray-700">
              <p className="text-lg leading-relaxed">
                I'm a multidisciplinary creative professional who seamlessly navigates between
                the worlds of fashion design, visual arts, and blockchain technology. My work
                represents a unique intersection of aesthetic innovation and technical precision.
              </p>
              <p className="text-lg leading-relaxed">
                With a passion for pushing boundaries, I create fashion pieces that challenge
                conventions while simultaneously developing decentralized solutions using
                Hyperledger Fabric. This dual expertise allows me to bring a unique perspective
                to both creative and technical projects.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-semibold">
                Fashion Design
              </span>
              <span className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold">
                Visual Arts
              </span>
              <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                Blockchain Engineering
              </span>
              <span className="px-4 py-2 bg-slate-50 text-slate-700 rounded-full text-sm font-semibold">
                Hyperledger Fabric
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Palette className="text-cyan-600 mb-4" size={40} />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Creative Designer</h3>
              <p className="text-gray-700">
                Crafting unique fashion pieces and visual art that tell stories and evoke emotions.
                Each creation is a carefully curated expression of artistic vision.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Code2 className="text-blue-600 mb-4" size={40} />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Blockchain Engineer</h3>
              <p className="text-gray-700">
                Building enterprise-grade decentralized applications with Hyperledger Fabric.
                Specializing in secure, scalable distributed ledger solutions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="text-teal-600 mb-4" size={40} />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Innovation Bridge</h3>
              <p className="text-gray-700">
                Merging creative thinking with technical problem-solving to create solutions
                that are both beautiful and functional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
