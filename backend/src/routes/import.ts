import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { importExcelData } from '../excelImport.js';
import { getDatabase } from '../database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, '../../uploads') });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Import
 *   description: Import data from Excel files
 */

/**
 * @swagger
 * /api/import/excel:
 *   post:
 *     tags: [Import]
 *     summary: Import staff records from Excel file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import successful
 */
router.post('/excel', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const count = await importExcelData(req.file.path);
        res.json({ success: true, imported: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to import Excel file' });
    }
});

/**
 * @swagger
 * /api/import/headers:
 *   post:
 *     tags: [Import]
 *     summary: Preview headers from an Excel file (debug)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Headers found in file
 */
router.post('/headers', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

        const headers = raw.length > 0 ? Object.keys(raw[0]) : [];
        const sampleRow = raw[0] ?? {};

        res.json({
            sheetName: workbook.SheetNames[0],
            totalRows: raw.length,
            headers,
            sampleRow,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read Excel file' });
    }
});

// Export staff records as Excel file
router.get('/export', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();
        const records = await db.all('SELECT * FROM staff_records ORDER BY id');

        const ws = XLSX.utils.json_to_sheet(records);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Records');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="staff-records-export.xlsx"');
        res.send(buf);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Fix existing records that have Excel date serials stored as strings (e.g. "46203")
router.post('/fix-dates', async (req: Request, res: Response) => {
    try {
        const db = await getDatabase();

        const DATE_COLS = ['pos_start', 'pos_end', 'contract_end', 'expires',
            'effective_date', 'contract_start_date', 'contract_end_date'];

        function serialToDate(serial: number): string {
            const epoch = new Date(Math.round((serial - 25569) * 86400 * 1000));
            const y = epoch.getUTCFullYear();
            const m = String(epoch.getUTCMonth() + 1).padStart(2, '0');
            const d = String(epoch.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const records = await db.all('SELECT id, ' + DATE_COLS.join(', ') + ' FROM staff_records');
        let fixed = 0;

        for (const record of records) {
            const updates: string[] = [];
            const params: any[] = [];

            for (const col of DATE_COLS) {
                const val = record[col];
                if (val && /^\d{4,6}$/.test(String(val).trim())) {
                    const serial = parseInt(val, 10);
                    if (serial > 10000 && serial < 200000) {
                        updates.push(`${col} = ?`);
                        params.push(serialToDate(serial));
                    }
                }
            }

            if (updates.length > 0) {
                params.push(record.id);
                await db.run(`UPDATE staff_records SET ${updates.join(', ')} WHERE id = ?`, params);
                fixed++;
            }
        }

        res.json({ success: true, recordsFixed: fixed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fix dates' });
    }
});

export default router;
