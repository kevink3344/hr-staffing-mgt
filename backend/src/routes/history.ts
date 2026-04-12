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
// Global activity feed — recent changes across all records
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const offset = parseInt(req.query.offset as string) || 0;

        const history = await db.all(
            `SELECT h.id, h.record_id, h.changed_by, h.changes, h.created_at,
                    s.employee_name, s.pos_no
             FROM staff_record_history h
             LEFT JOIN staff_records s ON s.id = h.record_id
             ORDER BY h.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const parsed = history.map((h: any) => ({
            ...h,
            changes: JSON.parse(h.changes),
        }));

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
});

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
