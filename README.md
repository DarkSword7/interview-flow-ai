# AI Interviewer

![AI Interviewer](https://img.shields.io/badge/Interview%20Flow-AI%20Powered-4F46E5)

AI Interviewer is an interactive platform designed to help job seekers practice and master their interview skills through realistic AI-powered interview simulations.

## 📋 Overview

Interview Flow is a sophisticated web application that allows users to practice job interviews with an AI that adapts to their responses in real-time. The platform uses advanced AI, speech recognition, and text-to-speech technologies to create a realistic interview experience that helps users improve their communication skills, receive instant feedback, and prepare for real-world interviews.

## ✨ Features

- **AI-Powered Interview Simulations**: Practice with our advanced AI interviewer that adapts to your responses in real-time.
- **Multiple Industry Topics**: Choose from a variety of interview topics including:
  - Software Development
  - Data Science
  - Product Management
  - UX/UI Design
  - Marketing
  - Leadership
  - Consulting
  - Finance
  - Sales
  - Customer Service
  - Human Resources
  - Executive Leadership
- **Customizable Experience**:

  - Select difficulty levels: Entry Level, Mid Level, or Senior Level
  - Choose your preferred AI interviewer voice
  - Customize the number of questions

- **Speech Recognition**: Respond verbally to interview questions for a more realistic experience
- **Voice Synthesis**: Listen to interview questions asked by AI with realistic voices
- **Comprehensive Feedback**: Get detailed analysis of your interview performance with:

  - Overall assessment
  - Strengths identification
  - Areas for improvement
  - Question-by-question analysis
  - Performance score
  - Hiring recommendation

- **Past Interview Review**: Access your interview history to track progress over time
- **User Profiles**: Customize your profile and manage your account settings
- **Mobile Responsive Design**: Practice interviews on any device

## 🚀 Getting Started

### Prerequisites

- Node.js & npm (or Bun)
- Modern web browser (Chrome recommended for best speech recognition support)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ai-interviewer
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## 💻 Technologies Used

- **Frontend**:

  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui (UI components)
  - Vite (build tool)

- **Backend & Services**:
  - Supabase (authentication and database)
  - Google Gemini API (AI conversation)
  - ElevenLabs (text-to-speech)
  - Web Speech API (speech recognition)

## 🔍 Project Structure

- `/src/components` - UI components
- `/src/pages` - Application pages
- `/src/lib` - Utility functions and service integrations
- `/src/contexts` - React context providers
- `/src/hooks` - Custom React hooks

## 📱 Core Features Explained

### Interview Creation

Users can create customized interview sessions by selecting:

- Interview topic
- Difficulty level
- AI interviewer voice
- Number of questions

### Interview Experience

- Real-time transcription of user's speech
- AI-generated questions based on selected topic and difficulty
- Voice synthesis for spoken questions
- Visual indicators for speaking turns

### Feedback and Analysis

After completing an interview, users receive:

- Overall performance score
- Identified strengths and weaknesses
- Detailed feedback for each question and answer
- Hiring recommendation
- Suggested resources for improvement

### Interview History

Users can review their past interviews including:

- Date and time
- Topic
- Difficulty
- Detailed feedback

## 🔐 Authentication

The application uses Supabase for authentication, supporting:

- Email/password registration
- Profile management
- Secure session handling

## 🌐 Deployment

This project can be deployed using any static site hosting service that supports React applications.

Recommended deployment options:

1. Vercel
2. Netlify
3. GitHub Pages

## 👨‍💻 Contributing

Contributions to improve AI Interviewer are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

For questions or support, please reach out through the project repository issues section.

---

Built with ❤️ using React, Tailwind CSS, and advanced AI technologies.
