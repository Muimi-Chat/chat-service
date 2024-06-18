import { Router, Request, Response } from 'express';
import getConversations from '../controllers/getConversations';
import getConversationMessages from '../controllers/getConversationMessages';

const router: Router = Router();

router.get('/conversations', (req: Request, res: Response) => {
    getConversations(req, res)
});

router.get('/conversation/messages', (req: Request, res: Response) => {
    getConversationMessages(req, res)
})

export default router;