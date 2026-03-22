import Image from "next/image";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Features from "@/components/features";
import Stats from "@/components/stats";
import HowItWorks from "@/components/how-it-works";
import Footer from "@/components/footer";

export default function Home() {
  return (
      <main className={'min-h-screen bg-background'}>
          <Header />
          <Hero/>
          <Features />
          <Stats />
          <HowItWorks />
          <Footer />
      </main>
  );
}
