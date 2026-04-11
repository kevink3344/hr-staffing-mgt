# Quick Start Guide

## 🚀 Start the Application

```bash
cd hr-staffing-mgt
npm run dev
```

This starts both:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

## 📥 Import Your Excel Data

1. Open http://localhost:5173 in your browser
2. Click the **📥 Import** button (top-right header)
3. Select your Excel file (supports .xlsx, .xls, .csv)
4. Click "Import"
5. Wait for "✅ Successfully imported X records!"
6. Click "🔄 Refresh" to see your data

**Example file**: "FUTURE - Carroll Middle School - 360 - future staff - as of 2026-04-10.xlsx"

## 📊 Using the Application

### Main Table Features
- **Search**: Type to filter by employee name, position, emp no, etc.
- **Color Codes**:
  - 🟨 Yellow = Contract needs renewal (Contract = "T" or "TR")
  - 🔴 Red = Position ends soon (2026-06-30)
  - 🟩 Green = New position starts (2026-07-01)
- **Click any row**: Opens edit panel on the right

### Edit Panel
- **Details Tab**: Edit staff information
  - Read-only: Employee Name, Position Name, Pos No., Emp No.
  - Editable: Last Person Name, Pay Grade, Contract Dates, Comments, etc.
- **History Tab**: See all changes with timestamps and who made them
- **Save**: Commits changes and creates audit trail entry

### Custom Views
1. Click **⚙ Views** button
2. See 2 system views (all columns, position columns)
3. Create custom views:
   - Click **+ New View**
   - Select columns you want (numbered 1-33)
   - Name your view
   - Click **Save View**
4. Switch views from dropdown in main table

## 🔧 Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start frontend + backend |
| `npm run frontend` | Frontend only (port 5173) |
| `npm run backend` | Backend only (port 3000) |
| `npm run build` | Build for production |

## 📁 Project Structure

```
hr-staffing-mgt/
├── frontend/          # React + TypeScript + Tailwind
│   └── src/
│       ├── components/    # UI components (Table, Flyout, Views)
│       ├── App.tsx       # Main component
│       ├── api.ts        # API client
│       └── constants.ts  # Column definitions
├── backend/           # Express + SQLite API
│   └── src/
│       ├── routes/       # API endpoints
│       ├── database.ts   # SQLite schema
│       └── excelImport.ts # Excel parsing
├── data/             # SQLite database (created on first run)
└── node_modules/     # Dependencies
```

## 🗄️ Database

- **Type**: SQLite
- **Location**: `backend/data/database.sqlite`
- **Tables**:
  - `staff_records` - 33 columns of employee data
  - `staff_record_history` - Audit trail of changes
  - `saved_views` - User-created column views

### Reset Database
```bash
# Delete the database file
rm backend/data/database.sqlite

# Restart backend
npm run backend
```

## 🌐 API Endpoints

All endpoints documented at: **http://localhost:3000/api-docs**

### Staff Records
- `GET /api/staff?search=term` - List/search records
- `GET /api/staff/{id}` - Get single record
- `POST /api/staff` - Create record
- `PUT /api/staff/{id}` - Update record (tracked in history)
- `DELETE /api/staff/{id}` - Delete record

### History
- `GET /api/history/{recordId}` - Get change history

### Views
- `GET /api/views` - List all views
- `POST /api/views` - Create view
- `PUT /api/views/{id}` - Update view
- `DELETE /api/views/{id}` - Delete view

### Import
- `POST /api/import/excel` - Upload Excel file

## ⚙️ Configuration

### JetBrains Mono Font
Already configured globally for all components. Editor settings in `.vscode/settings.json`.

### Tailwind CSS
- Border radius: 2px (consistent everywhere)
- Font: JetBrains Mono
- Dark theme: gray-900 foreground with light backgrounds

## 📝 Excel Import Requirements

Your Excel file should have:
1. **Headers in first row** matching these 33 fields:
   - Employee Name, Emp No., Contract Renewal Yr, Contract, Contract End
   - % Emp, Pos Start, Pos End, Pos No., Account Code, License Type, Expires
   - Position Name, Classroom/Teaching Assignment, Mo. Available, Mo. Used, Track
   - Last Person Name, Last Person #, Effective Date, Classroom Assign
   - Pos No. (New), Mos., % Emp (New), Track (New), Pay Grade, Step
   - Contract Type, Contract Start Date, Contract End Date, Letter Needed?, Comments

2. **Data rows** with at least Employee Name populated

3. **Supported formats**: .xlsx, .xls, .csv

## 🐛 Troubleshooting

**Frontend not loading?**
- Verify backend is running: http://localhost:3000
- Check browser console (F12) for errors
- Refresh page

**Import fails?**
- Check Excel file structure
- Ensure first row has headers
- Verify Employee Name column has data
- Check backend logs for details

**No records showing after import?**
- Click 🔄 Refresh button
- Check search bar is empty (not filtering)
- Check view selector shows "All Column View"

**Port already in use?**
- Frontend: `npm run frontend -- --port 5174`
- Backend: `PORT=3001 npm run backend`

## 📚 Full Documentation

See detailed docs:
- **[README.md](README.md)** - Complete feature overview & API reference
- **[SETUP.md](SETUP.md)** - Detailed Excel import guide
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Developer guidelines

## 🚢 Push to GitHub

Ready to commit your code:

```bash
# Add your GitHub remote
git remote add origin https://github.com/yourusername/hr-staffing-mgt.git

# Push to GitHub
git push -u origin master
```

All 3 commits are ready:
1. Initial scaffold (config & dependencies)
2. Full implementation (backend & frontend)
3. Complete documentation (README, SETUP, guidelines)

## 💡 Next Steps

1. ✅ Import your Excel data
2. ✅ Create custom views for different roles
3. ✅ Edit records and verify history tracking
4. ✅ Test search/filtering
5. ✅ Explore API at http://localhost:3000/api-docs
6. ✅ Deploy to production (recommended: PostgreSQL instead of SQLite)

---

**Happy staffing! 🎓**
