import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

// GET /api/pins – get pins for a user (personal + all team pins)
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const pinnedBy = req.query.pinned_by as string || 'demo@staffing.com';
        // Return user's own pins (personal + team) and all team pins from others
        const rows = await db.all(
            `SELECT record_id, pin_type, pinned_by FROM pinned_records
             WHERE pinned_by = ? OR pin_type = 'team'
             ORDER BY created_at ASC`,
            [pinnedBy]
        );
        // Deduplicate: for each record, determine effective pin type for this user
        const pinMap: Record<number, { pin_type: string }> = {};
        for (const r of rows as any[]) {
            const existing = pinMap[r.record_id];
            if (r.pinned_by === pinnedBy) {
                // User's own pin takes priority for showing their state
                pinMap[r.record_id] = { pin_type: r.pin_type };
            } else if (!existing) {
                // Team pin from another user
                pinMap[r.record_id] = { pin_type: 'team' };
            }
        }
        res.json(Object.entries(pinMap).map(([id, v]) => ({ record_id: Number(id), pin_type: v.pin_type })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load pins' });
    }
});

// POST /api/pins/:recordId – pin or update pin type for a record
router.post('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const recordId = parseInt(req.params.recordId, 10);
        const pinnedBy = req.headers['x-user-email'] as string || 'demo@staffing.com';
        const pinType = req.body.pin_type === 'team' ? 'team' : 'personal';

        // Upsert: insert or update pin_type
        const existing = await db.get(
            'SELECT id FROM pinned_records WHERE record_id = ? AND pinned_by = ?',
            [recordId, pinnedBy]
        );
        if (existing) {
            await db.run(
                'UPDATE pinned_records SET pin_type = ? WHERE record_id = ? AND pinned_by = ?',
                [pinType, recordId, pinnedBy]
            );
        } else {
            await db.run(
                'INSERT INTO pinned_records (record_id, pinned_by, pin_type) VALUES (?, ?, ?)',
                [recordId, pinnedBy, pinType]
            );
        }
        res.status(201).json({ success: true, record_id: recordId, pin_type: pinType });
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
