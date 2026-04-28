import type {LandingProofResponse} from '@gw/shared'
import HeroSection from './sections/hero-section'
import ProofSection from './sections/proof-section'
import StorySection from './sections/story-section'
import FeaturesSection from './sections/features-section'
import HowItWorksSection from './sections/how-it-works-section'
import FinalCtaSection from './sections/final-cta-section'

interface LandingPageProps {
    proof: LandingProofResponse
    isFallback: boolean
}

export default function LandingPage({proof, isFallback}: LandingPageProps) {
    return (
        <main className={'min-h-screen bg-background'}>
            <HeroSection/>
            <ProofSection proof={proof} isFallback={isFallback}/>
            <StorySection/>
            <FeaturesSection/>
            <HowItWorksSection/>
            <FinalCtaSection/>
        </main>
    )
}
