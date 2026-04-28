import type {LandingProofResponse} from '@gw/shared'

const fallbackMetrics: LandingProofResponse = {
    source: 'live',
    generatedAt: new Date().toISOString(),
    metrics: {
        activeRoutes: 12,
        activeBuses: 36,
        schoolStops: 58,
        completedTripsLast30Days: 1420,
        trackingLogsLast24Hours: 9800,
        latestTrackingAt: null,
    },
}

function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
}

function isLandingProofResponse(data: unknown): data is LandingProofResponse {
    if (!data || typeof data !== 'object') return false
    const payload = data as Record<string, unknown>
    const metrics = payload.metrics as Record<string, unknown> | undefined

    return (
        payload.source === 'live' &&
        typeof payload.generatedAt === 'string' &&
        !!metrics &&
        typeof metrics.activeRoutes === 'number' &&
        typeof metrics.activeBuses === 'number' &&
        typeof metrics.schoolStops === 'number' &&
        typeof metrics.completedTripsLast30Days === 'number' &&
        typeof metrics.trackingLogsLast24Hours === 'number' &&
        (typeof metrics.latestTrackingAt === 'string' || metrics.latestTrackingAt === null)
    )
}

export async function getLandingProof() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/public/landing-proof`, {
            next: {revalidate: 120},
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch landing proof: ${response.status}`)
        }

        const json = (await response.json()) as unknown
        if (!isLandingProofResponse(json)) {
            throw new Error('Landing proof payload is invalid')
        }

        return {
            data: json,
            isFallback: false,
        }
    } catch {
        return {
            data: fallbackMetrics,
            isFallback: true,
        }
    }
}
