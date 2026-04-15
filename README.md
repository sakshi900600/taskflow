# TaskFlow Manager

A production-ready full-stack task management system built with Flask, React, and SQLite/PostgreSQL.

---

## Table of Contents

- [Technical Decisions](#technical-decisions)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Risks & Trade-offs](#risks--trade-offs)
- [Extension Approaches](#extension-approaches)
- [AI Usage](#ai-usage)

---

## Technical Decisions

**Backend: Flask + SQLAlchemy**
Flask is lightweight and minimal, making it ideal for REST APIs. SQLAlchemy ORM provides SQL injection protection and an easy migration path. JWT enables stateless auth for horizontal scaling. Pydantic handles runtime type safety.

**Frontend: React**
Context API and `useState` are sufficient at this scale — no Redux needed. Axios provides better error handling and request interceptors. Components are small, focused, and testable.

**Database: SQLite (Dev) / PostgreSQL (Prod)**
SQLite requires zero configuration for development. PostgreSQL is used in production for better concurrency.

---

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    React    │ ──────► │    Flask    │ ──────► │   SQLite    │
│  Frontend   │ ◄────── │   Backend   │ ◄────── │  Database   │
│   :5173     │   JWT   │   :5000     │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

**Key Design Patterns**

- **Repository Pattern** — Models encapsulate database logic
- **DTO Pattern** — Schemas validate data at boundaries
- **Factory Pattern** — Task creation validated through schemas

---

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=sqlite:///tasks.db" > .env
echo "JWT_SECRET_KEY=your-super-secret-key-change-this" >> .env

python app.py
```

Backend runs at: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/register` | Create account | `{email, password, name?}` |
| `POST` | `/api/login` | Get JWT token | `{email, password}` |

### Task Endpoints

All task endpoints require a `Bearer` token.

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/tasks` | Get all tasks | — |
| `GET` | `/api/tasks/{id}` | Get single task | — |
| `POST` | `/api/tasks` | Create task | `{title, description?, status?, priority?, due_date?}` |
| `PUT` | `/api/tasks/{id}` | Update task | Partial task object |
| `DELETE` | `/api/tasks/{id}` | Delete task | — |
| `GET` | `/api/tasks/search?q=&status=&priority=` | Search/filter | — |

### Example Requests

```bash
# Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Create Task (use token from login)
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","priority":"high"}'
```

---

## Testing

### Run Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Manual Test Checklist

- [ ] User registration with valid/invalid emails
- [ ] Login with correct/wrong passwords
- [ ] Create task with all fields
- [ ] Create task with minimal fields
- [ ] Update task status/priority
- [ ] Delete task with confirmation
- [ ] Search tasks by title
- [ ] Filter by status and priority
- [ ] Unauthorized access blocked

---

## Risks & Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT stored in `localStorage` | XSS vulnerability | Add `HttpOnly` cookies in production |
| No rate limiting | Brute force attacks | Add `Flask-Limiter` middleware |
| SQLite in production | Concurrency issues | Use PostgreSQL in production |
| No pagination | Performance with 1000+ tasks | Add `limit`/`offset` parameters |
| No refresh tokens | User logs out every 24h | Implement refresh token rotation |

**Security measures already in place:**

- Passwords hashed with bcrypt (cost factor 10)
- All inputs validated with Pydantic schemas
- SQL injection prevented via SQLAlchemy ORM
- CORS configured for localhost only
- JWT expires in 24 hours

---

## Extension Approaches

**Short-term (1–2 days)**

- Task sharing — add `shared_with` column and share tokens
- Due date reminders — Celery + Redis for email notifications
- File attachments — S3/MinIO integration

**Medium-term (1 week)**

- Real-time updates — Socket.IO for live sync
- Task comments — new comments table with threading
- Activity logs — track all task changes

**Long-term (2–3 weeks)**

- Team workspaces — organizations, roles, permissions
- Analytics dashboard — task completion metrics
- Mobile app — React Native wrapper
- CI/CD pipeline — GitHub Actions for automated testing

---

## AI Usage

### AI-Generated Components

- Initial CRUD boilerplate (Flask routes and React components)
- Validation schemas (Pydantic models with custom validators)
- Test cases (Pytest fixtures and edge cases)
- CSS styling (responsive design patterns)

### Prompting Strategy

```
Used Claude with specific constraints:
- "Generate type-safe Python code with Pydantic validation"
- "Create React functional components with hooks only"
- "Include error handling for all API calls"
- "Follow REST conventions with proper HTTP status codes"
```

### Human Review Process

All AI-generated code was:

- ✅ Manually reviewed for security vulnerabilities
- ✅ Tested with edge cases (empty strings, null values, XSS attempts)
- ✅ Refactored for readability and maintainability
- ✅ Validated against business requirements

See [`AI_GUIDANCE.md`](./AI_GUIDANCE.md) for complete prompting rules and coding standards.

---

## Project Structure

```
taskflow/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic validation schemas
│   ├── requirements.txt    # Python dependencies
│   └── tests/              # Pytest test suite
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js          # Main React app
│   │   └── App.css         # Styling
│   └── package.json        # Node dependencies
├── AI_GUIDANCE.md          # AI agent instructions
└── README.md               # This file
```

---

## Troubleshooting

**Port 5000 already in use (Windows)**

```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Database locked error**

```bash
rm tasks.db
python app.py
```

**CORS errors in browser**

```bash
pip install flask-cors
# Verify backend initializes with: CORS(app)
```

---

## License

Educational use only, for assessment purposes.