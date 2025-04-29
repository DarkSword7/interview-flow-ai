import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSearchParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Interview topic options
const INTERVIEW_TOPICS = [
  { id: "software-development", name: "Software Development" },
  { id: "data-science", name: "Data Science" },
  { id: "product-management", name: "Product Management" },
  { id: "marketing", name: "Marketing" },
  { id: "ux-design", name: "UX Design" },
  { id: "sales", name: "Sales" },
  { id: "finance", name: "Finance" },
  { id: "customer-service", name: "Customer Service" },
  { id: "human-resources", name: "Human Resources" },
  { id: "executive", name: "Executive Leadership" },
];

// Voice options
const VOICE_OPTIONS = [
  { id: "adam", name: "Adam (Male)" },
  { id: "rachel", name: "Rachel (Female)" },
  { id: "onyx", name: "Onyx (Male Professional)" },
  { id: "nova", name: "Nova (Female Professional)" },
];

// Difficulty options
const DIFFICULTY_OPTIONS = [
  {
    id: "easy",
    name: "Entry Level",
    description: "Basic questions for beginners",
  },
  {
    id: "medium",
    name: "Mid Level",
    description: "Standard interview difficulty",
  },
  {
    id: "hard",
    name: "Senior Level",
    description: "Advanced questions for experienced professionals",
  },
];

const CreateInterview = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get topic from search params or previous state
  const topicFromParams = searchParams.get("topic");
  const { previousTopic } = location.state || {};

  // State variables
  const [selectedTopic, setSelectedTopic] = useState(
    topicFromParams || previousTopic || "software-development"
  );
  const [selectedVoice, setSelectedVoice] = useState("adam");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // Check if browser supports speech recognition
  useEffect(() => {
    const checkSpeechSupport = () => {
      const isSupported =
        "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      setIsSpeechSupported(isSupported);
      setIsChecking(false);
    };

    checkSpeechSupport();
  }, []);

  // Handle starting the interview
  const handleCreateInterview = () => {
    setIsCreating(true);

    // Ensure a topic is selected
    if (!selectedTopic) {
      toast({
        title: "Topic required",
        description: "Please select an interview topic",
        variant: "destructive",
      });
      setIsCreating(false);
      return;
    }

    // Get the full topic name from the id
    const topicObj = INTERVIEW_TOPICS.find((t) => t.id === selectedTopic);

    // Create interview session and navigate to the interview page
    setTimeout(() => {
      setIsCreating(false);
      toast({
        title: "Interview session created",
        description: "Your AI interviewer is ready. Good luck!",
      });

      // Navigate to the interview page with topic info - ensure all params are properly passed
      navigate(`/interview/${selectedTopic}/${difficulty}`, {
        state: {
          topicName: topicObj?.name || selectedTopic,
          voiceId: selectedVoice,
          difficulty: difficulty,
          numQuestions: numQuestions,
        },
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-interview-blue to-interview-purple rounded-lg"></div>
          <span className="text-xl font-bold gradient-text">
            Interview Flow
          </span>
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            Create Your Interview Session
          </h1>
          <p className="text-gray-600 mb-8">
            Customize your practice interview to match your needs
          </p>

          <Card className="border-0 shadow-lg animate-fade-in-up">
            <CardHeader>
              <CardTitle>Interview Settings</CardTitle>
              <CardDescription>
                Configure your interview parameters for the most effective
                practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Topic selection */}
              <div className="space-y-2">
                <Label htmlFor="topic">Interview Topic</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger id="topic" className="w-full">
                    <SelectValue placeholder="Select an interview topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TOPICS.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice selection */}
              <div className="space-y-2">
                <Label htmlFor="voice">Interviewer Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger id="voice" className="w-full">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty selection */}
              <div className="space-y-3">
                <Label>Interview Difficulty</Label>
                <RadioGroup
                  value={difficulty}
                  onValueChange={setDifficulty}
                  className="flex flex-col space-y-1"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1">
                        <div className="font-medium">{option.name}</div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Number of questions selection */}
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Select
                  value={numQuestions.toString()}
                  onValueChange={(value) => setNumQuestions(Number(value))}
                >
                  <SelectTrigger id="numQuestions" className="w-full">
                    <SelectValue placeholder="Select number of questions" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select how many questions you want in your interview
                </p>
              </div>

              {/* Browser compatibility warning */}
              {!isChecking && !isSpeechSupported && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Browser Compatibility Warning
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your browser doesn't support speech recognition. The
                        interview will still work, but you'll need to type
                        responses instead of speaking. For the best experience,
                        use Chrome, Edge, or Safari.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center p-8">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold mb-2">
                  Your AI Interviewer is Ready
                </h2>
                <p className="text-gray-600 mb-6">
                  Get ready for an immersive interview experience tailored to
                  your needs
                </p>
                <Button
                  onClick={handleCreateInterview}
                  className="bg-interview-blue hover:bg-interview-indigo text-lg px-8 py-6"
                  disabled={isCreating}
                >
                  {isCreating
                    ? "Setting up your interview..."
                    : "Start Interview Now"}
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
