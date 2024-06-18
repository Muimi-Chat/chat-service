import { Router, Request, Response } from 'express';
import getConversations from '../controllers/getConversations';

const router: Router = Router();

router.get('/conversations', (req: Request, res: Response) => {
    getConversations(req, res)
});

export default router;