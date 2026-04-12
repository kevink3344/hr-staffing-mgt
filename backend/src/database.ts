import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/database.sqlite');

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
    if (db) return db;

    db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });

    await db.exec('PRAGMA foreign_keys = ON');
    return db;
}

export async function initializeDatabase(): Promise<void> {
    const database = await getDatabase();

    // StaffRecord table
    await database.exec(`
    CREATE TABLE IF NOT EXISTS staff_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT,
      emp_no TEXT,
      contract_renewal_yr TEXT,
      contract TEXT,
      contract_end TEXT,
      emp_percent TEXT,
      pos_start TEXT,
      pos_end TEXT,
      pos_no TEXT,
      account_code TEXT,
      license_type TEXT,
      expires TEXT,
      position_name TEXT,
      classroom_teaching_assignment TEXT,
      mo_available TEXT,
      mo_used TEXT,
      track TEXT,
      last_person_name TEXT,
      last_person_no TEXT,
      effective_date TEXT,
      classroom_assign TEXT,
      pos_no_new TEXT,
      mos TEXT,
      emp_percent_new TEXT,
      track_new TEXT,
      pay_grade TEXT,
      step TEXT,
      contract_type TEXT,
      contract_start_date TEXT,
      contract_end_date TEXT,
      letter_needed TEXT,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // StaffRecordHistory table (for audit trail)
    await database.exec(`
    CREATE TABLE IF NOT EXISTS staff_record_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      changed_by TEXT NOT NULL,
      changes TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES staff_records(id) ON DELETE CASCADE
    )
  `);

    // SavedView table (user-created column views)
    await database.exec(`
    CREATE TABLE IF NOT EXISTS saved_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      column_keys TEXT NOT NULL,
      created_by TEXT NOT NULL,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, created_by)
    )
  `);

    // Create system views
    const systemViews = [
        {
            name: 'All Column View',
            columns: [
                'employee_name', 'emp_no', 'contract_renewal_yr', 'contract', 'contract_end',
                'emp_percent', 'pos_start', 'pos_end', 'pos_no', 'account_code', 'license_type',
                'expires', 'position_name', 'classroom_teaching_assignment', 'mo_available',
                'mo_used', 'track', 'last_person_name', 'last_person_no', 'effective_date',
                'classroom_assign', 'pos_no_new', 'mos', 'emp_percent_new', 'track_new',
                'pay_grade', 'step', 'contract_type', 'contract_start_date', 'contract_end_date',
                'letter_needed', 'comments'
            ]
        },
        {
            name: 'Position View',
            columns: [
                'last_person_name', 'last_person_no', 'effective_date', 'classroom_assign',
                'pos_no_new', 'mos', 'emp_percent_new', 'track_new', 'pay_grade', 'step',
                'contract_type', 'contract_start_date', 'contract_end_date', 'letter_needed', 'comments'
            ]
        }
    ];

    for (const view of systemViews) {
        const existingView = await database.get(
            'SELECT id FROM saved_views WHERE name = ? AND is_system = 1',
            [view.name]
        );

        if (!existingView) {
            await database.run(
                `INSERT INTO saved_views (name, column_keys, created_by, is_system)
         VALUES (?, ?, ?, 1)`,
                [view.name, JSON.stringify(view.columns), 'system']
            );
        }
    }

    // SavedFilters table (persistent filter chips per user)
    await database.exec(`
    CREATE TABLE IF NOT EXISTS saved_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_name TEXT NOT NULL,
      column_value TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('✅ Database initialized');
}

export async function closeDatabase(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}
