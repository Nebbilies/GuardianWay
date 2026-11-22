import {
    landingProofSchema,
    type LandingProofResponse,
} from "@/modules/public-reporting/contracts";
export async function getLandingProof(): Promise<{
    data: LandingProofResponse | null;
    isUnavailable: boolean;
}> {
    try {
        const publicUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const baseUrl =
            process.env.INTERNAL_API_URL ||
            (/^https?:\/\//.test(publicUrl) ? publicUrl : null);
        if (!baseUrl) throw new Error("Internal API origin is not configured");
        const response = await fetch(baseUrl + "/public/landing-proof", {
            next: { revalidate: 120 },
        });
        if (!response.ok) throw new Error("Landing proof is unavailable");
        const parsed = landingProofSchema.safeParse(await response.json());
        if (!parsed.success)
            throw new Error("Landing proof response is invalid");
        return { data: parsed.data, isUnavailable: false };
    } catch {
        return { data: null, isUnavailable: true };
    }
}
