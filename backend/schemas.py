from pydantic import BaseModel, ValidationError, field_validator, validator
from datetime import datetime
from typing import Optional

class TaskSchema(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = 'todo'
    priority: Optional[str] = 'medium'
    due_date: Optional[datetime] = None

    @field_validator('title')
    def title_not_empty(cls, v):
        if not v or not str(v).strip():
            raise ValueError('Title cannot be empty')
        return str(v).strip()

    @field_validator('status')
    def valid_status(cls, v):
        allowed = ['todo', 'in_progress', 'done']
        if v not in allowed:
            raise ValueError(f'Status must be one of {allowed}')
        return v

    @field_validator('priority')
    def valid_priority(cls, v):
        allowed = ['low', 'medium', 'high']
        if v not in allowed:
            raise ValueError(f'Priority must be one of {allowed}')
        return v

    @field_validator('due_date', mode='before')
    def parse_due_date(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, datetime):
            return v
        try:
            return datetime.fromisoformat(str(v))
        except ValueError:
            raise ValueError('due_date must be a valid ISO 8601 datetime string')

class UserSchema(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    
    @validator('email')
    def valid_email(cls, v):
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('password')
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v