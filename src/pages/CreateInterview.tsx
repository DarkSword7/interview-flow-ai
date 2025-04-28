
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateInterview = () => {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topic');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateInterview = () => {
    setIsCreating(true);
    
    // Simulate creating interview session
    setTimeout(() => {
      setIsCreating(false);
      toast({
        title: "Interview session created",
        description: "Your AI interviewer is ready. Good luck!",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-interview-blue to-interview-purple rounded-lg"></div>
          <span className="text-xl font-bold gradient-text">AI Interviewer</span>
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create Your Interview Session</h1>
          <p className="text-gray-600 mb-8">Customize your practice interview to match your needs</p>
          
          <Card className="border-0 shadow-lg animate-fade-in-up">
            <CardHeader>
              <CardTitle>Interview Settings</CardTitle>
              <CardDescription>
                Configure your interview parameters for the most effective practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-interview-blue/5 rounded-lg border border-interview-blue/20">
                <h3 className="font-medium text-lg mb-2">Selected Topic</h3>
                <div className="text-interview-blue text-sm">
                  {topicId ? `Interview topic ID: ${topicId}` : "No specific topic selected"}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  You can change the topic or select specific questions before starting
                </p>
              </div>
              
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold mb-2">Your AI Interviewer is Ready</h2>
                <p className="text-gray-600 mb-6">
                  Get ready for an immersive interview experience tailored to your needs
                </p>
                <Button 
                  onClick={handleCreateInterview}
                  className="btn-primary text-lg px-8 py-6"
                  disabled={isCreating}
                >
                  {isCreating ? "Setting up your interview..." : "Start Interview Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateInterview;
