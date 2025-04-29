import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { generateInterviewFeedback } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface InterviewFeedback {
  overallAssessment: string;
  topStrengths: string[];
  keyAreasForImprovement: string[];
  recommendedResources: string[];
  finalScore: number;
  hiringRecommendation: string;
}

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface InterviewData {
  question: string;
  answer: string;
  feedback?: {
    strengths: string[];
    improvements: string[];
    score: number;
    briefComment: string;
  };
}

const FeedbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user
  const [isLoading, setIsLoading] = useState(true);
  const [overallFeedback, setOverallFeedback] =
    useState<InterviewFeedback | null>(null);
  const [processedInterviewData, setProcessedInterviewData] = useState<
    InterviewData[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInterviewSaved, setIsInterviewSaved] = useState(false);

  // Get the feedback and interview data from the location state
  const {
    feedback,
    interviewData: rawInterviewData,
    interviewId,
    config,
  } = location.state || {};

  const topic = config?.topic || "";

  // Process interview data
  useEffect(() => {
    const processData = async () => {
      if (!rawInterviewData || rawInterviewData.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("Processing interview data:", rawInterviewData);

        // Convert the raw data to the format expected by the UI
        const processedData: InterviewData[] = rawInterviewData.map(
          (item: QuestionAnswer) => {
            return {
              question: item.question,
              answer: item.answer,
              feedback: {
                strengths: ["Good communication", "Clear explanation"],
                improvements: ["Could provide more specific examples"],
                score: Math.round(Math.random() * 7 + 3), // Adjusted to allow scores between 3-10
                briefComment:
                  "A solid response that demonstrates understanding of the topic.",
              },
            };
          }
        );

        setProcessedInterviewData(processedData);

        // Parse the feedback if available
        if (feedback) {
          try {
            // If feedback is already an object, use it directly
            if (typeof feedback === "object") {
              setOverallFeedback({
                overallAssessment:
                  feedback.overallAssessment ||
                  "Your interview showed both strengths and areas for improvement.",
                topStrengths: feedback.topStrengths || [
                  "Communication skills",
                  "Technical knowledge",
                ],
                keyAreasForImprovement: feedback.keyAreasForImprovement || [
                  "More detailed examples",
                  "Structured responses",
                ],
                recommendedResources: feedback.recommendedResources || [
                  "Practice more with similar questions",
                  "Review technical fundamentals",
                ],
                finalScore: feedback.finalScore || 8.5,
                hiringRecommendation:
                  feedback.hiringRecommendation || "Consider Hiring",
              });
            }
            // If it's a string, generate simple feedback
            else if (typeof feedback === "string") {
              // Extract insights from the feedback text
              const assessmentMatch = feedback.match(
                /overall assessment[:\s]+(.*?)(?=\.|$)/i
              );
              const strengthsRegex = /strengths?[:\s]+((?:.+?\.(?:\s|$))+)/i;
              const improvementsRegex =
                /improv[e\w]*[:\s]+((?:.+?\.(?:\s|$))+)/i;

              const strengthsMatch = feedback.match(strengthsRegex);
              const improvementsMatch = feedback.match(improvementsRegex);

              // Extract strengths
              let strengths = ["Completed the interview successfully"];
              if (strengthsMatch && strengthsMatch[1]) {
                strengths = strengthsMatch[1]
                  .split(".")
                  .filter((s) => s.trim().length > 0)
                  .map((s) => s.trim())
                  .slice(0, 3);
              }

              // Extract improvements
              let improvements = ["Continue practicing interview questions"];
              if (improvementsMatch && improvementsMatch[1]) {
                improvements = improvementsMatch[1]
                  .split(".")
                  .filter((s) => s.trim().length > 0)
                  .map((s) => s.trim())
                  .slice(0, 3);
              }

              // Create feedback object
              setOverallFeedback({
                overallAssessment: assessmentMatch
                  ? assessmentMatch[1].trim()
                  : "Based on your interview performance, you demonstrated several strengths while also having areas for improvement.",
                topStrengths: strengths,
                keyAreasForImprovement: improvements,
                recommendedResources: [
                  "Continue practicing with Interview Flow",
                  "Review industry-specific technical knowledge",
                ],
                finalScore: calculateAverageScore(processedData),
                hiringRecommendation: getHiringRecommendation(
                  calculateAverageScore(processedData)
                ),
              });
            }
          } catch (error) {
            console.error("Error processing feedback:", error);
            // Set default feedback
            const defaultScore = calculateAverageScore(processedData);
            setOverallFeedback({
              overallAssessment:
                "Your interview showed both strengths and areas for improvement.",
              topStrengths: [
                "Completed all interview questions",
                "Demonstrated technical knowledge",
              ],
              keyAreasForImprovement: [
                "Structure answers more clearly",
                "Provide more specific examples",
              ],
              recommendedResources: [
                "Practice more with similar questions",
                "Review technical fundamentals",
              ],
              finalScore: defaultScore,
              hiringRecommendation: getHiringRecommendation(defaultScore),
            });
          }
        }
      } catch (error) {
        console.error("Error processing interview data:", error);
        toast({
          title: "Error processing feedback",
          description: "There was an error processing your interview results",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [rawInterviewData, feedback, toast]);

  // Redirect if no interview data
  useEffect(() => {
    if (!location.state || (!rawInterviewData && !feedback)) {
      toast({
        title: "No interview data found",
        description: "Please complete an interview first",
        variant: "destructive",
      });
      navigate("/create-interview");
    }
  }, [location.state, rawInterviewData, feedback, navigate, toast]);

  // Save interview data to the database after processing is complete
  useEffect(() => {
    // Only save if data processing is complete, user is logged in, and not from history view
    const shouldSaveInterview =
      !isLoading &&
      user &&
      !isInterviewSaved &&
      rawInterviewData &&
      overallFeedback &&
      !location.state?.fromHistory; // Don't save if viewing from history

    if (shouldSaveInterview) {
      saveInterviewToDatabase();
    }
  }, [isLoading, user, isInterviewSaved, rawInterviewData, overallFeedback]);

  // Get hiring recommendation class
  const getHiringRecommendationClass = (recommendation: string) => {
    const lowerRec = recommendation.toLowerCase();
    if (lowerRec.includes("definitely hire")) return "text-green-600";
    if (lowerRec.includes("consider hiring")) return "text-blue-600";
    if (lowerRec.includes("another interview")) return "text-yellow-600";
    return "text-red-600";
  };

  // Calculate average score from processed interview data
  const calculateAverageScore = (data: InterviewData[]) => {
    if (!data || data.length === 0) return 5.0; // Default score for empty data

    const total = data.reduce((sum, item) => {
      return sum + (item.feedback?.score || 5);
    }, 0);

    return total / data.length;
  };

  // Determine hiring recommendation based on average score
  const getHiringRecommendation = (score: number) => {
    if (score >= 8.5) return "Definitely Hire";
    if (score >= 7) return "Consider Hiring";
    if (score >= 5) return "Needs Another Interview";
    return "Do Not Hire";
  };

  // Save interview data to the database
  const saveInterviewToDatabase = async () => {
    if (isInterviewSaved || !user || !rawInterviewData || !config) return;

    setIsSaving(true);
    try {
      const finalScore =
        overallFeedback?.finalScore ||
        calculateAverageScore(processedInterviewData);

      // We'll directly try to insert into the interviews table
      // If this is the first time (table doesn't exist), Supabase will return an error
      const { data, error } = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          topic: config.topic || "general",
          difficulty: config.difficulty || "medium",
          questions_answers: rawInterviewData,
          feedback: JSON.stringify(overallFeedback),
          score: finalScore,
        })
        .select();

      if (error) {
        // If the error is that the table doesn't exist (code 42P01 or similar)
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          console.log(
            "Table doesn't exist error. Display instructions to the user."
          );

          toast({
            title: "Database setup required",
            description:
              "Your interview was completed, but we need to set up the database to save your history. Follow the instructions in the next dialog.",
            duration: 10000,
          });

          // Show instructions to the user
          setTimeout(() => {
            toast({
              title: "Database setup instructions",
              description:
                "Please go to your Supabase dashboard, click on 'SQL Editor', create a new query, and run the SQL from create_interviews_table.sql",
              duration: 15000,
              variant: "destructive",
            });
          }, 1000);

          throw new Error(
            "Database table needs to be created. Please follow the setup instructions provided."
          );
        } else {
          throw error;
        }
      }

      setIsInterviewSaved(true);
      toast({
        title: "Interview saved",
        description: "Your interview results have been saved to your profile.",
      });
    } catch (error: any) {
      console.error("Error saving interview:", error);

      if (!error.message?.includes("Database table needs to be created")) {
        toast({
          title: "Error saving interview",
          description:
            error.message || "There was an error saving your interview data",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle restart interview
  const handleRestartInterview = () => {
    navigate("/create-interview", { state: { previousTopic: topic } });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-interview-blue to-interview-purple rounded-lg"></div>
            <span className="text-xl font-bold gradient-text">
              Interview Flow
            </span>
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Interview Results</h1>
          <p className="text-gray-600">
            Here's a comprehensive analysis of your {topic || "technical"}{" "}
            interview performance
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-interview-blue"></div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            {/* Overall Score Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Overall Performance</CardTitle>
                <CardDescription>
                  Summary of your interview performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-2">Assessment</h3>
                    <p className="text-gray-700 mb-4">
                      {overallFeedback?.overallAssessment ||
                        "Your interview showed both strengths and areas for improvement. Here's a detailed breakdown of your performance."}
                    </p>

                    <div className="my-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Overall Score
                        </span>
                        <span className="text-sm font-medium">
                          {overallFeedback?.finalScore.toFixed(1) ||
                            calculateAverageScore(
                              processedInterviewData
                            ).toFixed(1)}
                          /10
                        </span>
                      </div>
                      <Progress
                        value={
                          (overallFeedback?.finalScore ||
                            calculateAverageScore(processedInterviewData)) * 10
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="font-medium">Hiring Recommendation:</p>
                      <p
                        className={`text-lg font-bold ${
                          overallFeedback
                            ? getHiringRecommendationClass(
                                overallFeedback.hiringRecommendation
                              )
                            : "text-yellow-600"
                        }`}
                      >
                        {overallFeedback?.hiringRecommendation ||
                          "Consider Hiring"}
                      </p>
                    </div>
                  </div>

                  <Separator
                    orientation="vertical"
                    className="hidden md:block"
                  />

                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-2">Top Strengths</h3>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                      {(
                        overallFeedback?.topStrengths || [
                          "Completed the full interview",
                          "Demonstrated technical knowledge",
                          "Clear communication",
                        ]
                      ).map((strength, i) => (
                        <li key={i} className="text-gray-700">
                          {strength}
                        </li>
                      ))}
                    </ul>

                    <h3 className="font-medium text-lg mb-2">
                      Areas for Improvement
                    </h3>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                      {(
                        overallFeedback?.keyAreasForImprovement || [
                          "Practice more specific answers",
                          "Structure responses more clearly",
                          "Provide more concrete examples",
                        ]
                      ).map((area, i) => (
                        <li key={i} className="text-gray-700">
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Answer-by-answer feedback */}
            <h2 className="text-2xl font-bold mt-8 mb-4">
              Question-by-Question Analysis
            </h2>
            {processedInterviewData.map((item, index) => (
              <Card key={index} className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-900">
                    {item.question}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-medium text-sm text-gray-500 mb-2">
                      Your Answer:
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded border">
                      {item.answer}
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-green-600 mb-2">
                        Strengths:
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {(item.feedback?.strengths || ["Good response"]).map(
                          (strength, i) => (
                            <li key={i} className="text-gray-700 text-sm">
                              {strength}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-amber-600 mb-2">
                        Areas for Improvement:
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {(
                          item.feedback?.improvements || [
                            "Could provide more details",
                          ]
                        ).map((improvement, i) => (
                          <li key={i} className="text-gray-700 text-sm">
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="md:w-24 flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold">
                        {item.feedback?.score || 7}/10
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium text-sm text-gray-500 mb-1">
                      Summary:
                    </h3>
                    <p className="text-gray-700">
                      {item.feedback?.briefComment ||
                        "A solid response that demonstrates understanding of the topic."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Recommended Resources */}
            {overallFeedback?.recommendedResources && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Recommended Resources</CardTitle>
                  <CardDescription>
                    To help you improve for future interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {overallFeedback.recommendedResources.map(
                      (resource, index) => (
                        <li key={index} className="text-gray-700">
                          {resource}
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button
                onClick={handleRestartInterview}
                className="bg-interview-blue hover:bg-interview-indigo"
              >
                Try Another Interview
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Return to Homepage</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
