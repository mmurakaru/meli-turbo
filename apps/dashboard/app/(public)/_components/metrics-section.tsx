import { Card, CardContent } from '@workspace/ui/components/card';
import { CheckCircle, Clock, MessageSquare, UserPlus, Zap } from 'lucide-react';

const metrics = [
  {
    icon: (
      <CheckCircle
        className="w-8 h-8"
        strokeWidth={1}
      />
    ),
    title: 'Completion Rate',
    description: 'Boost tour finish rates, indicating improved clarity and user engagement.',
  },
  {
    icon: (
      <Clock
        className="w-8 h-8"
        strokeWidth={1}
      />
    ),
    title: 'Time-to-Value (TTV)',
    description: 'Accelerate how quickly users experience value from your product.',
  },
  {
    icon: (
      <UserPlus
        className="w-8 h-8"
        strokeWidth={1}
      />
    ),
    title: 'User Activation Rate',
    description: 'Increase the percentage of users completing key value-realizing actions.',
  },
  {
    icon: (
      <Zap
        className="w-8 h-8"
        strokeWidth={1}
      />
    ),
    title: 'Feature Adoption',
    description: 'Enhance user interaction with highlighted features during the tour.',
  },
  {
    icon: (
      <MessageSquare
        className="w-8 h-8"
        strokeWidth={1}
      />
    ),
    title: 'User Feedback',
    description: 'Gather valuable insights on tour effectiveness through conversational AI.',
  },
];

export default function MetricsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-center mb-12">
          Enhance Your Key Onboarding Metrics
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Card
              key={metric.title}
              className="bg-gray-50  rounded-[0.25rem] p-6"
            >
              <CardContent>
                <div className="flex items-center justify-center mb-4">{metric.icon}</div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-2">{metric.title}</h3>
                <p className="text-sm text-gray-500 text-center">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
