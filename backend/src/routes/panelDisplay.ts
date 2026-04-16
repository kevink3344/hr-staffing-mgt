import { Router, Request, Response } from 'express';
import { getDatabase } from '../database.js';

const router = Router();

const ALLOWED_PRINCIPAL_FIELDS = [
    'last_person_name',
    'last_person_no',
    'effective_date',
    'future_assignments',
    'emp_percent_new',
    'track_new',
    'pay_grade',
    'step',
    'contract_type',
    'contract_start_date',
    'contract_end_date',
    'letter_needed',
    'comments',
];

const isAdminOrStaffAdmin = (email: string) =>
    email === 'admin@staffing.com' || email === 'testuser2@staffing.com';

router.get('/', async (_req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const row = await db.get(
            'SELECT setting_value FROM panel_display_settings WHERE setting_key = ?',
            ['principal_fields']
        );

        let principalFields = [...ALLOWED_PRINCIPAL_FIELDS];
        if (row?.setting_value) {
            try {
                const parsed = JSON.parse(row.setting_value);
                if (Array.isArray(parsed)) {
                    principalFields = parsed.filter((f: string) => ALLOWED_PRINCIPAL_FIELDS.includes(f));
                }
            } catch {
                principalFields = [...ALLOWED_PRINCIPAL_FIELDS];
            }
        }

        res.json({ principal_fields: principalFields });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load panel display settings' });
    }
});

router.put('/', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const userEmail = (req.headers['x-user-email'] as string) || 'demo@staffing.com';

        if (!isAdminOrStaffAdmin(userEmail)) {
            return res.status(403).json({ error: 'Only Administrator or Staff Admin User can update panel display settings' });
        }

        const principalFields = req.body?.principal_fields;
        if (!Array.isArray(principalFields)) {
            return res.status(400).json({ error: 'principal_fields must be an array' });
        }

        const normalized = principalFields
            .filter((f: unknown): f is string => typeof f === 'string')
            .filter((f: string, idx: number, arr: string[]) => arr.indexOf(f) === idx)
            .filter((f: string) => ALLOWED_PRINCIPAL_FIELDS.includes(f));

        await db.run(
            `INSERT INTO panel_display_settings (setting_key, setting_value, updated_by, updated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(setting_key) DO UPDATE SET
               setting_value = excluded.setting_value,
               updated_by = excluded.updated_by,
               updated_at = CURRENT_TIMESTAMP`,
            ['principal_fields', JSON.stringify(normalized), userEmail]
        );

        res.json({ principal_fields: normalized });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save panel display settings' });
    }
});

export default router;
