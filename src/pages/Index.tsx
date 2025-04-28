
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import TopicSection from "@/components/TopicSection";
import Features from "@/components/Features";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <TopicSection />
      <Features />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
