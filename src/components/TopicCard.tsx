
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TopicCardProps {
  topic: {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
  };
}

const TopicCard = ({ topic }: TopicCardProps) => {
  return (
    <Card className="overflow-hidden card-hover h-full">
      <CardContent className="p-0">
        <div className="p-6 flex flex-col h-full">
          <div className={`bg-gradient-to-br ${topic.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4`}>
            <span>{topic.icon}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
          <p className="text-gray-600 text-sm mb-6 flex-grow">{topic.description}</p>
          <Button 
            variant="outline" 
            className="mt-auto w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors" 
            asChild
          >
            <Link to={`/create-interview?topic=${topic.id}`}>
              <span>Start Practice</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="ml-2"
              >
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicCard;
