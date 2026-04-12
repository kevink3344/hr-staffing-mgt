import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Filters
 *   description: Persistent filter chips saved per user
 */

/**
 * @swagger
 * /api/filters:
 *   get:
 *     tags: [Filters]
 *     summary: Get all saved filters for a user
 *     parameters:
 *       - name: created_by
 *         in: query
 *         description: User email to load filters for
 *         schema:
 *           type: string
 *           example: demo@staffing.com
 *     responses:
 *       200:
 *         description: Array of saved filters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SavedFilter'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const createdBy = req.query.created_by as string || 'demo@staffing.com';
        const filters = await db.all(
            'SELECT * FROM saved_filters WHERE created_by = ? ORDER BY created_at ASC',
            [createdBy]
        );
        res.json(filters);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load filters' });
    }
});

/**
 * @swagger
 * /api/filters:
 *   post:
 *     tags: [Filters]
 *     summary: Save a new filter chip
 *     security:
 *       - userEmail: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [column_name, column_value]
 *             properties:
 *               column_name:
 *                 type: string
 *                 description: Database column key to filter on
 *                 example: contract
 *               column_value:
 *                 type: string
 *                 description: Exact value to match
 *                 example: T
 *     responses:
 *       201:
 *         description: Filter saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavedFilter'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { column_name, column_value } = req.body;
        const createdBy = req.headers['x-user-email'] as string || 'demo@staffing.com';

        if (!column_name || !column_value) {
            return res.status(400).json({ error: 'column_name and column_value are required' });
        }

        const filter_type = req.body.filter_type || 'equals';
        const row_color = req.body.row_color || '';
        const result = await db.run(
            'INSERT INTO saved_filters (column_name, filter_type, column_value, row_color, created_by) VALUES (?, ?, ?, ?, ?)',
            [column_name, filter_type, column_value, row_color, createdBy]
        );
        res.status(201).json({ id: result.lastID, column_name, filter_type, column_value, row_color, created_by: createdBy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save filter' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { id } = req.params;
        const { column_name, column_value, filter_type, row_color } = req.body;

        if (!column_name || !column_value) {
            return res.status(400).json({ error: 'column_name and column_value are required' });
        }

        const existing = await db.get('SELECT id FROM saved_filters WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Filter not found' });

        await db.run(
            'UPDATE saved_filters SET column_name = ?, column_value = ?, filter_type = ?, row_color = ? WHERE id = ?',
            [column_name, column_value, filter_type || 'equals', row_color || '', id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update filter' });
    }
});

/**
 * @swagger
 * /api/filters/{id}:
 *   delete:
 *     tags: [Filters]
 *     summary: Delete a saved filter
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Filter ID to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filter deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        await db.run('DELETE FROM saved_filters WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete filter' });
    }
});

// PATCH /api/filters/:id/toggle – toggle active/inactive
router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const filter = await db.get('SELECT is_active FROM saved_filters WHERE id = ?', [req.params.id]);
        if (!filter) return res.status(404).json({ error: 'Filter not found' });
        const newValue = filter.is_active ? 0 : 1;
        await db.run('UPDATE saved_filters SET is_active = ? WHERE id = ?', [newValue, req.params.id]);
        res.json({ success: true, is_active: newValue });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle filter' });
    }
});

export default router;
