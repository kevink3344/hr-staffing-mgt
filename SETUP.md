# Excel Import Setup Guide

This guide explains how to import your HR staffing data from Excel into the HR Staffing Management System.

## Quick Start

### 1. Start the Application
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

### 2. Import Your Excel File
1. Open http://localhost:5173 in your browser
2. You'll see the HR Staffing table (initially empty)
3. Click the **📥 Import** button in the top-right header
4. Select your Excel file (e.g., "FUTURE - Carroll Middle School - 360 - future staff - as of 2026-04-10.xlsx")
5. Click **Import** button
6. Wait for success message showing "Successfully imported X records"
7. Click **🔄 Refresh** button to reload the table with your data

### 3. View Your Data
Once imported:
- Your staff records will appear in the spreadsheet-style table
- Use the **Search** box to filter records
- Click any row to edit details and see change history
- Use the **⚙ Views** button to create custom column views

## Excel File Format

### Supported Formats
- .xlsx (Excel modern format)
- .xls (Excel legacy format)
- .csv (comma-separated values)

### Required Structure

**First row must contain headers** that match or correspond to these fields:

```
1. Employee Name           17. Track
2. Emp No.                18. Last Person Name
3. Contract Renewal Yr     19. Last Person #
4. Contract                20. Effective Date
5. Contract End            21. Classroom Assign
6. % Emp                   22. Pos No. (New)
7. Pos Start               23. Mos.
8. Pos End                 24. % Emp (New)
9. Pos No.                 25. Track (New)
10. Account Code           26. Pay Grade
11. License Type           27. Step
12. Expires                28. Contract Type
13. Position Name          29. Contract Start Date
14. Classroom/Teaching     30. Contract End Date
15. Mo. Available          31. Letter Needed?
16. Mo. Used               32. Comments
```

### Header Matching Rules

The import system is flexible with header names:
- **Spaces vs. Underscores**: "Employee Name" = "employee_name" = "Employee_Name"
- **Case-Insensitive**: "emp_no" = "EMP_NO" = "Emp No"
- **Partial Matching**: Any column containing "Employee" and "Name" will match
- **Number Signs**: "#" in headers automatically converts to "number"

### Example Valid Headers
```
✅ "Employee Name", "emp_no", "Contract", "Pos Start", "Last Person #"
✅ "employee_name", "EMP NO.", "CONTRACT", "POS_START", "last person number"
✅ Mix of styles: "Employee Name", "emp_no", "Position Name", "pos_start"
```

## Typical Excel File Structure

### Columns (in order)
```
A: Employee Name     L: Expires              Y: % Emp (New)
B: Emp No.          M: Position Name        Z: Track (New)
C: Contract Renewal R: Classroom/Teaching   AA: Pay Grade
D: Contract         S: Mo. Available        AB: Step
E: Contract End     T: Mo. Used             AC: Contract Type
F: % Emp            U: Track                AD: Contract Start Date
G: Pos Start        V: Last Person Name     AE: Contract End Date
H: Pos End          W: Last Person #        AF: Letter Needed?
I: Pos No.          X: Effective Date       AG: Comments
J: Account Code     Y: Classroom Assign
K: License Type     Z: Pos No. (New)
```

### Example Row Data
```
Name: John Smith
Emp No: ES-001
Position: Math Teacher
Contract: T
Pos Start: 2026-07-01
Pos End: 2027-06-30
Pay Grade: 5
Step: 3
...
```

## Import Process Details

### What Happens During Import

1. **File Upload**: Excel file is sent to backend
2. **Parsing**: File is parsed using the XLSX library
3. **Column Mapping**: Headers are intelligently matched to database fields
4. **Data Validation**: Each row is checked for required fields (employee_name)
5. **Database Insert**: Valid rows are inserted into staff_records table
6. **Success Response**: Number of imported records is returned

### Data Validation Rules

- **Required**: `employee_name` field must have a value
- **Optional**: All other fields can be empty
- **Duplicates**: No duplicate checking (updates must be done manually for now)
- **Data Types**: All values stored as TEXT in SQLite
  - Dates should be in format: YYYY-MM-DD
  - Percentages as text: "50%", "0.5", "50.0"

### Error Handling

**Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| "No file uploaded" | File selection failed | Try selecting file again |
| Import shows 0 records | No rows with Employee Name | Check first column has data |
| Some rows not imported | Missing Employee Name field | Ensure all rows have name in col A |
| Column data in wrong place | Headers don't match | See "Header Matching Rules" above |

## After Import

### Initial Database State
- 33 columns of staff record data
- System views: "All Column View", "Position View"
- No change history yet (history created on first edit)

### Next Actions
1. **Search**: Use search box to find staff
2. **Edit**: Click any row to open edit panel
3. **Create Views**: Click ⚙ to build custom views
4. **Add More Data**: Use Import again to add more records

## Database State Persistence

### Database Storage
- Location: `backend/data/database.sqlite`
- Created automatically on first import
- Persists between restarts/rebuilds

### Reset Database
To start fresh:
```bash
# Stop the server (Ctrl+C)
# Delete the database file
rm backend/data/database.sqlite

# Restart
npm run dev
```

All data in the database will be cleared.

## Technical Details

### Import API Endpoint
```
POST /api/import/excel
Content-Type: multipart/form-data

File attribute: "file" (the Excel file)

Response:
{
  "success": true,
  "imported": 150
}
```

### Backend Import Handler
- Location: `backend/src/routes/import.ts`
- Uses: `multer` for file handling + `xlsx` for parsing
- Files temporarily stored in: `backend/uploads/`
- Cleanup: Temporary files are not automatically removed (manual cleanup recommended)

### Frontend Import Modal
- Location: `frontend/src/components/ImportModal.tsx`
- Max file size: 50MB (configurable in `import.ts`)
- Supported formats: .xlsx, .xls, .csv

## Example: Importing Your Data

### Step-by-Step
1. Prepare Excel file: "staff_data.xlsx"
2. Start app: `npm run dev`
3. Wait for: "Server running on http://localhost:3000"
4. Open: http://localhost:5173
5. Click: 📥 Import button
6. Select: Your Excel file
7. Click: Import
8. Wait: ~2-5 seconds for processing
9. See: "✅ Successfully imported 150 records!"
10. Click: 🔄 Refresh
11. Success: Table now shows your data!

## Troubleshooting

### Import Button Not Showing
- Check: Backend is running (http://localhost:3000 accessible)
- Check: Frontend is on http://localhost:5173
- Try: Refresh browser (Ctrl+R or Cmd+R)

### "Import failed" Error Message
- Check: File is valid Excel/CSV
- Check: First row has headers
- Check: Employee Name column is not empty
- Try: Open Excel file and verify data is readable
- Check: Console for detailed errors (F12 in browser)

### Imported Data Not Appearing
- Click: 🔄 Refresh button
- Check: Search bar is empty (not filtering results out)
- Verify: View selector shows "All Column View"
- Check: Network tab in DevTools (F12) for 200 responses

### Slow Import (>10 seconds)
- Normal: For >1000 records
- Check: File size in file manager
- On Windows: May need 5-10 seconds for sqlite3 module
- Try: Smaller import (test with 10 rows first)

### Browser Shows "Cannot POST /api/import/excel"
- Check: Backend server is running
- Verify: No CORS errors in console
- Check: Port 3000 is not blocked by firewall

## Support

For issues:
1. Check backend console: `npm run backend` output
2. Check browser console: F12 Developer Tools → Console tab
3. Check backend logs for database errors
4. Verify Excel file structure matches requirements

## Next Steps After Import

### 1. Edit Records
- Click any row to open right-side edit panel
- Edit "Last Person Name", "Pay Grade", "Comments", etc.
- Changes are auto-tracked in history
- Save to commit changes

### 2. Create Custom Views
- Click ⚙ Views button
- Create new view with specific columns
- Save view
- Select from dropdown on main table

### 3. Search & Filter
- Use search box for quick filtering
- Searches: name, position, pos no, emp no, etc.
- Case-insensitive matching

### 4. Explore API
- Visit: http://localhost:3000/api-docs
- Try: GET /api/staff
- Try: GET /api/history/{recordId}
- Check Swagger UI for all endpoints

## Important Notes

⚠️ **Development Mode**: This is a development setup
- No user authentication (uses email from localStorage)
- No production security measures
- SQLite not ideal for concurrent users
- File uploads saved temporarily (clean manually)

✅ **For Production**:
- Add user authentication
- Migrate to PostgreSQL or similar
- Implement role-based permissions
- Add audit logging
- Set up automated backups
- Use environment variables for secrets

---

**Questions?** Check the main [README.md](../README.md) for more details about features and architecture.
