import React from 'react';
import { format } from 'date-fns';

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const getStatusLabel = (status) => {
    const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' };
    return labels[priority] || priority;
  };

  return (
    <div className={`task-card priority-${task.priority}`}>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      
      <div className="task-status status-todo" style={{background: 
        task.status === 'todo' ? '#e2e8f0' : task.status === 'in_progress' ? '#fef3c7' : '#d1fae5'
      }}>
        {getStatusLabel(task.status)}
      </div>
      
      <div><strong>Priority:</strong> {getPriorityLabel(task.priority)}</div>
      
      {task.due_date && (
        <div><strong>Due:</strong> {format(new Date(task.due_date), 'MMM dd, yyyy')}</div>
      )}
      
      <div><strong>Created:</strong> {format(new Date(task.created_at), 'MMM dd, yyyy')}</div>
      
      <div className="task-actions">
        <select 
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{padding: '6px', borderRadius: '4px', border: '1px solid #ddd'}}
        >
          <option value="todo">📋 To Do</option>
          <option value="in_progress">⚙️ In Progress</option>
          <option value="done">✅ Done</option>
        </select>
        <button className="edit-btn" onClick={onEdit}>✏️ Edit</button>
        <button className="delete-btn" onClick={onDelete}>🗑️ Delete</button>
      </div>
    </div>
  );
}

export default TaskCard;