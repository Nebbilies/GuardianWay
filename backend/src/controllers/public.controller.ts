/import { Request, Response } from 'express'
import {publicService} from '../services/public.service'

class PublicController {
    async getLandingProof(req: Request, res: Response) {
        try {
            const payload = await publicService.getLandingProof()
            res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60')
            res.status(200).json(payload)
        } catch (e) {
            console.error('Có lỗi xảy ra khi lấy dữ liệu chứng thực landing:', e)
            const errorMessage = e instanceof Error ? e.message : String(e)
            res.status(500).json({message: 'Internal server error: ' + errorMessage})
        }
    }
}

export const publicController = new PublicController()
