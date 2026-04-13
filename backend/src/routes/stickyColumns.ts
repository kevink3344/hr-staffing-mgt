import { Router } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

// GET all sticky columns
router.get('/', async (req, res) => {
    const db = await getDatabase();
    const createdBy = (req.query.created_by as string) || (req.headers['x-user-email'] as string) || 'demo@staffing.com';
    const rows = await db.all('SELECT * FROM sticky_columns WHERE created_by = ? ORDER BY sort_order ASC', [createdBy]);
    res.json(rows);
});

// POST create sticky column
router.post('/', async (req, res) => {
    const db = await getDatabase();
    const createdBy = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
    const { column_name, column_width } = req.body;
    if (!column_name) {
        res.status(400).json({ error: 'column_name is required' });
        return;
    }
    const width = Math.max(100, Math.min(500, parseInt(column_width) || 220));
    const maxOrder = await db.get('SELECT MAX(sort_order) as max_order FROM sticky_columns WHERE created_by = ?', [createdBy]);
    const sortOrder = (maxOrder?.max_order ?? -1) + 1;
    const result = await db.run(
        'INSERT INTO sticky_columns (column_name, column_width, sort_order, is_active, created_by) VALUES (?, ?, ?, 1, ?)',
        [column_name, width, sortOrder, createdBy]
    );
    const row = await db.get('SELECT * FROM sticky_columns WHERE id = ?', [result.lastID]);
    res.status(201).json(row);
});

// PUT update sticky column
router.put('/:id', async (req, res) => {
    const db = await getDatabase();
    const { column_name, column_width } = req.body;
    const width = column_width ? Math.max(100, Math.min(500, parseInt(column_width) || 220)) : undefined;
    if (width !== undefined) {
        await db.run('UPDATE sticky_columns SET column_name = ?, column_width = ? WHERE id = ?', [column_name, width, req.params.id]);
    } else {
        await db.run('UPDATE sticky_columns SET column_name = ? WHERE id = ?', [column_name, req.params.id]);
    }
    const row = await db.get('SELECT * FROM sticky_columns WHERE id = ?', [req.params.id]);
    res.json(row);
});

// PATCH toggle active
router.patch('/:id/toggle', async (req, res) => {
    const db = await getDatabase();
    await db.run('UPDATE sticky_columns SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?', [req.params.id]);
    const row = await db.get('SELECT * FROM sticky_columns WHERE id = ?', [req.params.id]);
    res.json(row);
});

// DELETE sticky column
router.delete('/:id', async (req, res) => {
    const db = await getDatabase();
    await db.run('DELETE FROM sticky_columns WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// PUT reorder
router.put('/reorder', async (req, res) => {
    const db = await getDatabase();
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
        res.status(400).json({ error: 'ids array required' });
        return;
    }
    for (let i = 0; i < ids.length; i++) {
        await db.run('UPDATE sticky_columns SET sort_order = ? WHERE id = ?', [i, ids[i]]);
    }
    res.json({ success: true });
});

export default router;
