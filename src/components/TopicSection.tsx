
import { Card, CardContent } from "@/components/ui/card";
import { useRef } from "react";
import TopicCard from "./TopicCard";

const topics = [
  {
    id: 1,
    title: "Software Engineering",
    description: "Technical interviews covering algorithms, system design, and programming concepts.",
    icon: "💻",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: 2,
    title: "Product Management",
    description: "Prepare for product sense, analytical, and behavioral questions.",
    icon: "📊",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "Data Science",
    description: "Statistical analysis, machine learning concepts, and case studies.",
    icon: "📈",
    color: "from-green-500 to-teal-400",
  },
  {
    id: 4,
    title: "UX/UI Design",
    description: "Portfolio reviews, design processes, and user research methodologies.",
    icon: "🎨",
    color: "from-orange-500 to-amber-400",
  },
  {
    id: 5,
    title: "Marketing",
    description: "Strategy development, campaign analysis, and growth marketing tactics.",
    icon: "📱",
    color: "from-red-500 to-orange-400",
  },
  {
    id: 6,
    title: "Leadership",
    description: "Behavioral questions focused on team management and leadership skills.",
    icon: "👥",
    color: "from-interview-blue to-interview-indigo",
  },
  {
    id: 7,
    title: "Consulting",
    description: "Case interviews, problem-solving frameworks, and business acumen questions.",
    icon: "💼",
    color: "from-violet-600 to-purple-500",
  },
  {
    id: 8,
    title: "Finance",
    description: "Financial modeling, market analysis, and technical finance concepts.",
    icon: "💰",
    color: "from-emerald-500 to-green-400",
  },
];

const TopicSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white py-16 md:py-24" id="topics">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Specialized Interview <span className="gradient-text">Topics</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Choose from a wide range of interview topics tailored to your career path and get customized preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {topics.map((topic, index) => (
            <div key={topic.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <TopicCard topic={topic} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicSection;
