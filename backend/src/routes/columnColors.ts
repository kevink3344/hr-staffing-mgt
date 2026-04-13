import { Router } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

// GET all column colors
router.get('/', async (req, res) => {
    const db = await getDatabase();
    const createdBy = (req.query.created_by as string) || (req.headers['x-user-email'] as string) || 'demo@staffing.com';
    const rows = await db.all('SELECT * FROM column_colors WHERE created_by = ? ORDER BY column_name ASC', [createdBy]);
    res.json(rows);
});

// POST create column color
router.post('/', async (req, res) => {
    const db = await getDatabase();
    const createdBy = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
    const { column_name, color } = req.body;
    if (!column_name || !color) {
        res.status(400).json({ error: 'column_name and color are required' });
        return;
    }
    const result = await db.run(
        'INSERT INTO column_colors (column_name, color, is_active, created_by) VALUES (?, ?, 1, ?)',
        [column_name, color, createdBy]
    );
    const row = await db.get('SELECT * FROM column_colors WHERE id = ?', [result.lastID]);
    res.status(201).json(row);
});

// PUT update column color
router.put('/:id', async (req, res) => {
    const db = await getDatabase();
    const { column_name, color } = req.body;
    await db.run('UPDATE column_colors SET column_name = ?, color = ? WHERE id = ?', [column_name, color, req.params.id]);
    const row = await db.get('SELECT * FROM column_colors WHERE id = ?', [req.params.id]);
    res.json(row);
});

// PATCH toggle active
router.patch('/:id/toggle', async (req, res) => {
    const db = await getDatabase();
    await db.run('UPDATE column_colors SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?', [req.params.id]);
    const row = await db.get('SELECT * FROM column_colors WHERE id = ?', [req.params.id]);
    res.json(row);
});

// DELETE column color
router.delete('/:id', async (req, res) => {
    const db = await getDatabase();
    await db.run('DELETE FROM column_colors WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

export default router;
