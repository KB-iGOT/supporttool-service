import { Request, Response } from 'express';
import pool from '../config/database';

export const sessionController = {
  async getAllSessions(req: Request, res: Response) {
    try {
      const { rows } = await pool.query(
        `SELECT sid, sess, expire, token, user_id FROM public.sessions ORDER BY expire DESC`
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  },

  async deleteSession(req: Request, res: Response) {
    try {
      const { sid } = req.params;
      const result = await pool.query('DELETE FROM sessions WHERE sid = $1', [sid]);
      if (result.rowCount === 0) {
        res.status(404).json({ message: 'Session not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting session:`, error);
      res.status(500).json({ message: 'Failed to delete session' });
    }
  },

  async deleteAllSessions(req: Request, res: Response) {
    try {
      await pool.query('TRUNCATE TABLE sessions');
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting all sessions:', error);
      res.status(500).json({ message: 'Failed to delete all sessions' });
    }
  },
};