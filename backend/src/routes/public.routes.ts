import {Router} from 'express'
import {publicController} from '../controllers/public.controller'

const router = Router()

router.get('/landing-proof', publicController.getLandingProof)

export default router
