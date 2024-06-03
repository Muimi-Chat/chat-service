import { Router, Request, Response } from 'express';
import getTokenCountController from '../controllers/getTokenCountController';

const router: Router = Router();

router.get('/status', (req: Request, res: Response) => {
	getTokenCountController(req, res)
});

export default router;