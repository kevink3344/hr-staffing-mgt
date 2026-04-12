import express, { Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Views
 *   description: Saved column views for staff records
 */

/**
 * @swagger
 * /api/views:
 *   get:
 *     tags: [Views]
 *     summary: Get all saved views (system + user-created)
 *     parameters:
 *       - name: created_by
 *         in: query
 *         description: User email to include user-created views
 *         schema:
 *           type: string
 *           example: demo@staffing.com
 *     responses:
 *       200:
 *         description: Array of views
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SavedView'
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
        const { created_by } = req.query;

        let query = 'SELECT * FROM saved_views WHERE is_system = 1';
        const params: any[] = [];

        if (created_by) {
            query += ' OR created_by = ?';
            params.push(created_by);
        }

        query += ' ORDER BY is_system DESC, name';
        const views = await db.all(query, params);

        // Parse column_keys JSON
        const parsed = views.map((v: any) => ({
            ...v,
            column_keys: JSON.parse(v.column_keys),
        }));

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch views' });
    }
});

/**
 * @swagger
 * /api/views:
 *   post:
 *     tags: [Views]
 *     summary: Create a new saved view
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, column_keys, created_by]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Custom View
 *               column_keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [employee_name, pos_no, contract]
 *               created_by:
 *                 type: string
 *                 example: demo@staffing.com
 *     responses:
 *       201:
 *         description: Created view
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavedView'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: View name already exists for this user
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
        const { name, column_keys, created_by } = req.body;

        if (!name || !column_keys || !created_by) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.run(
            `INSERT INTO saved_views (name, column_keys, created_by)
       VALUES (?, ?, ?)`,
            [name, JSON.stringify(column_keys), created_by]
        );

        res.status(201).json({
            id: result.lastID,
            name,
            column_keys,
            created_by,
            is_system: 0,
        });
    } catch (err: any) {
        console.error(err);
        if (err.message?.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'View name already exists for this user' });
        }
        res.status(500).json({ error: 'Failed to create view' });
    }
});

/**
 * @swagger
 * /api/views/{id}:
 *   put:
 *     tags: [Views]
 *     summary: Update a saved view (cannot update system views)
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               column_keys:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated view
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavedView'
 *       400:
 *         description: No fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cannot edit system views
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: View not found
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
        const { name, column_keys } = req.body;

        // Verify ownership
        const view = await db.get('SELECT created_by, is_system FROM saved_views WHERE id = ?', [id]);
        if (!view) {
            return res.status(404).json({ error: 'View not found' });
        }

        if (view.is_system) {
            return res.status(403).json({ error: 'Cannot edit system views' });
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (column_keys) {
            updates.push('column_keys = ?');
            params.push(JSON.stringify(column_keys));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        await db.run(
            `UPDATE saved_views SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ id: parseInt(id), ...req.body });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update view' });
    }
});

/**
 * @swagger
 * /api/views/{id}:
 *   delete:
 *     tags: [Views]
 *     summary: Delete a saved view (cannot delete system views)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: View deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Cannot delete system views
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: View not found
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
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { id } = req.params;

        const view = await db.get('SELECT is_system FROM saved_views WHERE id = ?', [id]);
        if (!view) {
            return res.status(404).json({ error: 'View not found' });
        }

        if (view.is_system) {
            return res.status(403).json({ error: 'Cannot delete system views' });
        }

        await db.run('DELETE FROM saved_views WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete view' });
    }
});

router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const view = await db.get('SELECT is_system, is_active FROM saved_views WHERE id = ?', [req.params.id]);
        if (!view) return res.status(404).json({ error: 'View not found' });
        if (view.is_system) return res.status(403).json({ error: 'Cannot toggle system views' });
        const newValue = view.is_active ? 0 : 1;
        await db.run('UPDATE saved_views SET is_active = ? WHERE id = ?', [newValue, req.params.id]);
        res.json({ success: true, is_active: newValue });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle view' });
    }
});

export default router;
