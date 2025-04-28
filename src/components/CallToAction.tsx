
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-interview-purple to-interview-blue rounded-2xl p-10 text-center text-white shadow-2xl overflow-hidden relative animate-fade-in">
          <div className="absolute inset-0 opacity-30" style={{ 
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='white' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat"
          }}></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto text-white/90">
              Sign up today and start practicing with our AI interviewer. Get instant feedback and improve your chances of landing your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-interview-purple hover:bg-gray-100 text-lg px-8 py-6" asChild>
                <Link to="/create-interview">Get Started</Link>
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6" asChild>
                <Link to="/signup">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
