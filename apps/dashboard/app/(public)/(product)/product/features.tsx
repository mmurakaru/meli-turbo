import { Mic, Sparkles, Users, Zap } from 'lucide-react';

const features = [
  {
    name: 'Voice-Powered Tours',
    description: 'Create interactive tours with our voice AI agent.',
    icon: Mic,
  },
  {
    name: 'Personalization',
    description: 'Tailor tours to individual user needs.',
    icon: Sparkles,
  },
  {
    name: 'Lightning-Fast Setup',
    description: 'Get your product tours up and running in minutes, not hours.',
    icon: Zap,
  },
  {
    name: 'Multi-User Support',
    description: 'Seamlessly guide multiple users through your product simultaneously.',
    icon: Users,
  },
];

export default function Features() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Powerful Features</h2>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Discover how our voice AI can transform your product tours
        </p>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="pt-6 h-full"
          >
            <div className="flow-root rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 border border-violet-500 rounded-[0.25rem]">
                    <feature.icon
                      strokeWidth={1}
                      className="h-6 w-6 text-white stroke-violet-500"
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.name}</h3>
                <p className="mt-5 text-base text-gray-500">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
