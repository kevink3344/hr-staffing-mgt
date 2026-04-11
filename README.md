# HR Staffing Management System

A brutalist/monospace-designed full-stack application for managing HR staffing operations at Carroll Middle School. Built with a spreadsheet-style interface featuring row color coding, edit panels, audit history tracking, and customizable column views.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **JetBrains Mono** - Monospace font throughout
- **2px Border Radius** - Consistent brutalist design

### Backend
- **Express.js** - REST API server
- **SQLite** - Relational database
- **TypeScript** - Type-safe backend
- **Swagger/OpenAPI** - Auto-generated API documentation
- **CORS** - Cross-origin resource sharing
- **XLSX** - Excel file parsing and import

## Features

✅ **Spreadsheet-Style Table**
- Responsive horizontal scrolling
- Synchronized top scrollbar navigation
- Row color coding:
  - **Yellow** for Contract = "T" or "TR"
  - **Red** for Pos End = 2026-06-30
  - **Green cells** for Pos Start = 2026-07-01
- Row number indicators
- Quick search with multi-field filtering
- Record count badge & refresh button

✅ **Edit Flyout Panel**
- Right-side slide-in panel with position info
- Two tabs: Details (editable) & History (audit trail)
- Editable fields: Last Person Name, Pos No. (New), Pay Grade, Contract Dates, Comments, etc.
- Auto-tracked change history with user email & timestamps
- Red strikethrough (old) and green (new) values in history view

✅ **Data Audit Trail**
- `StaffRecordHistory` table logs all changes
- Tracks: which fields changed, old value → new value, who changed it, when
- Read-only history view in edit panel

✅ **Custom Column Views**
- Two locked system views: "All Column View" & "Position View" (last 15 columns)
- Create/edit/delete custom views per user
- View selector dropdown on main page
- Column checkbox editor when creating views

✅ **Excel Data Import**
- Upload .xlsx files directly from UI
- Auto-maps Excel columns to database fields
- Supports partial/incremental imports
- Success message with record count

✅ **Database Schema**
- `staff_records` - 33 columns for complete employee data
- `staff_record_history` - Audit trail with JSON change diffs
- `saved_views` - User-created views (system views are locked)

✅ **Full REST API**
- `/api/staff` - CRUD operations with search
- `/api/history/{recordId}` - Change audit trail
- `/api/views` - View management
- `/api/import/excel` - Excel file upload
- Swagger docs at `/api-docs`

## Data Model

### StaffRecord Entity (33 Fields)
```
employee_name, emp_no, contract_renewal_yr, contract, contract_end,
emp_percent, pos_start, pos_end, pos_no, account_code, license_type,
expires, position_name, classroom_teaching_assignment, mo_available,
mo_used, track, last_person_name, last_person_no, effective_date,
classroom_assign, pos_no_new, mos, emp_percent_new, track_new,
pay_grade, step, contract_type, contract_start_date, contract_end_date,
letter_needed, comments
```

### StaffRecordHistory Entity
```
id, record_id, changed_by (user email), changes (JSON), created_at
```

### SavedView Entity
```
id, name, column_keys (JSON array), created_by (user email), is_system, created_at
```

## Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hr-staffing-mgt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables** (optional)
   ```bash
   cp backend/.env.example backend/.env
   ```
   Default: PORT=3000, NODE_ENV=development

## Development

### Start Both Frontend & Backend
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

### Run Frontend Only
```bash
npm run frontend
```
Runs on http://localhost:5173 with API proxy to localhost:3000

### Run Backend Only
```bash
npm run backend
```
Runs on http://localhost:3000

### Build for Production
```bash
npm run build
```

## Project Structure

```
hr-staffing-mgt/
├── frontend/                    # React TypeScript Tailwind app
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── MainTable.tsx   # Main spreadsheet interface
│   │   │   ├── EditFlyout.tsx  # Right-side edit panel
│   │   │   ├── ViewsPage.tsx   # View management page
│   │   │   └── ImportModal.tsx # Excel import modal
│   │   ├── api.ts              # Axios API client
│   │   ├── constants.ts        # Column definitions & labels
│   │   ├── utils.ts            # Row/cell color logic
│   │   ├── App.tsx             # Main app routing
│   │   └── index.css           # Tailwind styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── staff.ts        # Staff record CRUD
│   │   │   ├── history.ts      # Change audit trail
│   │   │   ├── views.ts        # View management
│   │   │   └── import.ts       # Excel import endpoint
│   │   ├── database.ts         # SQLite initialization & schema
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── excelImport.ts      # Excel parsing & import logic
│   │   └── index.ts            # Express server setup
│   ├── data/                   # SQLite database file (created on first run)
│   ├── uploads/                # Temporary Excel files during import
│   ├── tsconfig.json
│   └── package.json
│
├── .github/
│   └── copilot-instructions.md
├── .vscode/
│   └── settings.json           # JetBrains Mono font config
├── package.json               # Monorepo root (npm workspaces)
└── README.md
```

## API Endpoints

### Staff Records
- `GET /api/staff` - List all records (supports ?search=term)
- `GET /api/staff/{id}` - Get single record
- `POST /api/staff` - Create new record
- `PUT /api/staff/{id}` - Update record (auto-tracked in history)
- `DELETE /api/staff/{id}` - Delete record

### Change History
- `GET /api/history/{recordId}` - Get audit trail for a record

### Views
- `GET /api/views?created_by=user@email.com` - Get all views
- `POST /api/views` - Create custom view
- `PUT /api/views/{id}` - Update custom view
- `DELETE /api/views/{id}` - Delete custom view

### Import
- `POST /api/import/excel` - Upload Excel file (multipart/form-data)

## Excel Import Guide

### Uploading Data

1. Click **📥 Import** button in the header
2. Select your .xlsx file (e.g., "FUTURE - Carroll Middle School - 360 - future staff - as of 2026-04-10.xlsx")
3. Click "Import" to process
4. Wait for success message showing record count
5. Click **🔄 Refresh** to reload the table

### Excel File Requirements

- First row should contain headers matching the data model
- Supported column headers:
  - "Employee Name", "Emp No.", "Position Name", "Pos No.", etc.
  - Underscores or spaces both work ("pos_start", "Pos Start", "pos start")
  - Case-insensitive matching
  
- Supported formats: .xlsx, .xls, .csv (via xlsx library)

### Field Mapping

The import automatically maps Excel columns to database fields. For example:
- "Employee Name" → `employee_name`
- "Emp No." → `emp_no`
- "Position Name" → `position_name`
- Any column with "Emp No." or "emp_no" or "emp no" → mapped correctly

## Using the Application

### Main Table View
1. **Search**: Type in the search box to filter by:
   - Employee Name
   - Position Name
   - Pos No.
   - Emp No.
   - Last Person Name
   - Classroom Assignment

2. **Color Codes**: Understand row highlights
   - Yellow rows = Contract needs renewal
   - Red rows = Position ends soon (2026-06-30)
   - Green cells = New position starts (2026-07-01)

3. **Click any row** to open the edit panel

### Edit Flyout Panel
- **Details Tab**: Edit most fields (read-only: Employee Name, Pos No., Position Name)
- **History Tab**: View all changes with timestamps and who made them
- Click **Save** to commit changes (auto-tracked in history)
- Click **Cancel** to close without saving

### Managing Views
1. Click **⚙ Views** button in header
2. **System Views** (read-only):
   - All Column View: Every column
   - Position View: Last Person Name through Comments
3. **Custom Views**:
   - Click **+ New View** to create
   - Check columns you want to display (numbered 1-33)
   - Name your view
   - Click **Save View**
   - Edit or delete existing views

### Back to Table
- Click **← Back to Table** button to return from Views page
- Your selected view persists

## Configuration

### JetBrains Mono Font
Font is already configured in:
- `frontend/index.html` - Google Fonts import
- `frontend/tailwind.config.js` - Font family extension
- `.vscode/settings.json` - Editor font

To change, edit `.vscode/settings.json`:
```json
{
  "editor.fontFamily": "'JetBrains Mono', 'Courier New', monospace"
}
```

### Colors & Styling
All colors and borders defined in components. Key theme:
- **Dark foreground**: #1a1a2e / gray-900
- **Off-white background**: #f1f5f9 / slate-100
- **Card whites**: #ffffff
- **Border radius**: 2px globally

## Troubleshooting

### Port Already in Use
- Frontend: `npm run frontend -- --host localhost --port 5174`
- Backend: `PORT=3001 npm run backend`
- Update Vite proxy in `frontend/vite.config.ts` if backend port changes

### SQLite Errors
- Delete `backend/data/database.sqlite` to reset database
- Restart backend server: `npm run backend`

### Excel Import Fails
- Ensure file has headers in first row
- Check Excel column names match data model
- Maximum file size: limited by multer (default 50MB)

### CORS Issues
- Backend CORS is enabled by default
- Verify frontend is on http://localhost:5173
- Check `backend/src/index.ts` CORS configuration

## Production Deployment

### Pre-deployment Checklist
- [ ] Build frontend: `npm run build -w frontend`
- [ ] Build backend: `npm run build -w backend`
- [ ] Set environment variables: `PORT`, `NODE_ENV`, database path
- [ ] Use production SQLite database path
- [ ] Configure user authentication (currently uses `localStorage.getItem('userEmail')`)
- [ ] Enable HTTPS for production
- [ ] Set up proper file upload size limits

### Environment Variables
Create `.env` in backend root:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=/path/to/database.sqlite
```

## Next Steps

1. **User Authentication**: Add login system to track user emails properly
2. **Advanced Filtering**: Add multi-column filters and date range pickers
3. **Export**: Add export to Excel/CSV functionality
4. **Permissions**: Role-based access control for editing/viewing
5. **Notifications**: Real-time updates when records change
6. **Analytics**: Dashboard with staffing statistics and trends

## License

MIT

## Support

For issues or questions, contact the HR team at hr@staffing.com
