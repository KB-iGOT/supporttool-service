import { Router } from 'express';
import { sessionController } from '../controllers/sessions.controller';
import { isAuthenticated } from '../helpers/sessionValidator';

const router = Router();

router.get('/', isAuthenticated, sessionController.getAllSessions);
router.delete('/', isAuthenticated, sessionController.deleteAllSessions);
router.delete('/:sid', isAuthenticated, sessionController.deleteSession);

export default router;