// Create a utility for speech recognition
// This will help manage the Web Speech API for voice input during the interview

/**
 * Interface for speech recognition options
 */
interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private options: SpeechRecognitionOptions;
  private transcript: string = "";
  private recordingTimeout: NodeJS.Timeout | null = null;
  private fullTranscript: string = ""; // Store the full transcript across recognition segments
  private restartCount: number = 0;
  private maxRestarts: number = 5;
  private currentInterimResults: string = ""; // Track current interim results
  private recognitionResultIndex: number = 0; // Index to track the recognition results
  private initializationAttempts: number = 0;
  private maxInitializationAttempts: number = 3;

  // These settings help improve accuracy
  private preferredLanguage: string = "en-US";
  private recognitionAlternatives: boolean = true;

  constructor(options: SpeechRecognitionOptions = {}) {
    this.options = {
      continuous: true,
      interimResults: true,
      language: options.language || this.preferredLanguage,
      ...options,
    };

    // Check if browser supports the Web Speech API
    if (SpeechRecognitionService.isSupported()) {
      this.initializeRecognition();
    } else {
      console.error("Speech recognition is not supported in this browser.");
      if (this.options.onError) {
        this.options.onError(
          "Speech recognition is not supported in this browser."
        );
      }
    }
  }

  /**
   * Initialize the speech recognition
   */
  private initializeRecognition() {
    try {
      // Initialize speech recognition
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      // Debug message to confirm correct API is found
      console.log(
        "Using Speech Recognition API:",
        SpeechRecognitionAPI ? "Available" : "Not Available"
      );

      if (!SpeechRecognitionAPI) {
        throw new Error("Speech Recognition API not available");
      }

      this.recognition = new SpeechRecognitionAPI();

      // Set options for best accuracy
      this.recognition.continuous = this.options.continuous!;
      this.recognition.interimResults = this.options.interimResults!;
      this.recognition.lang = this.options.language!;

      // Important: setting this to true improves accuracy significantly
      if ("maxAlternatives" in this.recognition) {
        (this.recognition as any).maxAlternatives = 3;
      }

      // Set up event handlers
      this.setupEventHandlers();

      console.log("Speech Recognition initialized successfully");
      this.initializationAttempts = 0; // Reset attempts counter on success
    } catch (error) {
      this.initializationAttempts++;
      console.error(
        `Error initializing speech recognition (attempt ${this.initializationAttempts}):`,
        error
      );

      if (this.initializationAttempts < this.maxInitializationAttempts) {
        console.log(
          `Retrying initialization (attempt ${
            this.initializationAttempts + 1
          })...`
        );
        setTimeout(() => this.initializeRecognition(), 500);
      } else {
        console.error(
          "Maximum initialization attempts reached. Speech recognition unavailable."
        );
        if (this.options.onError) {
          this.options.onError(
            `Failed to initialize speech recognition after ${this.maxInitializationAttempts} attempts`
          );
        }
      }
    }
  }

  /**
   * Set up event handlers for speech recognition
   */
  private setupEventHandlers() {
    if (!this.recognition) {
      console.error("Cannot set up handlers - recognition is null");
      return;
    }

    // Debug to confirm this method is called
    console.log("Setting up speech recognition event handlers");

    this.recognition.onresult = (event) => {
      console.log("Speech recognition result received", event.results);
      if (!event.results) return;

      // Create a complete transcript from all results
      let interimTranscript = "";
      let finalTranscript = this.fullTranscript;

      // Process all results in this event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          // For final results, add to our accumulated final transcript
          finalTranscript += " " + transcript;
          console.log(`Adding final result [${i}]: "${transcript}"`);
        } else {
          // For interim results, include in our temporary interim transcript
          interimTranscript += transcript;
          console.log(`Adding interim result [${i}]: "${transcript}"`);
        }
      }

      // Update our full transcript with cleaned final transcript
      this.fullTranscript = finalTranscript.trim();

      // Combine final transcript with current interim results
      const completeTranscript = (
        this.fullTranscript +
        " " +
        interimTranscript
      ).trim();

      // Save the current transcript
      this.transcript = completeTranscript;

      // Log the transcript state for debugging
      console.log("Current transcript state:");
      console.log("- Full (final) transcript:", this.fullTranscript);
      console.log("- Current interim:", interimTranscript);
      console.log("- Complete displayed transcript:", completeTranscript);

      if (this.options.onResult) {
        // Always notify of the current complete transcript (final + interim)
        this.options.onResult(completeTranscript, false);

        // If we have final results, also send a final transcript callback
        let hasFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            hasFinal = true;
            break;
          }
        }

        if (hasFinal && this.fullTranscript.length > 0) {
          console.log(
            "Sending final transcript callback:",
            this.fullTranscript
          );
          this.options.onResult(this.fullTranscript, true);
        }
      }

      // Reset the timeout since we have new speech
      this.resetRecordingTimeout();
    };

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
      this.isListening = true;
      this.restartCount = 0; // Reset restart counter when successfully started
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");

      // If we're supposed to be listening but recognition ended, restart it
      if (this.isListening) {
        // Only restart if we haven't exceeded max restarts
        if (this.restartCount < this.maxRestarts) {
          this.restartCount++;
          console.log(
            `Restarting speech recognition (attempt ${this.restartCount})`
          );

          // Small delay to prevent rapid restarts
          setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition?.start();
                console.log("Successfully restarted recognition");
              } catch (err) {
                console.error("Error restarting speech recognition:", err);
                this.isListening = false;
                if (this.options.onEnd) {
                  this.options.onEnd();
                }
              }
            }
          }, 300);
        } else {
          console.log("Max restarts exceeded, stopping recognition");
          this.isListening = false;
          if (this.options.onEnd) {
            this.options.onEnd();
          }
        }
      } else if (this.options.onEnd) {
        this.clearRecordingTimeout();
        this.options.onEnd();
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      // Handle specific errors
      if (event.error === "no-speech") {
        // If no speech detected for a while, force finish with current transcript
        console.log("No speech detected");
        // Don't finish recording on no-speech errors, just log them
      } else if (event.error === "audio-capture") {
        console.error("No microphone was found or microphone is disabled");
      } else if (event.error === "not-allowed") {
        console.error("Permission to use microphone was denied or dismissed");
      } else if (event.error === "network") {
        console.error("Network communication error");
      } else if (event.error === "aborted") {
        console.error("Speech recognition aborted");
      }

      // Attempt recovery for certain errors
      if (
        ["network", "service-not-allowed", "aborted", "no-speech"].includes(
          event.error
        )
      ) {
        // These are temporary errors, so we can restart
        if (this.restartCount < this.maxRestarts) {
          console.log("Attempting to recover from error");
          setTimeout(() => this.start(), 1000);
        }
      }

      if (this.options.onError) {
        this.options.onError(`Speech recognition error: ${event.error}`);
      }
    };

    // Add audio level detection if browser supports it
    if ("audiostart" in this.recognition) {
      this.recognition.onaudiostart = () => {
        console.log("Audio capturing started - microphone is active");
      };
    }

    if ("audioend" in this.recognition) {
      (this.recognition as any).onaudioend = () => {
        console.log("Audio capturing ended - microphone is no longer active");
      };
    }

    if ("soundstart" in this.recognition) {
      (this.recognition as any).onsoundstart = () => {
        console.log("Sound detected - speech may be starting");
      };
    }

    if ("soundend" in this.recognition) {
      (this.recognition as any).onsoundend = () => {
        console.log("Sound ended - speech may have ended");
      };
    }

    if ("speechstart" in this.recognition) {
      (this.recognition as any).onspeechstart = () => {
        console.log("Speech detected - active speech recognition");
      };
    }

    if ("speechend" in this.recognition) {
      (this.recognition as any).onspeechend = () => {
        console.log("Speech ended - speech recognition may be processing");
        // Don't auto-complete on speechend, let the silence timer handle it
      };
    }
  }

  /**
   * Start listening for speech input
   */
  start() {
    console.log("Starting speech recognition...");

    if (!this.recognition) {
      console.error("Speech recognition is not supported or initialized.");
      this.initializeRecognition(); // Try to reinitialize

      // If still null after reinitialization, report error and return
      if (!this.recognition) {
        console.error("Failed to initialize speech recognition");
        if (this.options.onError) {
          this.options.onError("Failed to initialize speech recognition");
        }
        return;
      }
    }

    try {
      // Only reset transcript if this is a new recording session
      if (!this.isListening) {
        console.log("Starting new recording session, resetting transcript");
        this.transcript = "";
        this.fullTranscript = "";
        this.currentInterimResults = "";
      } else {
        console.log("Continuing existing session, preserving transcript");
      }

      // Check if recognition is already listening
      if (this.isListening) {
        console.log("Recognition is already listening, stopping first");
        // Store current transcript before stopping
        const savedTranscript = this.fullTranscript;

        this.stop();

        // Restore transcript after stopping
        this.fullTranscript = savedTranscript;

        // Short delay before restarting
        setTimeout(() => {
          this.startRecognition();
        }, 100);
      } else {
        this.startRecognition();
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);

      // If the recognition instance is in a bad state, reinitialize it
      this.recognition = null;
      this.initializeRecognition();

      // Try one more time
      if (this.recognition) {
        setTimeout(() => {
          try {
            this.recognition?.start();
            this.isListening = true;
            console.log(
              "Successfully restarted speech recognition after error"
            );
          } catch (err) {
            console.error("Failed to restart speech recognition:", err);
            if (this.options.onError) {
              this.options.onError(
                `Failed to restart speech recognition: ${err}`
              );
            }
          }
        }, 500);
      }
    }
  }

  /**
   * Helper method to start the recognition
   */
  private startRecognition() {
    try {
      this.recognition?.start();
      this.isListening = true;
      console.log("Speech recognition started successfully");

      // Set auto-finish timeout
      this.resetRecordingTimeout();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      if (this.options.onError) {
        this.options.onError(`Failed to start speech recognition: ${error}`);
      }
    }
  }

  /**
   * Stop listening for speech input
   */
  stop() {
    if (!this.recognition) {
      console.log("No recognition instance to stop");
      return;
    }

    try {
      console.log("Stopping speech recognition...");
      this.clearRecordingTimeout();
      this.recognition.stop();
      this.isListening = false;
      console.log("Speech recognition stopped successfully");
    } catch (error) {
      console.error("Error stopping speech recognition:", error);

      // Force reset the recognition instance
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      this.recognition = null;
      this.isListening = false;
      this.initializeRecognition();
    }
  }

  /**
   * Force finish recording after a period of silence
   * or if the user stops speaking
   */
  private finishRecording() {
    if (!this.isListening) return;

    // Stop the recognition
    this.stop();

    // If there's a transcript, send it as a final result
    if (this.fullTranscript && this.options.onResult) {
      console.log("Auto-finishing with transcript:", this.fullTranscript);
      this.options.onResult(this.fullTranscript, true);
    }
  }

  /**
   * Reset the auto-finish timeout
   */
  private resetRecordingTimeout() {
    this.clearRecordingTimeout();

    // Auto-finish after 3 seconds of no new speech
    this.recordingTimeout = setTimeout(() => {
      console.log("Auto-finishing due to silence");
      this.finishRecording();
    }, 5000); // Increased to 5 seconds to allow more time for thinking
  }

  /**
   * Clear the recording timeout
   */
  private clearRecordingTimeout() {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
  }

  /**
   * Check if speech recognition is supported in this browser
   * @returns boolean indicating support
   */
  static isSupported(): boolean {
    return !!(
      window.SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Get the current listening state
   * @returns boolean indicating if actively listening
   */
  getListeningState(): boolean {
    return this.isListening;
  }

  /**
   * Get the current full transcript
   * @returns The current transcript text
   */
  getCurrentTranscript(): string {
    return this.fullTranscript;
  }

  /**
   * Update recognition options
   * @param options Updated options
   */
  updateOptions(options: Partial<SpeechRecognitionOptions>) {
    this.options = {
      ...this.options,
      ...options,
    };

    // Apply changes if recognition is initialized
    if (this.recognition) {
      this.recognition.continuous = this.options.continuous!;
      this.recognition.interimResults = this.options.interimResults!;
      this.recognition.lang = this.options.language!;
    }
  }

  /**
   * Reset the speech recognition service completely
   * Useful if it's in a bad state
   */
  reset() {
    this.stop();
    this.recognition = null;
    this.fullTranscript = "";
    this.transcript = "";
    this.currentInterimResults = "";
    this.recognitionResultIndex = 0;
    this.restartCount = 0;
    this.initializeRecognition();
  }
}
