import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// API Key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini API with retry logic
let genAI: GoogleGenerativeAI;
let model: GenerativeModel;

// Use a more stable model instead of gemini-2.0-flash
const MODEL_NAME = "gemini-1.5-pro";

try {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are a professional technical interviewer that asks relevant questions based on the candidates field of interest.",
  });
} catch (error) {
  console.error("Error initializing Gemini:", error);
}

// Maximum number of retries for API calls
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000;

/**
 * Create a chat session with the Gemini model
 * @param systemPrompt System prompt to initialize the chat
 */
export const createGeminiChat = async (systemPrompt: string) => {
  try {
    if (!API_KEY) {
      throw new Error("No API key provided for Gemini");
    }

    // Initialize with system instructions
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text:
                "Please conduct an interview as an expert. Follow these instructions: " +
                systemPrompt,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'll conduct a technical interview following your instructions.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      },
    });

    return chat;
  } catch (error) {
    console.error("Error creating Gemini chat:", error);
    throw error;
  }
};

/**
 * Send a message to the Gemini model and get a response
 * @param chat Chat session
 * @param message Message to send
 */
export const sendMessageToGemini = async (chat: any, message: string) => {
  let retries = 0;
  let lastError = null;

  while (retries < MAX_RETRIES) {
    try {
      // Send message to the model
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error: any) {
      console.error(
        `Error sending message to Gemini (attempt ${retries + 1}):`,
        error
      );
      lastError = error;

      // Calculate exponential backoff delay
      const delay = BASE_RETRY_DELAY * Math.pow(2, retries);

      // Handle specific error types
      if (error.message && error.message.includes("overloaded")) {
        console.log(`Model is overloaded, retrying after ${delay}ms delay...`);
      } else {
        console.log(`API error, retrying after ${delay}ms delay...`);
      }

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    }
  }

  // If we've exhausted all retries, return a fallback message
  console.error("All retries failed when sending message to Gemini");

  // Create a more helpful fallback response based on the context
  if (message.length < 100) {
    return "I'm having trouble connecting to my AI service right now. Let's continue our interview. Can you tell me more about your experience with this topic?";
  } else {
    // This is likely a longer answer from the user, so we'll provide feedback
    return "Thank you for your detailed response. I'm experiencing some technical difficulties with the AI service right now, but I've recorded your answer. Let's move on to the next question.";
  }
};

/**
 * Generate feedback for interview answers
 * @param chat Chat session
 * @param interviewData Interview data (questions and answers)
 */
export const generateAnswerFeedback = async (
  chat: any,
  interviewData: string
) => {
  try {
    // Get analysis of the candidate's answers
    const prompt = `Please analyze the following interview. Provide detailed feedback including strengths, areas for improvement, and overall assessment. Keep your response structured but conversational.
    
    ${interviewData}
    
    Your feedback should include:
    - Overall assessment of the candidate
    - Key strengths demonstrated
    - Areas that need improvement
    - Score out of 10`;

    const result = await sendMessageToGemini(chat, prompt);
    return result;
  } catch (error) {
    console.error("Error generating feedback:", error);

    // Return a more comprehensive fallback feedback
    return `We encountered some technical difficulties analyzing your interview in detail. However, here's some general feedback:

Overall assessment: You completed the interview process, which demonstrates your commitment and communication skills.

Key strengths:
- You were able to articulate your thoughts on technical topics
- You completed all the interview questions
- You demonstrated willingness to engage with challenging topics

Areas for improvement:
- Consider practicing more structured responses
- Provide more specific examples from your experience
- Research the topic areas further to deepen your understanding

Score: 7/10

This feedback is generated as a fallback due to technical issues, but we recommend practicing with more interviews to continue improving your skills.`;
  }
};
