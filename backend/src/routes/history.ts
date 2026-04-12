import express, { Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: History
 *   description: Audit trail for staff record changes
 */

/**
 * @swagger
 * /api/history/{recordId}:
 *   get:
 *     tags: [History]
 *     summary: Get change history for a staff record
 *     parameters:
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of history entries (newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistoryEntry'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { recordId } = req.params;

        const history = await db.all(
            `SELECT id, record_id, changed_by, changes, created_at 
       FROM staff_record_history 
       WHERE record_id = ? 
       ORDER BY created_at DESC`,
            [recordId]
        );

        // Parse JSON changes
        const parsed = history.map((h: any) => ({
            ...h,
            changes: JSON.parse(h.changes),
        }));

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
