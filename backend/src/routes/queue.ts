import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

const VALID_STATUSES = ['Pending', 'In Progress', 'Completed', 'Error', 'Cancelled', 'Hold'];

// GET /api/queue – list all queue items (optional ?status= filter)
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const status = req.query.status as string | undefined;
        const staffRecordId = req.query.staff_record_id as string | undefined;

        let query = 'SELECT * FROM queue_items';
        const params: any[] = [];
        const conditions: string[] = [];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (staffRecordId) {
            conditions.push('staff_record_id = ?');
            params.push(parseInt(staffRecordId, 10));
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';

        const rows = await db.all(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load queue items' });
    }
});

// POST /api/queue – create a queue item from a staff record
router.post('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const createdBy = req.headers['x-user-email'] as string || 'demo@staffing.com';
        const { staff_record_id } = req.body;

        if (!staff_record_id) {
            return res.status(400).json({ error: 'staff_record_id is required' });
        }

        // Fetch the staff record to copy fields
        const record = await db.get('SELECT * FROM staff_records WHERE id = ?', [staff_record_id]);
        if (!record) {
            return res.status(404).json({ error: 'Staff record not found' });
        }

        // Check if already queued (non-cancelled)
        const existing = await db.get(
            "SELECT id FROM queue_items WHERE staff_record_id = ?",
            [staff_record_id]
        );
        if (existing) {
            return res.status(409).json({ error: 'Record is already in the queue' });
        }

        const result = await db.run(
            `INSERT INTO queue_items (staff_record_id, employee_name, employee_no, position_name, pos_no, effective_date, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
            [
                staff_record_id,
                record.last_person_name || '',
                record.last_person_no || '',
                record.position_name || '',
                record.pos_no || '',
                record.effective_date || '',
                createdBy,
            ]
        );

        const item = await db.get('SELECT * FROM queue_items WHERE id = ?', [result.lastID]);

        // Log history for adding to queue
        await db.run(
            `INSERT INTO staff_record_history (record_id, changed_by, changes) VALUES (?, ?, ?)`,
            [
                staff_record_id,
                createdBy,
                JSON.stringify({ queue: { from: null, to: 'Added to queue' } }),
            ]
        );

        res.status(201).json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create queue item' });
    }
});

// PATCH /api/queue/:id/status – update status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const id = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        await db.run(
            'UPDATE queue_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        const item = await db.get('SELECT * FROM queue_items WHERE id = ?', [id]);
        if (!item) return res.status(404).json({ error: 'Queue item not found' });

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update queue item status' });
    }
});

// PUT /api/queue/:id – update queue item fields
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const id = parseInt(req.params.id, 10);
        const { employee_name, employee_no, position_name, pos_no, effective_date } = req.body;

        await db.run(
            `UPDATE queue_items SET employee_name = ?, employee_no = ?, position_name = ?, pos_no = ?, effective_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [employee_name, employee_no, position_name, pos_no, effective_date, id]
        );

        const item = await db.get('SELECT * FROM queue_items WHERE id = ?', [id]);
        if (!item) return res.status(404).json({ error: 'Queue item not found' });

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update queue item' });
    }
});

// DELETE /api/queue/:id – delete a queue item
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const id = parseInt(req.params.id, 10);

        const item = await db.get('SELECT * FROM queue_items WHERE id = ?', [id]);
        if (!item) return res.status(404).json({ error: 'Queue item not found' });

        const deletedBy = req.headers['x-user-email'] as string || 'demo@staffing.com';

        await db.run('DELETE FROM queue_items WHERE id = ?', [id]);

        // Log history for removing from queue
        await db.run(
            `INSERT INTO staff_record_history (record_id, changed_by, changes) VALUES (?, ?, ?)`,
            [
                item.staff_record_id,
                deletedBy,
                JSON.stringify({ queue: { from: 'In queue', to: 'Removed from queue' } }),
            ]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete queue item' });
    }
});

export default router;
