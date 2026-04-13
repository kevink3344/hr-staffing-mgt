import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use /home/data on Azure (persists across deploys, outside wwwroot)
// Fall back to ../data for local development
const isAzure = !!process.env.WEBSITE_SITE_NAME;
const DB_DIR = isAzure ? '/home/data' : path.join(__dirname, '../data');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
    if (db) return db;

    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

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
      filter_type TEXT NOT NULL DEFAULT 'equals',
      column_value TEXT NOT NULL,
      row_color TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Migration: add filter_type column if missing
    const filterCols = await database.all("PRAGMA table_info(saved_filters)");
    if (!filterCols.some((c: any) => c.name === 'filter_type')) {
        await database.exec("ALTER TABLE saved_filters ADD COLUMN filter_type TEXT NOT NULL DEFAULT 'equals'");
    }
    if (!filterCols.some((c: any) => c.name === 'row_color')) {
        await database.exec("ALTER TABLE saved_filters ADD COLUMN row_color TEXT NOT NULL DEFAULT ''");
    }
    if (!filterCols.some((c: any) => c.name === 'is_active')) {
        await database.exec("ALTER TABLE saved_filters ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
    }
    if (!filterCols.some((c: any) => c.name === 'highlight_type')) {
        await database.exec("ALTER TABLE saved_filters ADD COLUMN highlight_type TEXT NOT NULL DEFAULT 'row'");
    }
    if (!filterCols.some((c: any) => c.name === 'is_system')) {
        await database.exec("ALTER TABLE saved_filters ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0");
    }

    // Migrate existing single-value column_value to JSON array format
    const allFilters = await database.all("SELECT id, column_value FROM saved_filters");
    for (const f of allFilters) {
        if (!f.column_value.startsWith('[')) {
            await database.run('UPDATE saved_filters SET column_value = ? WHERE id = ?', [JSON.stringify([f.column_value]), f.id]);
        }
    }

    // Seed system filters if none exist
    const systemFilterCount = await database.get("SELECT COUNT(*) as count FROM saved_filters WHERE is_system = 1");
    if (systemFilterCount.count === 0) {
        const systemFilters = [
            { column_name: 'contract', filter_type: 'equals', column_value: '["T","TR"]', row_color: 'yellow', highlight_type: 'row' },
            { column_name: 'pos_end', filter_type: 'equals', column_value: '["2026-06-30"]', row_color: 'red', highlight_type: 'row' },
            { column_name: 'pos_start', filter_type: 'equals', column_value: '["2026-07-01"]', row_color: 'green', highlight_type: 'cell' },
        ];
        for (const sf of systemFilters) {
            await database.run(
                'INSERT INTO saved_filters (column_name, filter_type, column_value, row_color, highlight_type, is_system, created_by) VALUES (?, ?, ?, ?, ?, 1, ?)',
                [sf.column_name, sf.filter_type, sf.column_value, sf.row_color, sf.highlight_type, 'system']
            );
        }
    }

    // Migration: add is_active column to saved_views if missing
    const viewCols = await database.all("PRAGMA table_info(saved_views)");
    if (!viewCols.some((c: any) => c.name === 'is_active')) {
        await database.exec("ALTER TABLE saved_views ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
    }

    // PinnedRecords table (per-user pinned staff records)
    await database.exec(`
    CREATE TABLE IF NOT EXISTS pinned_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      pinned_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(record_id, pinned_by),
      FOREIGN KEY (record_id) REFERENCES staff_records(id) ON DELETE CASCADE
    )
  `);

    // RecordComments table (threaded comments per record)
    await database.exec(`
    CREATE TABLE IF NOT EXISTS record_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES staff_records(id) ON DELETE CASCADE
    )
  `);

    // StickyColumns table
    await database.exec(`
    CREATE TABLE IF NOT EXISTS sticky_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_name TEXT NOT NULL,
      column_width INTEGER NOT NULL DEFAULT 220,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(column_name, created_by)
    )
  `);

    // Migration: add column_width to sticky_columns if missing
    const stickyCols = await database.all("PRAGMA table_info(sticky_columns)");
    if (!stickyCols.some((c: any) => c.name === 'column_width')) {
        await database.exec("ALTER TABLE sticky_columns ADD COLUMN column_width INTEGER NOT NULL DEFAULT 220");
    }

    // ColumnColors table (pastel background colors per column)
    await database.exec(`
    CREATE TABLE IF NOT EXISTS column_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(column_name, created_by)
    )
  `);

    // Queue items table
    await database.exec(`
    CREATE TABLE IF NOT EXISTS queue_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_record_id INTEGER NOT NULL,
      employee_name TEXT,
      employee_no TEXT,
      position_name TEXT,
      pos_no TEXT,
      effective_date TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_record_id) REFERENCES staff_records(id) ON DELETE CASCADE
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
