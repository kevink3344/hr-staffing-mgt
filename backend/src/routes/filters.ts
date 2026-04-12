import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

// GET /api/filters?created_by=...
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

// POST /api/filters
router.post('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { column_name, column_value } = req.body;
        const createdBy = req.headers['x-user-email'] as string || 'demo@staffing.com';

        if (!column_name || !column_value) {
            return res.status(400).json({ error: 'column_name and column_value are required' });
        }

        const result = await db.run(
            'INSERT INTO saved_filters (column_name, column_value, created_by) VALUES (?, ?, ?)',
            [column_name, column_value, createdBy]
        );
        res.status(201).json({ id: result.lastID, column_name, column_value, created_by: createdBy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save filter' });
    }
});

// DELETE /api/filters/:id
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

export default router;
