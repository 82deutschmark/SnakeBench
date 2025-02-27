import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import LeaderboardSection from "@/components/home/LeaderboardSection";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <StatsSection />
        <LeaderboardSection />
      </div>
    </>
  );
}