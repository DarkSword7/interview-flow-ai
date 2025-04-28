
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      id: 1,
      icon: "🤖",
      title: "AI Interview Simulations",
      description:
        "Practice with our advanced AI interviewer that adapts to your responses in real-time.",
    },
    {
      id: 2,
      icon: "📝",
      title: "Detailed Feedback",
      description:
        "Receive comprehensive feedback on your answers, communication style, and areas for improvement.",
    },
    {
      id: 3,
      icon: "📚",
      title: "Industry Expertise",
      description:
        "Access interview questions tailored to specific industries, roles, and experience levels.",
    },
    {
      id: 4,
      icon: "📊",
      title: "Performance Analytics",
      description:
        "Track your progress over time with detailed analytics and improvement metrics.",
    },
    {
      id: 5,
      icon: "🎯",
      title: "Target Weaknesses",
      description:
        "Focus on improving specific areas with customized practice sessions.",
    },
    {
      id: 6,
      icon: "📱",
      title: "Mobile Ready",
      description:
        "Practice anytime, anywhere with our responsive web application.",
    },
  ];

  return (
    <div className="bg-gray-50 py-16 md:py-24" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
            Powerful Features for <span className="gradient-text">Interview Success</span>
          </h2>
          <p className="text-gray-600 text-lg animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Our platform offers everything you need to prepare for and ace your next interview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={feature.id} className="border-0 shadow-sm card-hover animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
