import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

interface FutureAssignmentInput {
    classroom_assign?: string;
    pos_no_new?: string;
    mos?: string;
}

router.get('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const recordId = parseInt(req.params.recordId, 10);
        if (Number.isNaN(recordId)) {
            return res.status(400).json({ error: 'Invalid record ID' });
        }

        const rows = await db.all(
            `SELECT id, staff_record_id, future_employee_no, classroom_assign, pos_no_new, mos, sort_order, created_at, updated_at
             FROM future_assignments
             WHERE staff_record_id = ?
             ORDER BY sort_order ASC, id ASC`,
            [recordId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch future assignments' });
    }
});

router.put('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const recordId = parseInt(req.params.recordId, 10);
        const changedBy = (req.headers['x-user-email'] as string) || 'unknown';

        if (Number.isNaN(recordId)) {
            return res.status(400).json({ error: 'Invalid record ID' });
        }

        const record = await db.get('SELECT id, last_person_no FROM staff_records WHERE id = ?', [recordId]);
        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const futureEmployeeNo = (record.last_person_no || '').toString().trim();
        if (!futureEmployeeNo) {
            return res.status(400).json({ error: 'Future Employee No. is required before saving assignments' });
        }

        const rawAssignments = req.body?.assignments;
        if (!Array.isArray(rawAssignments)) {
            return res.status(400).json({ error: 'assignments must be an array' });
        }

        const assignments: FutureAssignmentInput[] = rawAssignments
            .map((item: any) => ({
                classroom_assign: (item?.classroom_assign ?? '').toString().trim(),
                pos_no_new: (item?.pos_no_new ?? '').toString().trim(),
                mos: (item?.mos ?? '').toString().trim(),
            }))
            .filter((a: FutureAssignmentInput) => a.classroom_assign || a.pos_no_new || a.mos);

        for (const a of assignments) {
            if (a.mos && Number.isNaN(Number(a.mos))) {
                return res.status(400).json({ error: 'Mos. must be numeric when provided' });
            }
        }

        const oldRows = await db.all(
            `SELECT classroom_assign, pos_no_new, mos
             FROM future_assignments
             WHERE staff_record_id = ?
             ORDER BY sort_order ASC, id ASC`,
            [recordId]
        );

        await db.run('DELETE FROM future_assignments WHERE staff_record_id = ?', [recordId]);

        for (let i = 0; i < assignments.length; i++) {
            const a = assignments[i];
            await db.run(
                `INSERT INTO future_assignments
                 (staff_record_id, future_employee_no, classroom_assign, pos_no_new, mos, sort_order, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [recordId, futureEmployeeNo, a.classroom_assign || '', a.pos_no_new || '', a.mos || '', i]
            );
        }

        const newRows = await db.all(
            `SELECT id, staff_record_id, future_employee_no, classroom_assign, pos_no_new, mos, sort_order, created_at, updated_at
             FROM future_assignments
             WHERE staff_record_id = ?
             ORDER BY sort_order ASC, id ASC`,
            [recordId]
        );

        const oldJson = JSON.stringify(oldRows.map((r: any) => ({
            classroom_assign: r.classroom_assign || '',
            pos_no_new: r.pos_no_new || '',
            mos: r.mos || '',
        })));
        const newJson = JSON.stringify(newRows.map((r: any) => ({
            classroom_assign: r.classroom_assign || '',
            pos_no_new: r.pos_no_new || '',
            mos: r.mos || '',
        })));

        if (oldJson !== newJson) {
            await db.run(
                `INSERT INTO staff_record_history (record_id, changed_by, changes)
                 VALUES (?, ?, ?)`,
                [recordId, changedBy, JSON.stringify({ future_assignments: { from: oldJson, to: newJson } })]
            );
        }

        res.json(newRows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save future assignments' });
    }
});

export default router;
