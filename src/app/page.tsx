import HeroSection from '@/components/sections/HeroSection';
import WhySection from '@/components/sections/WhySection';
import TimelineSection from '@/components/sections/TimelineSection';
import TechSection from '@/components/sections/TechSection';
import HypothesisSection from '@/components/sections/HypothesisSection';
import DemoSection from '@/components/sections/DemoSection';
import StorySection from '@/components/sections/StorySection';
import NextStepsSection from '@/components/sections/NextStepsSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      
      <div className="container">
        <WhySection />
        <TimelineSection />
        <TechSection />
        <HypothesisSection />
        <DemoSection />
        <StorySection />
        <NextStepsSection />
      </div>
    </>
  );
}