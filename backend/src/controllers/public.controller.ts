import { Request, Response } from 'express'
import {publicService} from '../services/public.service'

class PublicController {
    async getLandingProof(req: Request, res: Response) {
        const payload = await publicService.getLandingProof()
        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60')
        res.status(200).json(payload)
    }
}

export const publicController = new PublicController()
