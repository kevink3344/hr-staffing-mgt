import express, { Request, Response } from 'express';
import { getDatabase } from '../database.js';
import { StaffRecord, StaffRecordHistory } from '../types.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Staff Records
 *   description: CRUD operations for staff records
 */

/**
 * @swagger
 * /api/staff:
 *   get:
 *     tags: [Staff Records]
 *     summary: Get all staff records
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Search term (employee name, position, pos no, emp no, last person name, classroom)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of staff records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StaffRecord'
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
        const { search } = req.query;

        let query = 'SELECT * FROM staff_records';
        const params: any[] = [];

        if (search && typeof search === 'string') {
            query += ` WHERE 
        employee_name LIKE ? OR 
        position_name LIKE ? OR 
        pos_no LIKE ? OR 
        emp_no LIKE ? OR 
        last_person_name LIKE ? OR 
        classroom_assign LIKE ?`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY id';
        const records = await db.all(query, params);
        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     tags: [Staff Records]
 *     summary: Get a staff record by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffRecord'
 *       404:
 *         description: Record not found
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
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { id } = req.params;
        const record = await db.get('SELECT * FROM staff_records WHERE id = ?', [id]);

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch record' });
    }
});

/**
 * @swagger
 * /api/staff:
 *   post:
 *     tags: [Staff Records]
 *     summary: Create a new staff record
 *     security:
 *       - userEmail: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffRecord'
 *     responses:
 *       201:
 *         description: Created record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffRecord'
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
        const data = req.body;

        const columns = Object.keys(data).filter(k => k !== 'id');
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => data[col]);

        const result = await db.run(
            `INSERT INTO staff_records (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        );

        res.status(201).json({ id: result.lastID, ...data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create record' });
    }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     tags: [Staff Records]
 *     summary: Update a staff record (tracks changes to audit history)
 *     security:
 *       - userEmail: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffRecord'
 *     responses:
 *       200:
 *         description: Updated record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffRecord'
 *       404:
 *         description: Record not found
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
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { id } = req.params;
        const changedBy = req.headers['x-user-email'] as string || 'unknown';

        // Get original record
        const original = await db.get('SELECT * FROM staff_records WHERE id = ?', [id]);
        if (!original) {
            return res.status(404).json({ error: 'Record not found' });
        }

        // Calculate changes
        const changes: Record<string, { from: string | null; to: string | null }> = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (key !== 'id' && original[key] !== value) {
                changes[key] = { from: (original[key] as string) || null, to: (value as string) || null };
            }
        }

        // Update record
        const columns = Object.keys(req.body).filter(k => k !== 'id');
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const values = [...columns.map(col => req.body[col]), id];

        await db.run(
            `UPDATE staff_records SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        // Record history
        if (Object.keys(changes).length > 0) {
            await db.run(
                `INSERT INTO staff_record_history (record_id, changed_by, changes)
         VALUES (?, ?, ?)`,
                [id, changedBy, JSON.stringify(changes)]
            );
        }

        res.json({ id: parseInt(id), ...req.body });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update record' });
    }
});

/**
 * @swagger
 * /api/staff/all:
 *   delete:
 *     tags: [Staff Records]
 *     summary: Delete ALL staff records (demo reset)
 *     responses:
 *       200:
 *         description: All records deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deleted:
 *                   type: integer
 *                   description: Number of rows deleted
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/all', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const result = await db.run('DELETE FROM staff_records');
        res.json({ success: true, deleted: result.changes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete all records' });
    }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     tags: [Staff Records]
 *     summary: Delete a staff record by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Record deleted
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
        const { id } = req.params;

        await db.run('DELETE FROM staff_records WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

export default router;
