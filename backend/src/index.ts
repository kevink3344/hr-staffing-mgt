import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { config } from 'dotenv';
import { initializeDatabase } from './database.js';
import staffRoutes from './routes/staff.js';
import historyRoutes from './routes/history.js';
import viewsRoutes from './routes/views.js';
import importRoutes from './routes/import.js';

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
            description: 'API documentation for HR Staffing Management System',
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
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUiExpress.serve);
app.get('/api-docs', swaggerUiExpress.setup(swaggerSpec));

// Health Check Endpoint
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/', (req, res) => {
    res.json({
        message: 'HR Staffing Management API',
        version: '1.0.0',
        apiDocs: '/api-docs'
    });
});

// Routes
app.use('/api/staff', staffRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/views', viewsRoutes);
app.use('/api/import', importRoutes);

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
