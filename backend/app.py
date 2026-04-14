from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, User, Task
from schemas import TaskSchema, UserSchema
from pydantic import ValidationError
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///tasks.db')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

db.init_app(app)
jwt = JWTManager(app)

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    return jsonify({'error': 'Invalid token', 'message': reason}), 401

@jwt.unauthorized_loader
def missing_token_callback(reason):
    return jsonify({'error': 'Missing authorization token', 'message': reason}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    try:
        validated_data = UserSchema(**data)
    except ValidationError as e:
        return jsonify({'errors': e.errors()}), 400
    
    # Check if user exists
    if User.query.filter_by(email=validated_data.email).first():
        return jsonify({'error': 'User already exists'}), 400
    
    user = User(
        email=validated_data.email,
        name=validated_data.name or ''
    )
    user.set_password(validated_data.password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not user.check_password(data.get('password')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Convert id to string for JWT
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'token': access_token, 'user': user.to_dict()}), 200

@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    # Convert back to int
    user_id = int(get_jwt_identity())
    tasks = Task.query.filter_by(user_id=user_id).order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200

# ADD THIS MISSING ENDPOINT - GET TASK BY ID
@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task_by_id(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=user_id).first_or_404()
    return jsonify(task.to_dict()), 200

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    # Convert back to int
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate input
    try:
        validated_data = TaskSchema(**data)
    except ValidationError as e:
        return jsonify({'errors': e.errors()}), 400
    
    task = Task(
        title=validated_data.title,
        description=validated_data.description or '',
        status=validated_data.status,
        priority=validated_data.priority,
        due_date=validated_data.due_date,
        user_id=user_id
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(task.to_dict()), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=user_id).first_or_404()
    
    data = request.get_json() or {}
    task_data = {
        'title': data.get('title', task.title),
        'description': data.get('description', task.description),
        'status': data.get('status', task.status),
        'priority': data.get('priority', task.priority),
        'due_date': data.get('due_date', task.due_date.isoformat() if task.due_date else None)
    }

    try:
        validated_data = TaskSchema(**task_data)
    except ValidationError as e:
        return jsonify({'errors': e.errors()}), 400

    task.title = validated_data.title
    task.description = validated_data.description or ''
    task.status = validated_data.status
    task.priority = validated_data.priority
    task.due_date = validated_data.due_date
    
    db.session.commit()
    return jsonify(task.to_dict()), 200

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=user_id).first_or_404()
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted'}), 200

@app.route('/api/tasks/search', methods=['GET'])
@jwt_required()
def search_tasks():
    user_id = int(get_jwt_identity())
    query = request.args.get('q', '')
    status = request.args.get('status', '')
    priority = request.args.get('priority', '')
    
    tasks_query = Task.query.filter_by(user_id=user_id)
    
    if query:
        tasks_query = tasks_query.filter(Task.title.ilike(f'%{query}%'))
    if status:
        tasks_query = tasks_query.filter_by(status=status)
    if priority:
        tasks_query = tasks_query.filter_by(priority=priority)
    
    tasks = tasks_query.all()
    return jsonify([task.to_dict() for task in tasks]), 200



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)


