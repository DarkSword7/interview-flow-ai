import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  createGeminiChat,
  sendMessageToGemini,
  generateAnswerFeedback,
} from "@/lib/gemini";
import { textToSpeech, VOICES } from "@/lib/elevenlabs";
import { SpeechRecognitionService } from "@/lib/speechRecognition";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// Interview Message interface
interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

// Question Answer pair for saving history
interface QuestionAnswer {
  question: string;
  answer: string;
}

// Interface for the interview configuration
interface InterviewConfig {
  topic: string;
  difficulty: string;
  selectedVoiceId: string;
}

const Interview = () => {
  const { user } = useAuth();
  const { topic, difficulty } = useParams<{
    topic: string;
    difficulty: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Fallback values if params are not provided
  const topicValue = topic || "general";
  const difficultyValue = difficulty || "medium";

  // Fix: Handle VOICES as an object instead of array
  const defaultVoiceId = VOICES.adam.id;
  const selectedVoiceId = location.state?.voiceId || defaultVoiceId;

  // Fix: Get voice name from VOICES object
  const getVoiceName = (voiceId: string) => {
    // Find the voice in the VOICES object that matches the ID
    const voiceKey = Object.keys(VOICES).find(
      (key) => VOICES[key as keyof typeof VOICES].id === voiceId
    );

    return voiceKey
      ? VOICES[voiceKey as keyof typeof VOICES].name
      : "AI Interviewer";
  };

  const selectedVoiceName = getVoiceName(selectedVoiceId);

  // Chat, messages and UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [micPermission, setMicPermission] = useState<
    "granted" | "denied" | "pending"
  >("pending");
  const [conversationStage, setConversationStage] = useState<
    "welcome" | "ai-turn" | "user-turn" | "processing" | "feedback"
  >("welcome");
  const [interviewData, setInterviewData] = useState<QuestionAnswer[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(5); // Default to 5 questions
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig>({
    topic,
    difficulty,
    selectedVoiceId,
  });

  // State for tracking silence
  const [silenceDuration, setSilenceDuration] = useState<number>(0);

  // Debug state
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [recognitionErrors, setRecognitionErrors] = useState<string[]>([]);

  // Refs for managing state across effects and callbacks
  const chatRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionService | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousTranscriptRef = useRef<string>("");
  const recognitionErrorsRef = useRef<string[]>([]);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Add state for manual text input
  const [manualInput, setManualInput] = useState<string>("");

  // Handle manual text input changes
  const handleManualInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setManualInput(e.target.value);
  };

  // Submit manual text input
  const submitManualInput = () => {
    if (manualInput.trim().length > 0) {
      console.log("Submitting manual text input:", manualInput);
      handleUserResponse(manualInput);
      setManualInput("");
    } else {
      toast({
        title: "Empty response",
        description: "Please enter your answer before submitting.",
      });
    }
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      console.log("Requesting microphone permission...");

      // Request microphone permission with specific constraints for better quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Some browsers work better with specific sample rates
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      // If we get here, permission was granted
      console.log("Microphone permission granted successfully");
      setMicPermission("granted");

      // Keep the stream active to maintain microphone access
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);

      // Connect to a silent node to keep the stream active without feedback
      const silentNode = audioContext.createGain();
      silentNode.gain.value = 0;
      source.connect(silentNode);
      silentNode.connect(audioContext.destination);

      // Debug UI feedback
      toast({
        title: "Microphone access granted",
        description: "Your microphone is ready for the interview.",
      });

      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setMicPermission("denied");

      toast({
        title: "Microphone access denied",
        description:
          "Please allow microphone access and reload the page to use voice features.",
        variant: "destructive",
      });

      return false;
    }
  };

  // Scroll to the bottom of the conversation
  const scrollToBottom = () => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  };

  // Start the silence timer
  const startSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
    }

    setSilenceDuration(0);
    silenceTimerRef.current = setInterval(() => {
      setSilenceDuration((prev) => prev + 1);
    }, 1000);
  };

  // Reset the silence timer
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setSilenceDuration(0);
  };

  // Reset user speaking state
  const resetUserSpeakingState = () => {
    setIsUserSpeaking(false);
    setCurrentTranscript("");
    previousTranscriptRef.current = "";
  };

  // Clean up timers
  const cleanupTimers = () => {
    resetSilenceTimer();
  };

  // Save interview to database
  const saveInterviewToDatabase = async (feedback: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to save your interview results.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("interviews")
        .insert([
          {
            user_id: user.id,
            topic: topic,
            difficulty: difficulty,
            feedback: feedback,
            questions_answers: interviewData,
          },
        ])
        .select("id")
        .single();

      if (error) {
        console.error("Error saving interview:", error);
        toast({
          title: "Error saving interview",
          description:
            "There was an error saving your interview. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Error in saveInterviewToDatabase:", error);
      return null;
    }
  };

  // Get the number of questions from location state if available
  useEffect(() => {
    if (location.state?.numQuestions) {
      console.log("Setting total questions to:", location.state.numQuestions);
      setTotalQuestions(location.state.numQuestions);
    }
  }, [location.state]);

  // Initialize the interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setIsInitializing(true);
        console.log(
          "Initializing interview with topic:",
          topicValue,
          "difficulty:",
          difficultyValue
        );

        // First, request microphone permission with better audio quality options
        const hasMicPermission = await requestMicrophonePermission();
        console.log("Microphone permission result:", hasMicPermission);

        // Define the question count
        const questionCount = totalQuestions || 5; // Default to 5 if not specified
        console.log(
          "Interview configured for",
          questionCount,
          "questions total"
        );

        // Set up the system prompt for the AI interviewer with dynamic question count
        const systemPrompt = `You are an interviewer conducting a ${difficultyValue} technical interview about ${topicValue}. 
          Your goal is to ask challenging but fair questions to assess the candidate's knowledge.
          Start by introducing yourself briefly and asking your first question.
          After the candidate answers, respond appropriately and ask the next question.
          Ask one question at a time and wait for the candidate to respond.
          Your questions should get progressively more complex.
          Ask exactly ${questionCount} questions in total. After the ${questionCount}th question, thank the candidate and end the interview.
          Keep your responses focused and professional. Don't be overly verbose.`;

        // Create a new Gemini chat session
        console.log("Creating Gemini chat session...");
        const chat = await createGeminiChat(systemPrompt).catch((error) => {
          console.error("Error creating Gemini chat:", error);
          throw new Error(
            "Failed to initialize AI interviewer: " + error.message
          );
        });

        if (!chat) {
          throw new Error("Failed to initialize AI interviewer");
        }

        chatRef.current = chat;
        console.log("Gemini chat session created successfully");

        // Get the first question from Gemini
        console.log("Requesting first interview question...");
        const firstMessage = await sendMessageToGemini(
          chat,
          "Let's start the interview. Please introduce yourself and ask your first question."
        ).catch((error) => {
          console.error("Error getting first message:", error);
          throw new Error(
            "Failed to get first interview question: " + error.message
          );
        });

        if (!firstMessage) {
          throw new Error("No response from AI interviewer");
        }

        // Extract the first question
        console.log("First message received:", firstMessage);
        setCurrentQuestion(firstMessage);

        // Add the AI message to the chat history
        setMessages([
          {
            role: "ai",
            content: firstMessage,
            timestamp: new Date(),
          },
        ]);

        // Initialize speech recognition if we have mic permission
        if (hasMicPermission && SpeechRecognitionService.isSupported()) {
          console.log("Setting up speech recognition service...");

          // Clean up any existing instance
          if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
          }

          // Create a new instance with improved configuration
          speechRecognitionRef.current = new SpeechRecognitionService({
            continuous: true,
            interimResults: true,
            language: "en-US",
            onResult: (transcript, isFinal) => {
              console.log(
                `Speech recognition result: ${transcript} (isFinal: ${isFinal})`
              );
              handleTranscriptUpdate(transcript, isFinal);
            },
            onError: (error) => {
              console.error("Speech recognition error:", error);

              // Keep track of errors
              recognitionErrorsRef.current = [
                ...recognitionErrorsRef.current,
                error,
              ].slice(-5);
              setRecognitionErrors(recognitionErrorsRef.current);

              if (isUserSpeaking) {
                resetUserSpeakingState();
              }

              // If we get too many errors, try resetting the recognition engine
              if (recognitionErrorsRef.current.length >= 3) {
                console.log("Too many errors, resetting speech recognition");
                setTimeout(() => {
                  if (speechRecognitionRef.current) {
                    speechRecognitionRef.current.reset();
                    if (
                      isInterviewActive &&
                      !isAiSpeaking &&
                      micPermission === "granted"
                    ) {
                      setTimeout(() => {
                        speechRecognitionRef.current?.start();
                      }, 500);
                    }
                  }
                }, 1000);

                recognitionErrorsRef.current = [];
                setRecognitionErrors([]);
              }

              // Don't show error toasts for common errors
              if (!error.includes("no-speech")) {
                toast({
                  title: "Speech recognition issue",
                  description:
                    "There was a minor issue with speech recognition. Still listening...",
                  variant: "default",
                });
              }
            },
            onEnd: () => {
              console.log("Speech recognition ended");
              // Restart listening if interview is active
              if (
                isInterviewActive &&
                !isAiSpeaking &&
                micPermission === "granted"
              ) {
                setTimeout(() => {
                  console.log("Restarting speech recognition after end event");
                  speechRecognitionRef.current?.start();
                }, 300);
              }
            },
          });

          // Start listening with delay to ensure proper initialization
          console.log("Starting speech recognition service...");
          setTimeout(() => {
            if (speechRecognitionRef.current) {
              speechRecognitionRef.current.start();
              console.log("Speech recognition started successfully");
            }
          }, 500);
        } else if (!SpeechRecognitionService.isSupported()) {
          console.error("Speech recognition not supported by this browser");
          toast({
            title: "Speech recognition not supported",
            description:
              "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for the best experience.",
            variant: "destructive",
          });
        } else if (!hasMicPermission) {
          console.error("Microphone permission was denied");
          toast({
            title: "Microphone access required",
            description:
              "This interview requires microphone access. Please allow access and reload the page.",
            variant: "destructive",
          });
        }

        // Convert first question to speech
        console.log("Converting first question to speech...");
        const speechUrl = await textToSpeech(
          firstMessage,
          selectedVoiceId
        ).catch((error) => {
          console.error("Error converting text to speech:", error);
          toast({
            title: "Voice synthesis issue",
            description:
              "There was a problem generating the AI voice. The interview will continue without voice.",
            variant: "destructive",
          });
          return null;
        });

        if (speechUrl && audioRef.current) {
          audioRef.current.src = speechUrl;
          audioRef.current.play();
          setIsAiSpeaking(true);
        } else {
          // If speech fails, still proceed with the interview
          console.log("No speech URL available, proceeding without voice");
          setConversationStage("user-turn");
        }

        // Set conversation stage to AI's turn
        setConversationStage("ai-turn");
        setIsInitializing(false);
      } catch (error) {
        console.error("Error initializing interview:", error);
        toast({
          title: "Error initializing interview",
          description:
            error.message ||
            "There was an error initializing the interview. Please try again.",
          variant: "destructive",
        });

        // Give a slight delay before redirecting to improve UX
        setTimeout(() => {
          navigate("/create-interview");
        }, 2000);
      }
    };

    initializeInterview();

    // Cleanup function
    return () => {
      cleanupTimers();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [
    topicValue,
    difficultyValue,
    selectedVoiceId,
    toast,
    totalQuestions,
    navigate,
  ]);

  // Check if the interview is active
  const isInterviewActive =
    conversationStage !== "welcome" && conversationStage !== "feedback";

  // Handle audio ended event
  const handleAudioEnded = () => {
    console.log("Audio ended");
    setIsAiSpeaking(false);

    // Start listening for the user's response
    if (isInterviewActive) {
      setConversationStage("user-turn");
      if (speechRecognitionRef.current && micPermission === "granted") {
        speechRecognitionRef.current.start();
      }
      startSilenceTimer();
    }
  };

  // Handle transcript updates from speech recognition - improved version
  const handleTranscriptUpdate = (transcript: string, isFinal: boolean) => {
    console.log(
      `Transcript update received: "${transcript}" (isFinal: ${isFinal})`
    );

    // For speech visualization
    if (!isUserSpeaking && transcript.trim().length > 0) {
      console.log("Detected speech, setting user speaking state to true");
      setIsUserSpeaking(true);
    }

    // Always update the visible transcript for immediate feedback
    if (transcript && transcript.trim().length > 0) {
      setCurrentTranscript(transcript);
      console.log("Updated visible transcript:", transcript);
    }

    // Reset the silence timer whenever we get new speech
    resetSilenceTimer();
    startSilenceTimer();

    // Store the transcript for comparison to detect new speech
    previousTranscriptRef.current = transcript;

    // If this is a final result with content, process it after a brief delay
    // This allows any remaining final segments to arrive
    if (
      isFinal &&
      transcript.trim().length > 0 &&
      conversationStage === "user-turn"
    ) {
      console.log(
        "Final transcript received, processing after delay:",
        transcript
      );

      // Don't reset values yet - wait until actually processing
      setTimeout(() => {
        console.log("Processing final transcript now:", transcript);
        // Only process if we're still in user turn and not already processing
        if (conversationStage === "user-turn" && !isAiSpeaking) {
          handleUserResponse(transcript);
        }
      }, 500);
    }
  };

  // Handle silence prompt
  const handleSilencePrompt = () => {
    // If user has been silent too long, prompt them
    if (conversationStage === "user-turn" && !isAiSpeaking) {
      toast({
        title: "Are you still there?",
        description: "I'm waiting for your response. You can speak now.",
      });
      resetSilenceTimer();
      startSilenceTimer();
    }
  };

  // Handle long silence - assume user is done speaking
  useEffect(() => {
    // If user has been silent for 3 seconds and there's a transcript
    if (
      silenceDuration >= 3 &&
      currentTranscript.trim().length > 3 &&
      !isAiSpeaking &&
      conversationStage === "user-turn"
    ) {
      console.log(
        `Processing response after ${silenceDuration}s silence: "${currentTranscript}"`
      );
      handleUserResponse(currentTranscript);
    }
    // If silence for 10 seconds with no substantial transcript, prompt user
    else if (
      silenceDuration >= 10 &&
      (!currentTranscript || currentTranscript.trim().length <= 3) &&
      !isAiSpeaking &&
      conversationStage === "user-turn"
    ) {
      handleSilencePrompt();
    }
  }, [silenceDuration, currentTranscript, isAiSpeaking, conversationStage]);

  // Handle user's response - improved version
  const handleUserResponse = async (transcript: string) => {
    const trimmedTranscript = transcript.trim();

    if (
      !trimmedTranscript ||
      trimmedTranscript.length < 3 ||
      isAiSpeaking ||
      conversationStage === "processing"
    ) {
      return;
    }

    console.log("Processing user response:", trimmedTranscript);
    setConversationStage("processing");
    setIsLoading(true);
    resetUserSpeakingState();

    // Stop listening while processing
    speechRecognitionRef.current?.stop();
    resetSilenceTimer();

    // Reset current transcript display
    setCurrentTranscript("");
    previousTranscriptRef.current = "";

    // Add user's response to messages
    const userMessage: Message = {
      role: "user",
      content: trimmedTranscript,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Update interview data with the question and answer
      setInterviewData((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: trimmedTranscript,
        },
      ]);

      // Get AI's response
      const aiResponse = await sendMessageToGemini(
        chatRef.current,
        trimmedTranscript
      );

      // Add AI's response to messages
      const aiMessage: Message = {
        role: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update the current question
      setCurrentQuestion(aiResponse);

      // Scroll to the bottom
      setTimeout(scrollToBottom, 100);

      // Check if this is the last question or if we've reached the total number of questions
      const lastQuestionIndicators = [
        "thank you for your time",
        "this concludes our interview",
        "that was our last question",
        "we have completed all the questions",
        "the interview is now complete",
      ];

      // Check if either:
      // 1. We've reached the configured number of questions
      // 2. The AI response indicates this was the last question
      const hasReachedTotalQuestions = interviewData.length >= totalQuestions;
      const aiIndicatesLastQuestion = lastQuestionIndicators.some((indicator) =>
        aiResponse.toLowerCase().includes(indicator.toLowerCase())
      );

      console.log(
        `Question ${interviewData.length} of ${totalQuestions} completed`
      );

      if (hasReachedTotalQuestions || aiIndicatesLastQuestion) {
        console.log("Interview complete - proceeding to feedback");
        setConversationStage("feedback");

        // Generate feedback from AI
        const allQuestions = interviewData.map((qa) => qa.question).join("\n");
        const allAnswers = interviewData.map((qa) => qa.answer).join("\n");

        const feedback = await generateAnswerFeedback(
          chatRef.current,
          `Topic: ${topic}, Difficulty: ${difficulty}\n` +
            `Questions: ${allQuestions}\n` +
            `Answers: ${allAnswers}`
        );

        // Save interview with feedback
        const savedId = await saveInterviewToDatabase(feedback);
        if (savedId) setInterviewId(savedId);

        // Navigate to feedback page
        navigate(`/feedback`, {
          state: {
            feedback,
            interviewData,
            interviewId: savedId,
            config: {
              topic,
              difficulty,
              voiceId: selectedVoiceId,
            },
          },
        });
      } else {
        // Continue the interview
        // Convert AI response to speech
        const speechUrl = await textToSpeech(aiResponse, selectedVoiceId);
        if (audioRef.current) {
          audioRef.current.src = speechUrl;
          audioRef.current.play();
          setIsAiSpeaking(true);
          setConversationStage("ai-turn");
        }
      }
    } catch (error) {
      console.error("Error processing response:", error);
      toast({
        title: "Error processing response",
        description: "There was an error processing your response.",
        variant: "destructive",
      });
      // Resume listening on error
      setConversationStage("user-turn");
      speechRecognitionRef.current?.start();
    } finally {
      setIsLoading(false);
    }
  };

  // Manual submission of transcript from UI
  const handleManualSubmission = () => {
    console.log("Manual transcript submission triggered");
    if (
      currentTranscript &&
      currentTranscript.trim().length > 0 &&
      conversationStage === "user-turn"
    ) {
      console.log(
        "Processing manually submitted transcript:",
        currentTranscript
      );
      handleUserResponse(currentTranscript);
    } else {
      console.log("No valid transcript to submit manually");
      toast({
        title: "No speech detected",
        description: "Please speak something before submitting.",
      });
    }
  };

  // End the interview early
  const endInterview = async () => {
    // Stop audio and speech recognition
    if (audioRef.current) {
      audioRef.current.pause();
    }
    speechRecognitionRef.current?.stop();
    resetSilenceTimer();

    // Set loading state
    setIsLoading(true);

    try {
      // Generate feedback from AI
      const allQuestions = interviewData.map((qa) => qa.question).join("\n");
      const allAnswers = interviewData.map((qa) => qa.answer).join("\n");

      const feedback = await generateAnswerFeedback(
        chatRef.current,
        `Topic: ${topic}, Difficulty: ${difficulty}\n` +
          `Questions: ${allQuestions}\n` +
          `Answers: ${allAnswers}`
      );

      // Save interview with feedback
      const savedId = await saveInterviewToDatabase(feedback);
      if (savedId) setInterviewId(savedId);

      // Navigate to feedback page
      navigate(`/feedback`, {
        state: {
          feedback,
          interviewData,
          interviewId: savedId,
          config: {
            topic,
            difficulty,
            voiceId: selectedVoiceId,
          },
        },
      });
    } catch (error) {
      console.error("Error ending interview:", error);
      toast({
        title: "Error generating feedback",
        description:
          "There was an error generating feedback. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Toggle debug mode with double-tap on header
  const toggleDebugMode = () => {
    setDebugMode((prev) => !prev);
  };

  // Update the returned JSX section to fix styling issues
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"
              onDoubleClick={toggleDebugMode}
            ></div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Interview Flow
            </span>
          </Link>
          <Button
            variant="outline"
            onClick={endInterview}
            disabled={isLoading || isInitializing}
          >
            End Interview
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {/* Interview header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {topicValue} Interview ({difficultyValue})
              </h2>
              <p className="text-gray-600">
                Your interviewer today is using the {selectedVoiceName} voice.
              </p>
              <Badge variant="outline" className="mt-2">
                Question {Math.min(interviewData.length + 1, totalQuestions)} of{" "}
                {totalQuestions}
              </Badge>
            </div>

            {/* Debug information (only visible when debug mode is enabled) */}
            {debugMode && (
              <div className="mb-4 p-3 bg-gray-800 text-white text-xs rounded overflow-auto max-h-32">
                <p>Debug Mode:</p>
                <p>Mic Status: {micPermission}</p>
                <p>
                  Speech Recognition Active:{" "}
                  {speechRecognitionRef.current?.getListeningState()
                    ? "Yes"
                    : "No"}
                </p>
                <p>Interview Stage: {conversationStage}</p>
                <p>Silence Duration: {silenceDuration}s</p>
                <p>Recent Errors:</p>
                <ul>
                  {recognitionErrors.map((err, i) => (
                    <li key={i}>- {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Speaking indicators */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isAiSpeaking
                      ? "bg-green-500 animate-pulse"
                      : conversationStage === "processing"
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="font-medium text-sm">
                  {isAiSpeaking
                    ? "AI is speaking..."
                    : conversationStage === "processing"
                    ? "AI is thinking..."
                    : "AI is listening"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-right">
                  {isUserSpeaking
                    ? "You are speaking..."
                    : conversationStage === "user-turn" && !isAiSpeaking
                    ? "Your turn to speak"
                    : "Waiting for your turn"}
                </span>
                <div
                  className={`h-3 w-3 rounded-full ${
                    isUserSpeaking
                      ? "bg-red-500 animate-pulse"
                      : conversationStage === "user-turn" && !isAiSpeaking
                      ? "bg-blue-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                ></div>
              </div>
            </div>

            {/* New Interview UI with profile icons on either side */}
            <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200 shadow">
              {/* Current message display with left-right layout */}
              <div className="flex items-center gap-6 mb-8">
                {/* AI Interviewer Profile (Left) */}
                <div className="w-1/2 flex items-center flex-col">
                  <Avatar className="h-20 w-20 mb-2 bg-blue-100">
                    <AvatarImage src="/placeholder.svg" alt="AI" />
                    <AvatarFallback className="bg-blue-500 text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-medium">{selectedVoiceName}</p>
                    <p className="text-xs text-gray-500">AI Interviewer</p>
                  </div>
                  <div
                    className={`mt-3 h-2 w-2 rounded-full ${
                      isAiSpeaking
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  ></div>
                </div>

                {/* VS Text */}
                <div className="text-center text-gray-400 text-2xl font-light">
                  vs
                </div>

                {/* User Profile (Right) */}
                <div className="w-1/2 flex items-center flex-col">
                  <Avatar className="h-20 w-20 mb-2 bg-gray-100">
                    {user?.user_metadata?.avatar_url ? (
                      <AvatarImage
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata.full_name || "User"}
                      />
                    ) : (
                      <AvatarFallback className="bg-gray-300">
                        {user?.user_metadata?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-center">
                    <p className="font-medium">
                      {user?.user_metadata?.full_name || "You"}
                    </p>
                    <p className="text-xs text-gray-500">Candidate</p>
                  </div>
                  <div
                    className={`mt-3 h-2 w-2 rounded-full ${
                      isUserSpeaking
                        ? "bg-red-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Current Question/Answer */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Current Question
                  </h3>
                  <p className="font-medium">
                    {currentQuestion || "Initializing interview..."}
                  </p>
                </div>

                {/* Last answer if available */}
                {messages.length > 0 &&
                  messages[messages.length - 1].role === "user" && (
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Your Answer
                      </h3>
                      <p>{messages[messages.length - 1].content}</p>
                    </div>
                  )}
              </div>

              {/* Real-time transcription */}
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex justify-between items-center">
                  <span>Real-time Transcription</span>
                  {isUserSpeaking && (
                    <span className="flex items-center text-green-500 text-xs font-medium">
                      Voice Detected
                      <span className="ml-2 flex items-center gap-0.5">
                        <span
                          className="inline-block w-1 h-3 bg-green-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="inline-block w-1 h-5 bg-green-500 rounded-full animate-pulse"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="inline-block w-1 h-4 bg-green-500 rounded-full animate-pulse"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                        <span
                          className="inline-block w-1 h-6 bg-green-500 rounded-full animate-pulse"
                          style={{ animationDelay: "450ms" }}
                        ></span>
                        <span
                          className="inline-block w-1 h-3 bg-green-500 rounded-full animate-pulse"
                          style={{ animationDelay: "600ms" }}
                        ></span>
                      </span>
                    </span>
                  )}
                </h3>
                <div
                  className={`bg-white rounded-lg p-3 border min-h-[80px] mb-3 ${
                    isUserSpeaking
                      ? "border-green-400 shadow-sm"
                      : currentTranscript
                      ? "border-blue-300"
                      : "border-gray-200"
                  }`}
                >
                  <p
                    className={`${
                      currentTranscript ? "text-black" : "text-gray-400 italic"
                    }`}
                  >
                    {conversationStage === "user-turn" && !isAiSpeaking
                      ? currentTranscript ||
                        "Start speaking whenever you're ready..."
                      : isAiSpeaking
                      ? "Listening to interviewer..."
                      : conversationStage === "processing"
                      ? "Processing your response..."
                      : "Interview in progress..."}
                  </p>
                </div>

                {/* Add text input as fallback */}
                {conversationStage === "user-turn" && !isAiSpeaking && (
                  <div className="space-y-3">
                    <div className="border rounded-md bg-white overflow-hidden">
                      <textarea
                        placeholder="Type your answer here if speech recognition isn't working..."
                        value={manualInput}
                        onChange={handleManualInputChange}
                        className="w-full p-3 min-h-[100px] outline-none resize-none border-0 focus:ring-0"
                        disabled={
                          isAiSpeaking || conversationStage === "processing"
                        }
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      {/* Submit speech transcript button */}
                      <Button
                        onClick={handleManualSubmission}
                        disabled={
                          !currentTranscript ||
                          currentTranscript.trim().length < 2
                        }
                        variant="outline"
                      >
                        Submit Speech
                      </Button>

                      {/* Submit text input button */}
                      <Button
                        onClick={submitManualInput}
                        disabled={!manualInput || manualInput.trim().length < 2}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Submit Typed Answer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview progress */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Interview Progress
              </h3>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span>Question 1</span>
                  <span>Question {totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{
                      width: `${
                        (Math.min(interviewData.length + 1, totalQuestions) /
                          totalQuestions) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Microphone status */}
            <div className="flex justify-center mb-6">
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                    conversationStage === "user-turn" && !isAiSpeaking
                      ? "bg-blue-500 animate-pulse"
                      : isUserSpeaking
                      ? "bg-red-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                  onClick={() => {
                    // Manual microphone restart for testing
                    if (!isAiSpeaking && micPermission === "granted") {
                      if (speechRecognitionRef.current) {
                        toast({
                          title: "Resetting microphone",
                          description: "Restarting speech recognition...",
                        });
                        speechRecognitionRef.current.reset();
                        setTimeout(() => {
                          speechRecognitionRef.current?.start();
                        }, 500);
                      }
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {micPermission === "granted"
                    ? conversationStage === "user-turn" && !isAiSpeaking
                      ? "Click to speak"
                      : isAiSpeaking
                      ? "Please wait"
                      : "Ready"
                    : "Microphone access required"}
                </p>
              </div>
            </div>

            {/* End interview button */}
            <div className="text-center">
              <Button
                onClick={endInterview}
                disabled={isLoading || isInitializing}
              >
                End Interview & Get Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden audio element for AI speech */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default Interview;
