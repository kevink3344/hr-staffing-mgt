# HR Staffing Management System

A full-stack application for managing HR staffing operations with React, TypeScript, Tailwind CSS, and a SQLite backend.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **JetBrains Mono** - Monospace font
- **2px Border Radius** - Consistent design system

### Backend
- **Express.js** - REST API server
- **SQLite** - Relational database
- **TypeScript** - Type-safe backend
- **Swagger/OpenAPI** - API documentation
- **CORS** - Cross-origin resource sharing

## Project Structure

```
hr-staffing-mgt/
├── frontend/          # React TypeScript Tailwind app
│   ├── src/
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── backend/           # Express API server
│   ├── src/
│   ├── tsconfig.json
│   └── package.json
├── package.json       # Monorepo root
└── .github/
    └── copilot-instructions.md
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

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

### Development

**Run both frontend and backend:**
```bash
npm run dev
```

**Run frontend only:**
```bash
npm run frontend
```

**Run backend only:**
```bash
npm run backend
```

### Build

```bash
npm run build
```

### API Documentation

Once the backend is running, visit: http://localhost:3000/api-docs

## Features

- ✅ Full-stack monorepo setup
- ✅ REST API with CRUD operations
- ✅ Swagger/OpenAPI documentation
- ✅ SQLite database integration
- ✅ Type-safe frontend and backend
- ✅ Tailwind CSS with consistent 2px border radius
- ✅ JetBrains Mono font throughout

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/database.sqlite
```

## Next Steps

1. Define project requirements
2. Create database schema
3. Implement CRUD API endpoints
4. Build UI components
5. Connect frontend to API

## License

MIT
