import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

// GET /api/pins – get all pinned record IDs for a user
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const pinnedBy = req.query.pinned_by as string || 'demo@staffing.com';
        const rows = await db.all(
            'SELECT record_id FROM pinned_records WHERE pinned_by = ? ORDER BY created_at ASC',
            [pinnedBy]
        );
        res.json(rows.map((r: any) => r.record_id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load pins' });
    }
});

// POST /api/pins/:recordId – pin a record
router.post('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const recordId = parseInt(req.params.recordId, 10);
        const pinnedBy = req.headers['x-user-email'] as string || 'demo@staffing.com';

        await db.run(
            'INSERT OR IGNORE INTO pinned_records (record_id, pinned_by) VALUES (?, ?)',
            [recordId, pinnedBy]
        );
        res.status(201).json({ success: true, record_id: recordId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to pin record' });
    }
});

// DELETE /api/pins/:recordId – unpin a record
router.delete('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const recordId = parseInt(req.params.recordId, 10);
        const pinnedBy = req.headers['x-user-email'] as string || 'demo@staffing.com';

        await db.run(
            'DELETE FROM pinned_records WHERE record_id = ? AND pinned_by = ?',
            [recordId, pinnedBy]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to unpin record' });
    }
});

export default router;
