import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

// GET /api/user-settings – get all settings for the logged-in user
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = req.headers['x-user-email'] as string || 'demo@staffing.com';
        const rows = await db.all('SELECT setting_key, setting_value FROM user_settings WHERE user_email = ?', [userEmail]);
        const settings: Record<string, string> = {};
        rows.forEach((r: any) => { settings[r.setting_key] = r.setting_value; });
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load user settings' });
    }
});

// PUT /api/user-settings – upsert a setting for the logged-in user
router.put('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = req.headers['x-user-email'] as string || 'demo@staffing.com';
        const { key, value } = req.body;

        if (!key) return res.status(400).json({ error: 'key is required' });

        await db.run(
            `INSERT INTO user_settings (user_email, setting_key, setting_value, updated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_email, setting_key) DO UPDATE SET setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
            [userEmail, key, value, value]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save user setting' });
    }
});

export default router;
