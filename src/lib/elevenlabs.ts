// Text to speech function using ElevenLabs API
import axios from "axios";

// Voice IDs
export const VOICES = {
  adam: {
    id: "pNInz6obpgDQGcFmaJgB", // Updated Adam voice ID
    name: "Adam (Male)",
  },
  rachel: {
    id: "21m00Tcm4TlvDq8ikWAM", // Updated Rachel voice ID
    name: "Rachel (Female)",
  },
  onyx: {
    id: "ErXwobaYiN019PkySvjV", // Onyx voice ID
    name: "Onyx (Male Professional)",
  },
  nova: {
    id: "yoZ06aMxZJJ28mfd3POQ", // Nova voice ID
    name: "Nova (Female Professional)",
  },
  alloy: {
    id: "MF3mGyEYCl7XYWbV9V6O", // Alloy voice ID (general purpose)
    name: "Alloy (Neutral)",
  },
};

// Default voice fallbacks in order of preference
const FALLBACK_VOICES = [
  "alloy", // First try Alloy (most reliable free voice)
  "onyx", // Then try Onyx
  "adam", // Then Adam
  "rachel", // Then Rachel
];

// API key setup
const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "";

/**
 * Converts text to speech using ElevenLabs API
 * @param text Text to convert to speech
 * @param voiceId Voice ID to use
 * @returns URL to the audio
 */
export const textToSpeech = async (
  text: string,
  voiceId: string = VOICES.adam.id
): Promise<string> => {
  // Check if API key is available
  if (!API_KEY) {
    console.warn("No ElevenLabs API key found, skipping voice synthesis");
    throw new Error("No ElevenLabs API key");
  }

  try {
    // Find the voice name for debugging
    const voiceName =
      Object.values(VOICES).find((v) => v.id === voiceId)?.name || voiceId;
    console.log("Using voice ID:", voiceId);

    // Make the API request
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": API_KEY,
        },
        responseType: "blob",
      }
    );

    // Create a URL for the audio blob
    const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error("Error generating speech:", error);

    // Try fallback voices in sequence
    for (const fallbackVoice of FALLBACK_VOICES) {
      const fallbackVoiceId = VOICES[fallbackVoice as keyof typeof VOICES].id;

      // Skip the original voice that failed
      if (fallbackVoiceId === voiceId) continue;

      console.log(
        `Attempting to use fallback voice (${
          VOICES[fallbackVoice as keyof typeof VOICES].name
        })`
      );

      try {
        // Try with the fallback voice
        const response = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${fallbackVoiceId}`,
          {
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": API_KEY,
            },
            responseType: "blob",
          }
        );

        // If successful, return the audio URL
        const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
        return URL.createObjectURL(audioBlob);
      } catch (fallbackError) {
        console.error(`Fallback voice ${fallbackVoice} failed:`, fallbackError);
        // Continue to the next fallback voice
      }
    }

    // If all fallbacks fail, throw error
    throw new Error("Failed to generate speech");
  }
};
