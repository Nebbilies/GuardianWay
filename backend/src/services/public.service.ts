import {LandingProofResponse} from '@gw/shared'
import {publicRepository} from '../repositories/public.repository'

class PublicService {
    async getLandingProof(): Promise<LandingProofResponse> {
        const aggregate = await publicRepository.getLandingProofAggregate()

        return {
            source: 'live',
            generatedAt: new Date().toISOString(),
            metrics: {
                activeRoutes: aggregate.activeRoutes,
                activeBuses: aggregate.activeBuses,
                schoolStops: aggregate.schoolStops,
                completedTripsLast30Days: aggregate.completedTripsLast30Days,
                trackingLogsLast24Hours: aggregate.trackingLogsLast24Hours,
                latestTrackingAt: aggregate.latestTrackingAt ? aggregate.latestTrackingAt.toISOString() : null,
            },
        }
    }
}

export const publicService = new PublicService()
