import Hero from "@/components/hero";
import Features from "@/components/features";
import Stats from "@/components/stats";
import HowItWorks from "@/components/how-it-works";

export default function Home() {
  return (
      <main className={'min-h-screen bg-background'}>
          <Hero/>
          <Features />
          <Stats />
          <HowItWorks />
      </main>
  );
}
