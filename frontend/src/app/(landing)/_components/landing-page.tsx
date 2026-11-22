import type { LandingProofResponse } from "@/modules/public-reporting/contracts";
import HeroSection from "./sections/hero-section";
import ProofSection from "./sections/proof-section";
import StorySection from "./sections/story-section";
import FeaturesSection from "./sections/features-section";
import HowItWorksSection from "./sections/how-it-works-section";
import FinalCtaSection from "./sections/final-cta-section";

interface LandingPageProps {
    proof: LandingProofResponse | null;
    isUnavailable: boolean;
}

export default function LandingPage({
    proof,
    isUnavailable,
}: LandingPageProps) {
    return (
        <main className={"min-h-screen bg-background"}>
            <HeroSection />
            <ProofSection proof={proof} isUnavailable={isUnavailable} />
            <StorySection />
            <FeaturesSection />
            <HowItWorksSection />
            <FinalCtaSection />
        </main>
    );
}
