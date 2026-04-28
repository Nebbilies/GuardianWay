export interface LandingProofMetrics {
    activeRoutes: number
    activeBuses: number
    schoolStops: number
    completedTripsLast30Days: number
    trackingLogsLast24Hours: number
    latestTrackingAt: string | null
}

export interface LandingProofResponse {
    source: 'live'
    generatedAt: string
    metrics: LandingProofMetrics
}
