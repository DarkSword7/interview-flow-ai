
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-b from-white to-blue-50 overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Master Your Next <span className="gradient-text">Interview</span> with AI
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              Prepare for your dream job with personalized AI interview sessions. Get instant feedback and improve your interview skills.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button className="btn-primary text-lg px-8 py-6" asChild>
                <Link to="/create-interview">Create Interview</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="#topics">Explore Topics</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white"></div>
              </div>
              <span className="text-sm text-gray-500">
                Trusted by <span className="font-medium">10,000+</span> professionals
              </span>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-interview-blue/10 to-interview-purple/10 rounded-3xl transform rotate-3 animate-pulse-light"></div>
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-gray-800">Tell me about a challenging project you've worked on.</p>
                </div>
                <div className="bg-interview-blue/10 p-3 rounded-lg">
                  <p className="text-gray-700">In my previous role, I led a team that developed...</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg animate-pulse-light">
                  <p className="text-gray-800">How did you handle the technical challenges?</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-light"></div>
                  <span>AI is typing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -z-10 top-10 right-0 opacity-30 w-72 h-72 bg-interview-purple/30 rounded-full blur-3xl"></div>
        <div className="absolute -z-10 bottom-10 left-0 opacity-30 w-72 h-72 bg-interview-blue/30 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Hero;
