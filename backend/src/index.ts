import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './database.js';
import staffRoutes from './routes/staff.js';
import historyRoutes from './routes/history.js';
import viewsRoutes from './routes/views.js';
import importRoutes from './routes/import.js';
import filtersRoutes from './routes/filters.js';
import pinsRoutes from './routes/pins.js';
import commentsRoutes from './routes/comments.js';
import stickyColumnsRoutes from './routes/stickyColumns.js';
import columnColorsRoutes from './routes/columnColors.js';
import queueRoutes from './routes/queue.js';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HR Staffing Management API',
            version: '1.0.0',
            description: 'API for managing school HR staffing records, saved views, persistent filters, import, and audit history.',
            contact: {
                name: 'HR Team',
                email: 'hr@staffing.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                userEmail: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-user-email',
                    description: 'User email for change tracking and data ownership',
                },
            },
            schemas: {
                StaffRecord: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', readOnly: true },
                        employee_name: { type: 'string', nullable: true },
                        emp_no: { type: 'string', nullable: true },
                        contract_renewal_yr: { type: 'string', nullable: true },
                        contract: { type: 'string', nullable: true },
                        contract_end: { type: 'string', nullable: true },
                        emp_percent: { type: 'string', nullable: true },
                        pos_start: { type: 'string', nullable: true, description: 'YYYY-MM-DD' },
                        pos_end: { type: 'string', nullable: true, description: 'YYYY-MM-DD' },
                        pos_no: { type: 'string', nullable: true },
                        account_code: { type: 'string', nullable: true },
                        license_type: { type: 'string', nullable: true },
                        expires: { type: 'string', nullable: true, description: 'YYYY-MM-DD' },
                        position_name: { type: 'string', nullable: true },
                        classroom_teaching_assignment: { type: 'string', nullable: true },
                        mo_available: { type: 'string', nullable: true },
                        mo_used: { type: 'string', nullable: true },
                        track: { type: 'string', nullable: true },
                        last_person_name: { type: 'string', nullable: true, description: 'Future Employee Name' },
                        last_person_no: { type: 'string', nullable: true, description: 'Future Employee No.' },
                        effective_date: { type: 'string', nullable: true, description: 'YYYY-MM-DD' },
                        classroom_assign: { type: 'string', nullable: true },
                        pos_no_new: { type: 'string', nullable: true },
                        mos: { type: 'string', nullable: true },
                        emp_percent_new: { type: 'string', nullable: true },
                        track_new: { type: 'string', nullable: true },
                        pay_grade: { type: 'string', nullable: true },
                        step: { type: 'string', nullable: true },
                        contract_type: { type: 'string', nullable: true },
                        contract_start_date: { type: 'string', nullable: true, description: 'YYYY-MM-DD' },
                        contract_end_date: { type: 'string', nullable: true, description: 'YYYY-MM-DD' },
                        letter_needed: { type: 'string', nullable: true },
                        comments: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time', readOnly: true },
                        updated_at: { type: 'string', format: 'date-time', readOnly: true },
                    },
                },
                SavedView: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', readOnly: true },
                        name: { type: 'string' },
                        column_keys: { type: 'array', items: { type: 'string' } },
                        created_by: { type: 'string' },
                        is_system: { type: 'integer', enum: [0, 1] },
                        created_at: { type: 'string', format: 'date-time', readOnly: true },
                        updated_at: { type: 'string', format: 'date-time', readOnly: true },
                    },
                },
                SavedFilter: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', readOnly: true },
                        column_name: { type: 'string', description: 'DB column key, e.g. contract, pos_end' },
                        column_value: { type: 'string', description: 'Value to filter by (exact match)' },
                        created_by: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time', readOnly: true },
                    },
                },
                HistoryEntry: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', readOnly: true },
                        record_id: { type: 'integer' },
                        changed_by: { type: 'string' },
                        changes: {
                            type: 'object',
                            description: 'Map of field name to {from, to} pair',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    from: { type: 'string', nullable: true },
                                    to: { type: 'string', nullable: true },
                                },
                            },
                        },
                        created_at: { type: 'string', format: 'date-time', readOnly: true },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUiExpress.serve);
app.get('/api-docs', swaggerUiExpress.setup(swaggerSpec));

// Health Check Endpoint
/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: API info
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/api/info', (req, res) => {
    res.json({
        message: 'HR Staffing Management API',
        version: '1.0.0',
        apiDocs: '/api-docs'
    });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns ok if the API server is up and running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routes
app.use('/api/staff', staffRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/views', viewsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/pins', pinsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/sticky-columns', stickyColumnsRoutes);
app.use('/api/column-colors', columnColorsRoutes);
app.use('/api/queue', queueRoutes);

// Serve frontend static files in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = [
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../frontend/dist'),
    path.join(__dirname, '../../../frontend/dist'),
].find(p => fs.existsSync(p)) || path.join(__dirname, '../../frontend/dist');
console.log('Serving frontend from:', frontendDist, 'exists:', fs.existsSync(frontendDist));
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function start() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();
