import {Router} from 'express'
import {publicController} from '../controllers/public.controller'
import {asyncHandler} from '../utils/asyncHandler'

const router = Router()

router.get('/landing-proof', asyncHandler(publicController.getLandingProof))

export default router
