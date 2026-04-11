import XLSX from 'xlsx';
import { getDatabase } from './database.js';
import { STAFF_RECORD_COLUMNS } from './types.js';

export async function importExcelData(filePath: string): Promise<number> {
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const db = await getDatabase();
    let importedCount = 0;

    for (const row of data as Record<string, any>[]) {
        const record: Record<string, any> = {};

        // Map Excel columns to database columns
        // The Excel file should have headers that match or we normalize them
        for (const col of STAFF_RECORD_COLUMNS) {
            const label = col.replace(/_/g, ' ');
            const possibleKeys = [
                col,
                label,
                label.toLowerCase(),
                label.replace(/ /g, '_'),
                ...Object.keys(row).filter(k => k.toLowerCase() === label.toLowerCase())
            ];

            for (const key of possibleKeys) {
                if (row[key] !== undefined) {
                    record[col] = row[key];
                    break;
                }
            }
        }

        if (record.employee_name) {
            try {
                await db.run(
                    `INSERT INTO staff_records (
            ${STAFF_RECORD_COLUMNS.join(', ')}
          ) VALUES (${STAFF_RECORD_COLUMNS.map(() => '?').join(', ')})`,
                    STAFF_RECORD_COLUMNS.map(col => record[col] || null)
                );
                importedCount++;
            } catch (err) {
                console.error('Error inserting row:', err, row);
            }
        }
    }

    return importedCount;
}
