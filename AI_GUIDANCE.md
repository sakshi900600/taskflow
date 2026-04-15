# AI Development Guidelines — TaskFlow

## Core Principles

### 1. Type Safety First

- Always use Pydantic for request/response validation
- Never trust raw JSON input
- Always validate database queries with SQLAlchemy

```python
# ✅ Good — validate all inputs
try:
    validated = TaskSchema(**data)
except ValidationError as e:
    return jsonify({'errors': e.errors()}), 400

# ❌ Bad — direct usage
task = Task(title=data['title'])  # Could crash
```

### 2. Stateless Architecture

- Use JWT for authentication
- No server-side sessions
- All state in client or database

### 3. Fail Fast & Loud

```python
# ✅ Good — clear error messages
if not user:
    return jsonify({'error': 'User not found'}), 404

# ❌ Bad — silent failure
if not user:
    return jsonify({}), 200
```

---

## Coding Standards

### Backend (Python / Flask)

**Naming conventions**

| Type | Convention | Example |
|------|------------|---------|
| Routes | `snake_case` | `/api/user_tasks` |
| Functions | `snake_case` | `def get_user_tasks():` |
| Classes | `PascalCase` | `class TaskSchema:` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_TITLE_LENGTH = 200` |

**Route structure template**

```python
@app.route('/api/resource/<int:id>', methods=['METHOD'])
@jwt_required()
def resource_handler(id):
    try:
        user_id = int(get_jwt_identity())          # 1. Authentication

        resource = Resource.query.filter_by(       # 2. Authorization
            id=id, user_id=user_id).first()
        if not resource:
            return jsonify({'error': 'Not found'}), 404

        validated = ResourceSchema(**request.get_json())  # 3. Validation

        # 4. Business logic
        # 5. Response
        return jsonify(resource.to_dict()), 200
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': 'Internal error'}), 500
```

**Database rules**

- Always use parameterized queries (SQLAlchemy handles this automatically)
- Add `cascade='all, delete-orphan'` for relationships
- Index frequently queried columns: `user_id`, `status`, `due_date`

### Frontend (React)

**Component template**

```javascript
// ✅ Good — functional component with hooks
function TaskCard({ task, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Side effects here
  }, [task]);

  return (
    <div className="task-card">
      {/* JSX here */}
    </div>
  );
}

// ❌ Bad — class components (avoid)
class TaskCard extends React.Component { ... }
```

**State management rules**

- Use `useState` for local state
- Use `useContext` for shared state (auth, theme)
- Avoid Redux unless state is genuinely complex
- Store JWT in `localStorage` only

**Error handling pattern**

```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await api.get('/tasks');
    setData(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      // Redirect to login
    } else {
      setError(error.response?.data?.error || 'Unknown error');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## Security Rules

**Password handling**

```python
# ✅ Always hash passwords
user.set_password(plain_password)  # Uses bcrypt internally

# ❌ Never store plain text
user.password = plain_password
```

**JWT configuration**

```python
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_TYPE'] = 'Bearer'
```

**Input sanitization**

```python
# ✅ Use Pydantic validators
@validator('title')
def sanitize_title(cls, v):
    return v.strip()

# ❌ Never eval() user input
result = eval(user_input)  # NEVER DO THIS
```

---

## Testing Requirements

**Minimum test coverage**

- User registration (valid/invalid emails)
- Login (correct/wrong passwords)
- Create task (with/without required fields)
- Update task (partial updates)
- Delete task (ownership check)
- Search/filter (empty results)
- Unauthorized access (missing/invalid token)

**Test example**

```python
def test_create_task_missing_title(client, auth_token):
    response = client.post('/api/tasks',
        headers={'Authorization': f'Bearer {auth_token}'},
        json={'description': 'No title'})
    assert response.status_code == 400
    assert 'title' in str(response.data)
```

---

---

## AI-Specific Constraints

**What AI CAN generate**

- CRUD boilerplate code
- Validation schemas
- Basic test cases
- Component skeletons
- CSS styling

**What AI MUST NOT generate**

- Hardcoded secrets or passwords
- Raw SQL queries (use ORM)
- `eval()` or `exec()` usage
- Disabled security features
- Code not reviewed by a human

**Review checklist before committing AI code**

- [ ] No hardcoded credentials
- [ ] All inputs validated
- [ ] Error messages don't expose internals
- [ ] Database queries use parameters
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens validated on protected routes

---

## Prompting Template

When requesting AI assistance:

```
Task: [Description of what to build]

Constraints:
- Use Flask for backend with JWT auth
- Use React functional components
- Validate all inputs with Pydantic
- Include error handling
- Add comments for complex logic
- Follow REST conventions

Example input: [Sample request]
Example output: [Expected response]
```

---

## Environment Variables

**Development (`.env`)**

```env
DATABASE_URL=sqlite:///tasks.db
JWT_SECRET_KEY=generate-random-secret-here
```

**Production**

```env
DATABASE_URL=postgresql://user:pass@localhost/taskflow
JWT_SECRET_KEY=<64-character-random-string>
FLASK_ENV=production
```

---

## Performance Guidelines

**Database**

- Use `selectinload()` for eager loading
- Add indexes: `db.Index('idx_user_status', user_id, status)`
- Limit queries: `Task.query.limit(100).all()`

**API**

- Add pagination: `?page=1&per_page=20`
- Cache frequent queries (Redis)
- Compress responses with gzip

**Frontend**

- Debounce search inputs (300ms)
- Lazy load routes with `React.lazy()`
- Memoize expensive computations with `useMemo`

---

## Deployment Checklist

- [ ] Change JWT secret key
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Add rate limiting
- [ ] Configure logging
- [ ] Run migrations safely
- [ ] Set up monitoring (Sentry, New Relic)

---

_Version: 1.0 · Last updated: 2026-04-14_