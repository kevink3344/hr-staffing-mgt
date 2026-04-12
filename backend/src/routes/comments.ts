import express, { Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = express.Router();

// Get all comments for a record
router.get('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { recordId } = req.params;
        const comments = await db.all(
            'SELECT * FROM record_comments WHERE record_id = ? ORDER BY created_at ASC',
            [recordId]
        );
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Add a comment to a record
router.post('/:recordId', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { recordId } = req.params;
        const { message } = req.body;
        const author = req.headers['x-user-email'] as string || 'demo@staffing.com';

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await db.run(
            'INSERT INTO record_comments (record_id, author, message) VALUES (?, ?, ?)',
            [recordId, author, message.trim()]
        );

        const comment = await db.get('SELECT * FROM record_comments WHERE id = ?', [result.lastID]);
        res.status(201).json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Delete a comment (own only)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const { id } = req.params;
        const author = req.headers['x-user-email'] as string || 'demo@staffing.com';

        const comment = await db.get('SELECT * FROM record_comments WHERE id = ?', [id]);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.author !== author) return res.status(403).json({ error: 'Can only delete your own comments' });

        await db.run('DELETE FROM record_comments WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

export default router;
