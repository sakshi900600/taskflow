import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskModal from './TaskModal';
import TaskCard from './TaskCard';

const API_URL = 'http://localhost:5000/api';

function TaskList({ token, user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.search) params.append('q', filter.search);
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);
      
      const response = await axios.get(`${API_URL}/tasks/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error searching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes - automatically search when filters change
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFilter({ ...filter, status: newStatus });
    // Trigger search immediately with new filter
    performSearch({ ...filter, status: newStatus });
  };

  const handlePriorityChange = (e) => {
    const newPriority = e.target.value;
    setFilter({ ...filter, priority: newPriority });
    // Trigger search immediately with new filter
    performSearch({ ...filter, priority: newPriority });
  };

  const handleSearchChange = (e) => {
    const newSearch = e.target.value;
    setFilter({ ...filter, search: newSearch });
  };

  const performSearch = async (currentFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilter.search) params.append('q', currentFilter.search);
      if (currentFilter.status) params.append('status', currentFilter.status);
      if (currentFilter.priority) params.append('priority', currentFilter.priority);
      
      const response = await axios.get(`${API_URL}/tasks/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error searching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchTasks();
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await axios.post(`${API_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks([response.data, ...tasks]);
      setShowModal(false);
    } catch (error) {
      alert(error.response?.data?.errors?.[0]?.msg || 'Error creating task');
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      const response = await axios.put(`${API_URL}/tasks/${id}`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.map(task => task.id === id ? response.data : task));
      setEditingTask(null);
    } catch (error) {
      alert(error.response?.data?.errors?.[0]?.msg || 'Error updating task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_URL}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(tasks.filter(task => task.id !== id));
      } catch (error) {
        alert('Error deleting task');
      }
    }
  };

  const resetFilters = () => {
    const emptyFilter = { status: '', priority: '', search: '' };
    setFilter(emptyFilter);
    fetchTasks(); // Get all tasks
  };

  return (
    <div>
      <div className="header">
        <h1>📝 TaskFlow Manager</h1>
        <div>
          <span style={{marginRight: '15px'}}>Welcome, {user?.name || user?.email}!</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filter.search}
          onChange={handleSearchChange}
          onKeyPress={handleSearchKeyPress}
        />
        <select value={filter.status} onChange={handleStatusChange}>
          <option value="">All Status</option>
          <option value="todo">📋 To Do</option>
          <option value="in_progress">⚙️ In Progress</option>
          <option value="done">✅ Done</option>
        </select>
        <select value={filter.priority} onChange={handlePriorityChange}>
          <option value="">All Priority</option>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <button onClick={searchTasks}>🔍 Search</button>
        <button onClick={resetFilters}>🔄 Reset</button>
        <button onClick={() => setShowModal(true)}>➕ New Task</button>
      </div>

      {/* Show active filters */}
      {(filter.status || filter.priority || filter.search) && (
        <div style={{marginBottom: '15px', color: 'white', fontSize: '14px'}}>
          Active filters: 
          {filter.status && <span style={{background: '#4a5568', padding: '2px 8px', borderRadius: '4px', marginLeft: '5px'}}>Status: {filter.status}</span>}
          {filter.priority && <span style={{background: '#4a5568', padding: '2px 8px', borderRadius: '4px', marginLeft: '5px'}}>Priority: {filter.priority}</span>}
          {filter.search && <span style={{background: '#4a5568', padding: '2px 8px', borderRadius: '4px', marginLeft: '5px'}}>Search: {filter.search}</span>}
        </div>
      )}

      {loading && <div style={{textAlign: 'center', padding: '50px', color: 'white'}}>Loading...</div>}

      {!loading && (
        <div className="tasks-grid">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onStatusChange={(status) => handleUpdateTask(task.id, { ...task, status })}
            />
          ))}
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div style={{textAlign: 'center', padding: '50px', color: 'white'}}>
          No tasks found. {filter.status || filter.priority || filter.search ? 'Try different filters!' : 'Click "New Task" to get started!'}
        </div>
      )}

      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(data) => handleUpdateTask(editingTask.id, data)}
        />
      )}
    </div>
  );
}

export default TaskList;