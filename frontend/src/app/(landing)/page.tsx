import LandingPage from "./_components/landing-page";
import { getLandingProof } from "./_lib/get-landing-proof";

// Keep ISR enabled even when the API is unavailable during image build.
export const revalidate = 120;

export default async function Home() {
    const { data, isUnavailable } = await getLandingProof();

    return <LandingPage proof={data} isUnavailable={isUnavailable} />;
}
