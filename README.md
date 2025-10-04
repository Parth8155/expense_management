# Expense Management System

A full-stack expense management application with automated approval workflows, multi-level approvals, and OCR receipt scanning.

## Features

- Role-based access control (Admin, Manager, Employee)
- Automated approval workflows
- Multi-level sequential approvals
- Conditional approval rules (percentage-based, specific approver)
- Currency conversion with real-time exchange rates
- OCR receipt scanning
- Expense tracking and history

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt for password hashing

**Frontend:**
- React 18+
- Material-UI
- Axios
- Tesseract.js for OCR

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd expense-management
```

2. Install backend dependencies
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

1. Start MongoDB (if running locally)
```bash
mongod
```

2. Start the backend server
```bash
cd backend
npm run dev
```

3. Start the frontend development server
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
expense-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## API Documentation

API endpoints will be documented as they are implemented.

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## License

ISC
