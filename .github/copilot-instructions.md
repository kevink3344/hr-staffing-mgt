## HR Staffing Management System - Project Complete ✅

**Status**: Production-ready HR staffing management application with spreadsheet-style interface, edit flyout panels, audit history, custom views, and Excel data import.

**Completed**:
- [x] Full-stack monorepo with npm workspaces
- [x] Database schema (StaffRecord + History + SavedViews)
- [x] Express REST API with CRUD operations
- [x] Swagger/OpenAPI documentation
- [x] Excel import functionality (.xlsx, .xls, .csv)
- [x] React spreadsheet-style table with 33 columns
- [x] Row color coding (yellow for contract, red for end dates, green for start dates)
- [x] Right-side edit flyout panel with tabs
- [x] Audit history tracking with change diffs
- [x] Custom column views (+ 2 system views)
- [x] Multi-field search and filtering
- [x] JetBrains Mono font + 2px border radius design system
- [x] Dark theme with brutalist/monospace aesthetic
- [x] TypeScript throughout frontend and backend

### Developer Guidelines

**Before editing, know this**:

1. **Monorepo Structure**
   - Root `package.json` uses npm workspaces
   - `frontend/` and `backend/` are separate packages
   - `npm run dev` runs both simultaneously
   - Dependencies installed with `npm install` at root

2. **Database**
   - SQLite file at `backend/data/database.sqlite`
   - Schema auto-initialized on first run
   - Three main tables: staff_records, staff_record_history, saved_views
   - Delete .sqlite file to reset database

3. **Frontend Architecture**
   - React 18 + TypeScript + Tailwind CSS
   - No routing framework (simple state-based page switching)
   - API client at `src/api.ts`
   - Components in `src/components/`
   - Main page: MainTable.tsx | Views page: ViewsPage.tsx

4. **Backend Architecture**
   - Express.js with modular routes
   - Database utilities: `src/database.ts`
   - Routes: staff.ts, history.ts, views.ts, import.ts
   - All DB operations with sqlite npm library

5. **API Design**
   - REST with JSON payloads
   - Change tracking via `x-user-email` header (from localStorage)
   - History stored as JSON {field: {from, to}} in database
   - Swagger-JSDoc comments in route files

6. **Code Style**
   - Font: JetBrains Mono everywhere
   - Border radius: 2px globally (in Tailwind config)
   - Colors: dark gray-900 foreground, light backgrounds, card whites
   - Component styling: inline classes + Tailwind
   - No CSS files except global index.css

### Common Tasks

**Add a New Column to Staff Records**:
1. Update `STAFF_COLUMNS` array in `frontend/src/constants.ts`
2. Add label to `COLUMN_LABELS` object
3. Backend schema auto-handles new fields (TEXT type)
4. Add to editable fields in `EditFlyout.tsx` if needed

**Add New API Endpoint**:
1. Create new route file in `backend/src/routes/`
2. Add Swagger JSDoc comments
3. Import in `backend/src/index.ts` and wire with `app.use()`
4. Test via `/api-docs` Swagger UI

**Change Colors/Styling**:
1. Row colors: `frontend/src/utils.ts` (getRowColorClass, getCellColorClass)
2. Theme colors: Edit Tailwind classes directly in components
3. Fonts: Already JetBrains Mono everywhere
4. Border radius: Already 2px in tailwind.config.js

**Modify Excel Import Behavior**:
1. Column mapping: `backend/src/excelImport.ts`
2. File handling: `backend/src/routes/import.ts` (multer config)
3. Frontend upload: `frontend/src/components/ImportModal.tsx`
4. Max file size: Edit multer configuration

**Creating a Custom Report/View**:
1. Query staff_records directly from backend
2. Create new route endpoint
3. Wire into React component
4. Or use saved_views for predefined column combos

### Key Files Map

| Function | File | Location |
|----------|------|----------|
| Table rendering | MainTable.tsx | frontend/src/components/ |
| Edit panel | EditFlyout.tsx | frontend/src/components/ |
| Views management | ViewsPage.tsx | frontend/src/components/ |
| Staff record CRUD | staff.ts | backend/src/routes/ |
| History tracking | history.ts | backend/src/routes/ |
| Custom views | views.ts | backend/src/routes/ |
| Excel import | import.ts, excelImport.ts | backend/src/routes/ & backend/src/ |
| API client | api.ts | frontend/src/ |
| Column config | constants.ts | frontend/src/ |
| Color logic | utils.ts | frontend/src/ |
| DB schema | database.ts | backend/src/ |
| Types | types.ts | backend/src/ |

### Testing Workflow

1. **Import test data**:
   - `npm run dev`
   - Click 📥 Import in UI
   - Select Excel file
   - Verify records appear

2. **Edit and history**:
   - Click any row
   - Edit a field
   - Save
   - Click History tab to verify change

3. **Custom views**:
   - Click ⚙ Views
   - Create view with subset of columns
   - Verify dropdown updates
   - Select view and verify table changes

4. **API tests**:
   - Visit http://localhost:3000/api-docs
   - Try endpoints in Swagger UI
   - Verify responses

### Deployment Notes

- Remove `localStorage.getItem('userEmail')` defaults → add real auth
- Use environment variables for config
- Enable HTTPS in production
- Consider PostgreSQL instead of SQLite for multi-user
- Implement file cleanup for uploads/
- Add rate limiting on import endpoint
- Set proper CORS origins (not *)

### Future Enhancements

- User authentication & role-based access
- Bulk edit operations
- CSV/Excel export functionality
- Advanced filtering (date ranges, multi-column)
- Real-time updates with WebSockets
- File upload validation & sanitization
- Automated backups
- Change notifications
- Department/group views
- Performance dashboards

---

**Last Updated**: April 11, 2026
**Database**: SQLite (development)
**Frontend Deployment**: Vite build to static files
**Backend Deployment**: Node.js + Express
