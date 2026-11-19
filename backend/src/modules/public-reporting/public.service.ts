import { landingProofSchema } from "./public.contracts";
import { publicRepository } from "./public.repository";
export const publicService = { async landingProof() { const now = new Date(); return landingProofSchema.parse({ source: "live", generatedAt: now.toISOString(), metrics: await publicRepository.aggregate(now) }); } };
