import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

const isAdminOrStaffAdmin = (email: string) =>
    email === 'admin@staffing.com' || email === 'testuser2@staffing.com';

const normalizeLabel = (value: unknown) => typeof value === 'string' ? value.trim() : '';

router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const activeOnly = req.query.active_only === '1';
        const rows = await db.all(
            `SELECT * FROM track_new_options
             ${activeOnly ? 'WHERE is_active = 1' : ''}
             ORDER BY sort_order ASC, id ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load Track (new) options' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
        if (!isAdminOrStaffAdmin(userEmail)) {
            return res.status(403).json({ error: 'Only Administrator or Staff Admin User can update Track (new) options' });
        }

        const label = normalizeLabel(req.body?.label);
        if (!label) {
            return res.status(400).json({ error: 'label is required' });
        }

        const maxOrder = await db.get('SELECT MAX(sort_order) as max_order FROM track_new_options');
        const sortOrder = (maxOrder?.max_order ?? -1) + 1;

        const result = await db.run(
            `INSERT INTO track_new_options (label, sort_order, is_active, created_by, updated_by)
             VALUES (?, ?, 1, ?, ?)`,
            [label, sortOrder, userEmail, userEmail]
        );

        const row = await db.get('SELECT * FROM track_new_options WHERE id = ?', [result.lastID]);
        res.status(201).json(row);
    } catch (err: any) {
        console.error(err);
        if (err?.message?.includes('UNIQUE')) {
            return res.status(409).json({ error: 'That Track (new) option already exists' });
        }
        res.status(500).json({ error: 'Failed to create Track (new) option' });
    }
});

router.put('/reorder', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
        if (!isAdminOrStaffAdmin(userEmail)) {
            return res.status(403).json({ error: 'Only Administrator or Staff Admin User can update Track (new) options' });
        }

        const ids = Array.isArray(req.body?.ids) ? req.body.ids as unknown[] : null;
        if (!ids || ids.some((id: unknown) => typeof id !== 'number')) {
            return res.status(400).json({ error: 'ids must be an array of numbers' });
        }

        for (let index = 0; index < ids.length; index += 1) {
            await db.run(
                'UPDATE track_new_options SET sort_order = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [index, userEmail, ids[index] as number]
            );
        }

        const rows = await db.all('SELECT * FROM track_new_options ORDER BY sort_order ASC, id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reorder Track (new) options' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
        if (!isAdminOrStaffAdmin(userEmail)) {
            return res.status(403).json({ error: 'Only Administrator or Staff Admin User can update Track (new) options' });
        }

        const label = normalizeLabel(req.body?.label);
        if (!label) {
            return res.status(400).json({ error: 'label is required' });
        }

        await db.run(
            `UPDATE track_new_options
             SET label = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [label, userEmail, req.params.id]
        );

        const row = await db.get('SELECT * FROM track_new_options WHERE id = ?', [req.params.id]);
        res.json(row);
    } catch (err: any) {
        console.error(err);
        if (err?.message?.includes('UNIQUE')) {
            return res.status(409).json({ error: 'That Track (new) option already exists' });
        }
        res.status(500).json({ error: 'Failed to update Track (new) option' });
    }
});

router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
        if (!isAdminOrStaffAdmin(userEmail)) {
            return res.status(403).json({ error: 'Only Administrator or Staff Admin User can update Track (new) options' });
        }

        await db.run(
            `UPDATE track_new_options
             SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
                 updated_by = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [userEmail, req.params.id]
        );

        const row = await db.get('SELECT * FROM track_new_options WHERE id = ?', [req.params.id]);
        res.json(row);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle Track (new) option' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = (req.headers['x-user-email'] as string) || 'demo@staffing.com';
        if (!isAdminOrStaffAdmin(userEmail)) {
            return res.status(403).json({ error: 'Only Administrator or Staff Admin User can update Track (new) options' });
        }

        await db.run('DELETE FROM track_new_options WHERE id = ?', [req.params.id]);
        const remaining = await db.all('SELECT id FROM track_new_options ORDER BY sort_order ASC, id ASC');
        for (let index = 0; index < remaining.length; index += 1) {
            await db.run(
                'UPDATE track_new_options SET sort_order = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [index, userEmail, remaining[index].id]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete Track (new) option' });
    }
});

export default router;