import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { importExcelData } from '../excelImport.js';

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

export default router;
