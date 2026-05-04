import express, { Request, Response } from 'express';
import { getDatabase } from '../database.js';
import { ColumnMapping } from '../types.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Copy Columns
 *   description: Column mapping for copying values between fields
 */

/**
 * @swagger
 * /api/copy-columns:
 *   get:
 *     tags: [Copy Columns]
 *     summary: Get all column mappings
 *     responses:
 *       200:
 *         description: Array of column mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ColumnMapping'
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
        const mappings = await db.all<ColumnMapping[]>('SELECT * FROM column_mappings ORDER BY created_at DESC');
        res.json(mappings);
    } catch (error) {
        console.error('Error fetching column mappings:', error);
        res.status(500).json({ error: 'Failed to fetch column mappings' });
    }
});

/**
 * @swagger
 * /api/copy-columns:
 *   post:
 *     tags: [Copy Columns]
 *     summary: Create a new column mapping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_column
 *               - to_column
 *               - created_by
 *             properties:
 *               from_column:
 *                 type: string
 *                 description: Source column name
 *               to_column:
 *                 type: string
 *                 description: Target column name
 *               created_by:
 *                 type: string
 *                 description: User who created the mapping
 *     responses:
 *       201:
 *         description: Column mapping created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ColumnMapping'
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Mapping already exists
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { from_column, to_column, created_by } = req.body;

        if (!from_column || !to_column || !created_by) {
            return res.status(400).json({ error: 'from_column, to_column, and created_by are required' });
        }

        if (from_column === to_column) {
            return res.status(400).json({ error: 'from_column and to_column cannot be the same' });
        }

        const db = await getDatabase();

        // Check if mapping already exists
        const existing = await db.get(
            'SELECT id FROM column_mappings WHERE from_column = ? AND to_column = ?',
            [from_column, to_column]
        );

        if (existing) {
            return res.status(409).json({ error: 'Column mapping already exists' });
        }

        const result = await db.run(
            'INSERT INTO column_mappings (from_column, to_column, created_by) VALUES (?, ?, ?)',
            [from_column, to_column, created_by]
        );

        const newMapping = await db.get<ColumnMapping>(
            'SELECT * FROM column_mappings WHERE id = ?',
            [result.lastID]
        );

        res.status(201).json(newMapping);
    } catch (error) {
        console.error('Error creating column mapping:', error);
        res.status(500).json({ error: 'Failed to create column mapping' });
    }
});

/**
 * @swagger
 * /api/copy-columns/{id}:
 *   delete:
 *     tags: [Copy Columns]
 *     summary: Delete a column mapping
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Column mapping ID
 *     responses:
 *       204:
 *         description: Column mapping deleted
 *       404:
 *         description: Column mapping not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDatabase();

        const result = await db.run('DELETE FROM column_mappings WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Column mapping not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting column mapping:', error);
        res.status(500).json({ error: 'Failed to delete column mapping' });
    }
});

export default router;