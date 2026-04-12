import XLSX from 'xlsx';
import { getDatabase } from './database.js';
import { STAFF_RECORD_COLUMNS } from './types.js';

// Normalize a string for fuzzy matching: lowercase, strip punctuation/spaces
function normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Map of normalized db column name -> db column key
// Also includes common aliases from real-world Excel exports
const COLUMN_ALIASES: Record<string, string> = {
    // Standard mappings
    'employeename': 'employee_name',
    'empname': 'employee_name',
    'name': 'employee_name',
    'empno': 'emp_no',
    'employeeno': 'emp_no',
    'employeenumber': 'emp_no',
    'id': 'emp_no',
    'contractrenewalyr': 'contract_renewal_yr',
    'contractrenewal': 'contract_renewal_yr',
    'renewalyr': 'contract_renewal_yr',
    'contract': 'contract',
    'contractend': 'contract_end',
    'emp': 'emp_percent',
    'emppercent': 'emp_percent',
    'fte': 'emp_percent',
    'posstart': 'pos_start',
    'positionstart': 'pos_start',
    'startdate': 'pos_start',
    'posend': 'pos_end',
    'positionend': 'pos_end',
    'enddate': 'pos_end',
    'posno': 'pos_no',
    'positionnumber': 'pos_no',
    'positionno': 'pos_no',
    'accountcode': 'account_code',
    'account': 'account_code',
    'licensetype': 'license_type',
    'license': 'license_type',
    'expires': 'expires',
    'licenseexpires': 'expires',
    'expiration': 'expires',
    'positionname': 'position_name',
    'position': 'position_name',
    'title': 'position_name',
    'classroomteachingassignment': 'classroom_teaching_assignment',
    'classroomteaching': 'classroom_teaching_assignment',
    'teachingassignment': 'classroom_teaching_assignment',
    'assignment': 'classroom_teaching_assignment',
    'moavailable': 'mo_available',
    'monthsavailable': 'mo_available',
    'moused': 'mo_used',
    'monthsused': 'mo_used',
    'track': 'track',
    'lastpersonname': 'last_person_name',
    'lastname': 'last_person_name',
    'lastperson': 'last_person_name',
    'lastpersonno': 'last_person_no',
    'lastpersonnumber': 'last_person_no',
    'lastpersonno2': 'last_person_no',
    'effectivedate': 'effective_date',
    'effective': 'effective_date',
    'classroomassign': 'classroom_assign',
    'classroom': 'classroom_assign',
    'classroomassignment': 'classroom_assign',
    'posnameornew': 'pos_no_new',
    'posnonew': 'pos_no_new',
    'newposno': 'pos_no_new',
    'mos': 'mos',
    'months': 'mos',
    'newemppercent': 'emp_percent_new',
    'empnew': 'emp_percent_new',
    'emppercnew': 'emp_percent_new',
    'emppercentnew': 'emp_percent_new',
    'newtrack': 'track_new',
    'tracknew': 'track_new',
    'paygrade': 'pay_grade',
    'grade': 'pay_grade',
    'step': 'step',
    'contracttype': 'contract_type',
    'type': 'contract_type',
    'contractstartdate': 'contract_start_date',
    'contractstart': 'contract_start_date',
    'contractenddate': 'contract_end_date',
    'contractends': 'contract_end_date',
    'letterneeded': 'letter_needed',
    'letter': 'letter_needed',
    'comments': 'comments',
    'notes': 'comments',
    'comment': 'comments',
};

// Build a mapping from each normalized db column name to its key
for (const col of STAFF_RECORD_COLUMNS) {
    COLUMN_ALIASES[normalize(col)] = col;
}

function mapHeaderToColumn(header: string): string | null {
    const norm = normalize(header);
    return COLUMN_ALIASES[norm] ?? null;
}

// Columns that hold date values — used to detect and format date serials
const DATE_COLUMNS = new Set([
    'pos_start', 'pos_end', 'contract_end', 'expires',
    'effective_date', 'contract_start_date', 'contract_end_date',
]);

function formatDate(val: any): string | null {
    // Already a JS Date (from cellDates: true)
    if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    // Fallback: Excel serial number
    if (typeof val === 'number' && val > 10000 && val < 200000) {
        const epoch = new Date(Math.round((val - 25569) * 86400 * 1000));
        const y = epoch.getUTCFullYear();
        const m = String(epoch.getUTCMonth() + 1).padStart(2, '0');
        const d = String(epoch.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return null;
}

export async function importExcelData(filePath: string): Promise<number> {
    // cellDates: true makes xlsx return JS Date objects for date cells automatically
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const raw = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

    if (raw.length === 0) {
        console.log('[Import] No rows found in spreadsheet');
        return 0;
    }

    const excelHeaders = Object.keys(raw[0]);
    console.log('[Import] Excel headers found:', excelHeaders);

    // Build header -> db column map
    const headerMap: Record<string, string> = {};
    for (const header of excelHeaders) {
        const dbCol = mapHeaderToColumn(header);
        if (dbCol) {
            headerMap[header] = dbCol;
            console.log(`[Import] Mapped "${header}" -> "${dbCol}"`);
        } else {
            console.log(`[Import] No mapping for header: "${header}"`);
        }
    }

    const db = await getDatabase();
    let importedCount = 0;
    let skippedCount = 0;

    for (const [rowIdx, row] of raw.entries()) {
        const record: Record<string, any> = {};

        for (const [excelHeader, dbCol] of Object.entries(headerMap)) {
            const val = row[excelHeader];
            if (val === null || val === undefined || val === '') continue;

            if (DATE_COLUMNS.has(dbCol)) {
                const formatted = formatDate(val);
                if (formatted) {
                    record[dbCol] = formatted;
                } else {
                    record[dbCol] = String(val);
                }
            } else {
                record[dbCol] = String(val).trim();
            }
        }

        // Require at least a Pos No. to consider a row valid
        if (!record.pos_no) {
            console.log(`[Import] Row ${rowIdx + 2} skipped — no pos_no. Row keys: ${Object.keys(record).join(', ') || '(empty)'}`);
            skippedCount++;
            continue;
        }

        // Ensure employee_name is never undefined (schema allows NULL now)
        if (!record.employee_name) record.employee_name = '';

        try {
            const cols = STAFF_RECORD_COLUMNS.filter(c => record[c] !== undefined);
            if (cols.length === 0) continue;

            await db.run(
                `INSERT INTO staff_records (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
                cols.map(c => record[c])
            );
            importedCount++;
        } catch (err) {
            console.error('[Import] Error inserting row:', err, record);
        }
    }

    console.log(`[Import] Done: ${importedCount} imported, ${skippedCount} skipped (no pos_no), ${raw.length} total rows`);
    return importedCount;
}
