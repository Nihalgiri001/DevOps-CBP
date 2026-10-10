# Design Document: CommunityLink DevOps Laboratory Project

## Overview

CommunityLink is a full-stack community management platform designed as a comprehensive B.Tech DevOps laboratory project. The system demonstrates end-to-end DevOps practices including containerization, orchestration, CI/CD pipelines, API testing, and monitoring.

### System Purpose

The platform enables residential communities to:
- Manage user authentication and authorization with role-based access control (Resident/Administrator)
- Publish and manage community announcements
- Create and manage community events
- Monitor system health and operational status

### Technical Approach

The system follows a three-tier architecture:
- **Presentation Tier**: React.js single-page application with responsive UI
- **Application Tier**: Node.js Express REST API with JWT-based authentication
- **Data Tier**: MongoDB NoSQL database

The entire system is containerized using Docker, orchestrated with Kubernetes, and deployed through automated CI/CD pipelines, demonstrating practical DevOps workflows suitable for academic laboratory evaluation.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Container                          │
│                 (React.js SPA)                               │
│  - Port 3000                                                 │
│  - Nginx production server                                   │
│  - Static asset serving                                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Container                           │
│              (Node.js + Express)                             │
│  - Port 5000                                                 │
│  - JWT authentication middleware                             │
│  - Role-based authorization                                  │
│  - Centralized error handling                                │
│  - Request logging                                           │
└────────────────────────┬────────────────────────────────────┘
                         │ MongoDB Protocol
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Container                          │
│                   (MongoDB)                                  │
│  - Port 27017                                                │
│  - Collections: users, announcements, events                 │
│  - Persistent volume storage                                 │
└─────────────────────────────────────────────────────────────┘
```

### Component Interactions

1. **User → Frontend**: Browser loads React SPA, client-side routing handles navigation
2. **Frontend → Backend**: Axios HTTP client makes REST API calls with JWT tokens in Authorization headers
3. **Backend → Database**: Mongoose ODM manages MongoDB connections and schema validation
4. **Backend → Frontend**: JSON responses with standardized format for data and errors

### Deployment Architecture

**Docker Compose (Local Development)**:
- Three containers networked via Docker bridge network
- Environment variables injected from .env file
- Volume mounts for MongoDB data persistence

**Kubernetes (Production)**:
- Namespace: `communitylink`
- Deployments: frontend, backend, mongodb (with replicas configurable)
- Services: ClusterIP for internal communication, NodePort/LoadBalancer for external access
- ConfigMaps: Non-sensitive configuration (API URLs, ports)
- Secrets: Sensitive configuration (JWT secret, DB credentials)
- Probes: Liveness and readiness checks for all services

### Network Flow

```
External Traffic → LoadBalancer Service → Frontend Pods → Frontend Containers (port 3000)
                                                ↓
                                         Backend Service → Backend Pods → Backend Containers (port 5000)
                                                ↓
                                         MongoDB Service → MongoDB Pods → MongoDB Containers (port 27017)
```

## API Design

### Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `http://<k8s-service-ip>:5000/api` or configured domain

### Response Format Standards

**Success Response**:
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation completed successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message",
  "statusCode": 400
}
```

### Authentication Endpoints

#### POST /api/auth/register
**Purpose**: Create a new user account

**Request Body**:
```json
{
  "username": "string (required, 3-50 chars)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 6 chars)"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "userId": "64abc123...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "Resident"
  },
  "message": "User registered successfully"
}
```

**Error Responses**:
- 400: Invalid input (missing fields, invalid email, weak password)
- 409: Email already registered
- 500: Server error

**Authentication**: None (public endpoint)

---

#### POST /api/auth/login
**Purpose**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64abc123...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "Resident"
    }
  },
  "message": "Login successful"
}
```

**Error Responses**:
- 400: Missing email or password
- 401: Invalid credentials
- 500: Server error

**Authentication**: None (public endpoint)

**Token Details**:
- Algorithm: HS256
- Expiration: 24 hours
- Payload: `{ userId, email, role }`

### Announcements Endpoints

#### POST /api/announcements
**Purpose**: Create a new announcement (Administrator only)

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "title": "string (required, max 200 chars)",
  "content": "string (required, max 5000 chars)",
  "author": "string (required)"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "64def456...",
    "title": "Community Pool Maintenance",
    "content": "The pool will be closed for maintenance...",
    "author": "Admin Team",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Announcement created successfully"
}
```

**Error Responses**:
- 400: Invalid input
- 401: Missing or invalid token
- 403: User is not an Administrator
- 500: Server error

---

#### GET /api/announcements
**Purpose**: Retrieve all announcements (ordered by creation date, newest first)

**Request Headers**:
- `Authorization: Bearer <jwt_token>` (optional for public read access)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "64def456...",
      "title": "Community Pool Maintenance",
      "content": "The pool will be closed...",
      "author": "Admin Team",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "_id": "64def457...",
      "title": "Monthly Newsletter",
      "content": "Check out this month's updates...",
      "author": "Admin Team",
      "createdAt": "2025-01-10T09:00:00.000Z"
    }
  ],
  "message": "Announcements retrieved successfully"
}
```

**Error Responses**:
- 500: Server error

---

#### GET /api/announcements/:id
**Purpose**: Retrieve a single announcement by ID

**URL Parameters**:
- `id`: MongoDB ObjectId

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "64def456...",
    "title": "Community Pool Maintenance",
    "content": "The pool will be closed for maintenance...",
    "author": "Admin Team",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Announcement retrieved successfully"
}
```

**Error Responses**:
- 400: Invalid ID format
- 404: Announcement not found
- 500: Server error

---

#### PUT /api/announcements/:id
**Purpose**: Update an existing announcement (Administrator only)

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**URL Parameters**:
- `id`: MongoDB ObjectId

**Request Body** (all fields optional):
```json
{
  "title": "string (max 200 chars)",
  "content": "string (max 5000 chars)",
  "author": "string"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "64def456...",
    "title": "Updated Title",
    "content": "Updated content...",
    "author": "Admin Team",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Announcement updated successfully"
}
```

**Error Responses**:
- 400: Invalid input or ID format
- 401: Missing or invalid token
- 403: User is not an Administrator
- 404: Announcement not found
- 500: Server error

---

#### DELETE /api/announcements/:id
**Purpose**: Delete an announcement (Administrator only)

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**URL Parameters**:
- `id`: MongoDB ObjectId

**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Announcement deleted successfully"
}
```

**Error Responses**:
- 400: Invalid ID format
- 401: Missing or invalid token
- 403: User is not an Administrator
- 404: Announcement not found
- 500: Server error

### Events Endpoints

#### POST /api/events
**Purpose**: Create a new event (Administrator only)

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (required, max 5000 chars)",
  "date": "string (required, ISO 8601 format)",
  "time": "string (required, HH:MM format)",
  "location": "string (required, max 300 chars)"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "64ghi789...",
    "title": "Annual Community BBQ",
    "description": "Join us for our annual summer BBQ...",
    "date": "2025-07-15",
    "time": "18:00",
    "location": "Community Garden",
    "createdAt": "2025-01-15T11:00:00.000Z"
  },
  "message": "Event created successfully"
}
```

**Error Responses**:
- 400: Invalid input (missing fields, invalid date/time format)
- 401: Missing or invalid token
- 403: User is not an Administrator
- 500: Server error

---

#### GET /api/events
**Purpose**: Retrieve all events (ordered by date, earliest first)

**Request Headers**:
- `Authorization: Bearer <jwt_token>` (optional for public read access)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "64ghi789...",
      "title": "Annual Community BBQ",
      "description": "Join us for our annual summer BBQ...",
      "date": "2025-07-15",
      "time": "18:00",
      "location": "Community Garden",
      "createdAt": "2025-01-15T11:00:00.000Z"
    },
    {
      "_id": "64ghi790...",
      "title": "Yoga in the Park",
      "description": "Free yoga session for all residents...",
      "date": "2025-07-20",
      "time": "07:00",
      "location": "Central Park",
      "createdAt": "2025-01-14T09:30:00.000Z"
    }
  ],
  "message": "Events retrieved successfully"
}
```

**Error Responses**:
- 500: Server error

---

#### GET /api/events/:id
**Purpose**: Retrieve a single event by ID

**URL Parameters**:
- `id`: MongoDB ObjectId

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "64ghi789...",
    "title": "Annual Community BBQ",
    "description": "Join us for our annual summer BBQ...",
    "date": "2025-07-15",
    "time": "18:00",
    "location": "Community Garden",
    "createdAt": "2025-01-15T11:00:00.000Z"
  },
  "message": "Event retrieved successfully"
}
```

**Error Responses**:
- 400: Invalid ID format
- 404: Event not found
- 500: Server error

---

#### PUT /api/events/:id
**Purpose**: Update an existing event (Administrator only)

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**URL Parameters**:
- `id`: MongoDB ObjectId

**Request Body** (all fields optional):
```json
{
  "title": "string (max 200 chars)",
  "description": "string (max 5000 chars)",
  "date": "string (ISO 8601 format)",
  "time": "string (HH:MM format)",
  "location": "string (max 300 chars)"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "64ghi789...",
    "title": "Updated Event Title",
    "description": "Updated description...",
    "date": "2025-07-15",
    "time": "19:00",
    "location": "Updated Location",
    "createdAt": "2025-01-15T11:00:00.000Z"
  },
  "message": "Event updated successfully"
}
```

**Error Responses**:
- 400: Invalid input or ID format
- 401: Missing or invalid token
- 403: User is not an Administrator
- 404: Event not found
- 500: Server error

---

#### DELETE /api/events/:id
**Purpose**: Delete an event (Administrator only)

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**URL Parameters**:
- `id`: MongoDB ObjectId

**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Event deleted successfully"
}
```

**Error Responses**:
- 400: Invalid ID format
- 401: Missing or invalid token
- 403: User is not an Administrator
- 404: Event not found
- 500: Server error

### Health Check Endpoint

#### GET /health
**Purpose**: Monitor system health and operational status

**Success Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "environment": "production"
}
```

**Error Responses**:
- 500: Service unhealthy (database disconnected, critical error)

**Authentication**: None (public endpoint for monitoring)

### API Middleware Chain

For protected endpoints, the request flows through:

1. **Request Logger**: Logs method, path, timestamp
2. **JSON Body Parser**: Parses incoming JSON payloads
3. **Authentication Middleware**: Validates JWT token, extracts user info
4. **Authorization Middleware**: Validates user role (for admin endpoints)
5. **Route Handler**: Executes business logic
6. **Error Handler**: Catches and formats errors

## Data Models

### Users Collection

**Collection Name**: `users`

**Schema**:
```javascript
{
  _id: ObjectId,              // Auto-generated by MongoDB
  username: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 50,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [emailValidator, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minLength: 60              // bcrypt hash length
  },
  role: {
    type: String,
    enum: ['Resident', 'Administrator'],
    default: 'Resident'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `email`: Unique index for fast lookups and uniqueness constraint
- `role`: Index for role-based queries

**Security**:
- Passwords are hashed using bcrypt (salt rounds: 10) before storage
- Password field is excluded from query results using `.select('-password')`

**Mongoose Model Methods**:
- `comparePassword(candidatePassword)`: Compares plaintext password with hashed password using bcrypt
- Pre-save hook updates `updatedAt` timestamp on modifications

---

### Announcements Collection

**Collection Name**: `announcements`

**Schema**:
```javascript
{
  _id: ObjectId,              // Auto-generated by MongoDB
  title: {
    type: String,
    required: true,
    maxLength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxLength: 5000
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: -1                  // Descending index for sorting newest first
  }
}
```

**Indexes**:
- `createdAt`: Descending index (-1) for efficient retrieval sorted by date

**Default Sort**:
- All list queries return announcements sorted by `createdAt` descending (newest first)

---

### Events Collection

**Collection Name**: `events`

**Schema**:
```javascript
{
  _id: ObjectId,              // Auto-generated by MongoDB
  title: {
    type: String,
    required: true,
    maxLength: 200,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 5000
  },
  date: {
    type: String,             // ISO 8601 date string (YYYY-MM-DD)
    required: true,
    index: 1                  // Ascending index for sorting by date
  },
  time: {
    type: String,             // HH:MM format (24-hour)
    required: true,
    validate: [timeValidator, 'Invalid time format (expected HH:MM)']
  },
  location: {
    type: String,
    required: true,
    maxLength: 300,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `date`: Ascending index (1) for efficient retrieval sorted by event date

**Default Sort**:
- All list queries return events sorted by `date` ascending (earliest first)

**Validation**:
- `date`: Must be valid ISO 8601 date format
- `time`: Must match HH:MM format using regex validation

---

### Database Connection Configuration

**Connection String Format**:
```
mongodb://<host>:<port>/<database_name>
```

**Environment-Specific Hosts**:
- **Local Development**: `localhost:27017`
- **Docker Compose**: `mongodb:27017` (container hostname)
- **Kubernetes**: `mongodb-service:27017` (service DNS name)

**Connection Options**:
```javascript
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,              // Automatically create indexes in development
  maxPoolSize: 10,              // Connection pool size
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}
```

**Connection Error Handling**:
- Retry logic with exponential backoff (3 attempts)
- Graceful shutdown on persistent connection failure
- Connection state monitoring and logging

## Components and Interfaces

### Backend Components

#### 1. Server Entry Point (`server.js`)

**Responsibilities**:
- Initialize Express application
- Load environment variables
- Connect to MongoDB
- Configure middleware chain
- Register routes
- Start HTTP server
- Handle graceful shutdown

**Dependencies**:
- `express`: Web framework
- `dotenv`: Environment variable loader
- `mongoose`: MongoDB ODM
- `cors`: Cross-origin resource sharing
- Middleware modules (auth, error handling, logging)

**Configuration**:
```javascript
PORT=5000 (from env)
MONGODB_URI=mongodb://mongodb:27017/communitylink (from env)
JWT_SECRET=<secret_key> (from env)
NODE_ENV=development|production (from env)
```

---

#### 2. Routes Layer (`routes/`)

**Purpose**: Define API endpoints and map to controllers

**Files**:
- `authRoutes.js`: `/api/auth/*` endpoints (register, login)
- `announcementRoutes.js`: `/api/announcements/*` endpoints (CRUD operations)
- `eventRoutes.js`: `/api/events/*` endpoints (CRUD operations)
- `healthRoutes.js`: `/health` endpoint

**Pattern**:
```javascript
router.post('/register', validationMiddleware, authController.register);
router.post('/login', validationMiddleware, authController.login);

router.post('/announcements', authenticate, authorizeAdmin, announcementController.create);
router.get('/announcements', announcementController.getAll);
router.get('/announcements/:id', announcementController.getById);
router.put('/announcements/:id', authenticate, authorizeAdmin, announcementController.update);
router.delete('/announcements/:id', authenticate, authorizeAdmin, announcementController.delete);
```

---

#### 3. Controllers Layer (`controllers/`)

**Purpose**: Handle business logic and orchestrate model operations

**Files**:
- `authController.js`: User registration, login, token generation
- `announcementController.js`: Announcement CRUD operations
- `eventController.js`: Event CRUD operations
- `healthController.js`: System health status

**Controller Function Pattern**:
```javascript
async create(req, res, next) {
  try {
    // 1. Extract and validate request data
    const { title, content, author } = req.body;
    
    // 2. Perform business logic
    const announcement = new Announcement({ title, content, author });
    await announcement.save();
    
    // 3. Format and send response
    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    });
  } catch (error) {
    // 4. Pass errors to error handler middleware
    next(error);
  }
}
```

**Error Propagation**:
- Controllers catch errors and pass to centralized error handler via `next(error)`
- No direct error response formatting in controllers

---

#### 4. Models Layer (`models/`)

**Purpose**: Define database schemas and model methods

**Files**:
- `User.js`: User schema with password hashing and comparison
- `Announcement.js`: Announcement schema with validation
- `Event.js`: Event schema with date/time validation

**Model Example** (`User.js`):
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minLength: 3, maxLength: 50 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Resident', 'Administrator'], default: 'Resident' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook: hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method: compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

#### 5. Middleware Layer (`middleware/`)

**Files**:
- `authMiddleware.js`: JWT token validation and user extraction
- `roleMiddleware.js`: Role-based authorization (Administrator check)
- `validationMiddleware.js`: Request body validation
- `errorMiddleware.js`: Centralized error handling
- `loggerMiddleware.js`: Request/response logging

**Authentication Middleware**:
```javascript
function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}
```

**Authorization Middleware** (Administrator only):
```javascript
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'Administrator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Forbidden: Administrator access required' 
    });
  }
  next();
}
```

**Error Handling Middleware**:
```javascript
function errorHandler(err, req, res, next) {
  // Log error details (without sensitive info)
  console.error(`[ERROR] ${err.message}`);
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Send formatted error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    message: statusCode === 500 ? 'Something went wrong' : err.message,
    statusCode
  });
}
```

**Request Logger Middleware**:
```javascript
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
}
```

---

#### 6. Configuration (`config/`)

**Files**:
- `database.js`: MongoDB connection logic with retry mechanism
- `jwtConfig.js`: JWT token generation and validation utilities

**Database Connection Module**:
```javascript
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1); // Exit on connection failure
  }
}
```

**JWT Utilities**:
```javascript
function generateToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}
```

---

### Frontend Components

#### 1. Application Entry Point (`App.jsx`)

**Responsibilities**:
- Configure React Router
- Define route structure
- Implement protected route wrapper
- Provide authentication context

**Route Structure**:
```
/ (Public)
├── /register (Public)
├── /login (Public)
└── /dashboard (Protected)
    ├── /announcements (Protected)
    ├── /events (Protected)
    └── /admin (Protected - Administrator only)
```

---

#### 2. Pages (`pages/`)

**Files**:
- `RegisterPage.jsx`: User registration form
- `LoginPage.jsx`: User login form
- `DashboardPage.jsx`: Main dashboard with announcements and events list
- `AnnouncementsPage.jsx`: Full announcements view with admin controls
- `EventsPage.jsx`: Full events view with admin controls
- `AdminPage.jsx`: Administrative interface for creating/managing content

**Page Component Pattern**:
```jsx
function DashboardPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  async function fetchData() {
    try {
      setLoading(true);
      const announcementsData = await apiService.getAnnouncements();
      const eventsData = await apiService.getEvents();
      setAnnouncements(announcementsData);
      setEvents(eventsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      <AnnouncementsList announcements={announcements} />
      <EventsList events={events} />
    </div>
  );
}
```

---

#### 3. Components (`components/`)

**Reusable UI Components**:
- `Navbar.jsx`: Navigation bar with role-based menu items
- `AnnouncementCard.jsx`: Display single announcement
- `EventCard.jsx`: Display single event
- `AnnouncementForm.jsx`: Form for creating/editing announcements (admin)
- `EventForm.jsx`: Form for creating/editing events (admin)
- `LoadingSpinner.jsx`: Loading indicator
- `ErrorMessage.jsx`: Error display component
- `ProtectedRoute.jsx`: Route wrapper requiring authentication

**Component Props Pattern**:
```jsx
function AnnouncementCard({ announcement, onEdit, onDelete, isAdmin }) {
  return (
    <div className="announcement-card">
      <h3>{announcement.title}</h3>
      <p>{announcement.content}</p>
      <small>By {announcement.author} on {formatDate(announcement.createdAt)}</small>
      
      {isAdmin && (
        <div className="admin-actions">
          <button onClick={() => onEdit(announcement._id)}>Edit</button>
          <button onClick={() => onDelete(announcement._id)}>Delete</button>
        </div>
      )}
    </div>
  );
}
```

---

#### 4. Services (`services/`)

**Files**:
- `apiService.js`: Centralized API communication layer
- `authService.js`: Authentication operations (login, register, token management)
- `storageService.js`: Local storage operations for token persistence

**API Service Module**:
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach auth token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    throw error.response?.data || error;
  }
);

// API methods
export const apiService = {
  // Announcements
  getAnnouncements: () => apiClient.get('/announcements'),
  getAnnouncement: (id) => apiClient.get(`/announcements/${id}`),
  createAnnouncement: (data) => apiClient.post('/announcements', data),
  updateAnnouncement: (id, data) => apiClient.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => apiClient.delete(`/announcements/${id}`),
  
  // Events
  getEvents: () => apiClient.get('/events'),
  getEvent: (id) => apiClient.get(`/events/${id}`),
  createEvent: (data) => apiClient.post('/events', data),
  updateEvent: (id, data) => apiClient.put(`/events/${id}`, data),
  deleteEvent: (id) => apiClient.delete(`/events/${id}`),
  
  // Health
  getHealth: () => apiClient.get('/health')
};
```

**Authentication Service**:
```javascript
export const authService = {
  async register(username, email, password) {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  },
  
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    // Store token in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },
  
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
  
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'Administrator';
  }
};
```

---

#### 5. Context/State Management

**Authentication Context** (`contexts/AuthContext.jsx`):
```jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  
  const login = async (email, password) => {
    const { token, user } = await authService.login(email, password);
    setUser(user);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

### Docker Architecture

#### 1. Frontend Dockerfile

**Location**: `frontend/Dockerfile`

**Strategy**: Multi-stage build for production optimization

```dockerfile
# Stage 1: Build React app
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

**Optimization**:
- Multi-stage build reduces final image size
- npm ci for faster, reproducible installs
- Alpine base images for minimal footprint

---

#### 2. Backend Dockerfile

**Location**: `backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

---

#### 3. Docker Compose Configuration

**Location**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - backend
    networks:
      - communitylink-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongodb:27017/communitylink
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb
    networks:
      - communitylink-network

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    networks:
      - communitylink-network

networks:
  communitylink-network:
    driver: bridge

volumes:
  mongodb-data:
```

**Key Features**:
- Service dependencies ensure startup order
- Bridge network enables container-to-container communication
- Named volume for MongoDB data persistence
- Environment variable injection for configuration

---

### Kubernetes Architecture

#### 1. Namespace

**File**: `k8s/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: communitylink
```

---

#### 2. ConfigMap

**File**: `k8s/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: communitylink-config
  namespace: communitylink
data:
  MONGODB_HOST: "mongodb-service"
  MONGODB_PORT: "27017"
  MONGODB_DATABASE: "communitylink"
  BACKEND_PORT: "5000"
  FRONTEND_PORT: "3000"
  NODE_ENV: "production"
```

---

#### 3. Secret

**File**: `k8s/secret.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: communitylink-secret
  namespace: communitylink
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  # Example: echo -n 'your-secret-key' | base64
```

---

#### 4. MongoDB Deployment

**File**: `k8s/mongodb-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: communitylink
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:6
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
        livenessProbe:
          exec:
            command:
            - mongo
            - --eval
            - "db.adminCommand('ping')"
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: mongodb-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: communitylink
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  type: ClusterIP
```

---

#### 5. Backend Deployment

**File**: `k8s/backend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: communitylink
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: communitylink-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: communitylink-config
              key: BACKEND_PORT
        - name: MONGODB_URI
          value: "mongodb://$(MONGODB_HOST):$(MONGODB_PORT)/$(MONGODB_DATABASE)"
        - name: MONGODB_HOST
          valueFrom:
            configMapKeyRef:
              name: communitylink-config
              key: MONGODB_HOST
        - name: MONGODB_PORT
          valueFrom:
            configMapKeyRef:
              name: communitylink-config
              key: MONGODB_PORT
        - name: MONGODB_DATABASE
          valueFrom:
            configMapKeyRef:
              name: communitylink-config
              key: MONGODB_DATABASE
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: communitylink-secret
              key: JWT_SECRET
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: communitylink-config
              key: NODE_ENV
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: communitylink
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```

---

#### 6. Frontend Deployment

**File**: `k8s/frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: communitylink
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: communitylink-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: REACT_APP_API_URL
          value: "http://backend-service:5000/api"
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: communitylink
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

#### 7. Persistent Volume Claim

**File**: `k8s/pvc.yaml`

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: communitylink
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

---

### CI/CD Pipeline Architecture

#### GitHub Actions Workflow

**File**: `.github/workflows/ci-cd.yml`

```yaml
name: CommunityLink CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install backend dependencies
      working-directory: ./backend
      run: npm ci
    
    - name: Run backend tests
      working-directory: ./backend
      env:
        MONGODB_URI: mongodb://localhost:27017/communitylink_test
        JWT_SECRET: test-secret-key
      run: npm test
    
    - name: Upload test coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/coverage-final.json

  build-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install frontend dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Build frontend
      working-directory: ./frontend
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: frontend-build
        path: ./frontend/build

  build-docker-images:
    runs-on: ubuntu-latest
    needs: [test-backend, build-frontend]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push backend image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/communitylink-backend:latest
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/communitylink-frontend:latest

  deploy-to-kubernetes:
    runs-on: ubuntu-latest
    needs: build-docker-images
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/configmap.yaml
        kubectl apply -f k8s/secret.yaml
        kubectl apply -f k8s/pvc.yaml
        kubectl apply -f k8s/mongodb-deployment.yaml
        kubectl apply -f k8s/backend-deployment.yaml
        kubectl apply -f k8s/frontend-deployment.yaml
    
    - name: Verify deployment
      run: |
        kubectl rollout status deployment/backend -n communitylink
        kubectl rollout status deployment/frontend -n communitylink
        kubectl get pods -n communitylink
```

**Pipeline Stages**:

1. **Test Backend**:
   - Spin up MongoDB service container
   - Install dependencies
   - Run automated API tests with test database
   - Generate and upload code coverage reports

2. **Build Frontend**:
   - Install dependencies
   - Build production React bundle
   - Upload build artifacts for deployment

3. **Build Docker Images** (main branch only):
   - Build backend Docker image
   - Build frontend Docker image
   - Push images to Docker Hub registry

4. **Deploy to Kubernetes** (main branch only):
   - Apply Kubernetes manifests
   - Verify deployment rollout
   - Check pod status

**Required Secrets** (configured in GitHub repository settings):
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub access token
- `KUBE_CONFIG`: Base64-encoded Kubernetes config file

---

## Error Handling

### Centralized Error Handling Strategy

All errors flow through a centralized error handling middleware that provides consistent error responses across the entire API.

**Error Handler Middleware** (`middleware/errorMiddleware.js`):

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  
  // Log error details (exclude sensitive info)
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error = new AppError(messages.join(', '), 400);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 409);
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError('Invalid resource ID format', 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }
  
  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    message: error.statusCode === 500 ? 'Something went wrong' : error.message,
    statusCode: error.statusCode || 500,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { AppError, errorHandler };
```

### Validation Middleware

Input validation occurs before reaching controllers using express-validator or custom validation middleware.

**Validation Example** (registration):

```javascript
const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

// Usage: router.post('/register', registerValidation, authController.register);
```

### Error Response Consistency

All API endpoints return errors in a standardized format:

```json
{
  "success": false,
  "error": "Technical error message",
  "message": "User-friendly message",
  "statusCode": 400,
  "details": [] // Optional: validation errors array
}
```

### Frontend Error Handling

**API Service Error Interceptor**:

```javascript
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    // Extract error message from response
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';
    
    // Handle specific status codes
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Create normalized error object
    const normalizedError = {
      message: errorMessage,
      statusCode: error.response?.status,
      details: error.response?.data?.details
    };
    
    throw normalizedError;
  }
);
```

**Component Error Handling Pattern**:

```jsx
function AnnouncementsPage() {
  const [error, setError] = useState(null);
  
  async function handleCreateAnnouncement(data) {
    try {
      setError(null);
      await apiService.createAnnouncement(data);
      // Success handling...
    } catch (err) {
      setError(err.message);
      // Optionally show toast notification
    }
  }
  
  return (
    <div>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {/* Rest of component */}
    </div>
  );
}
```

### Database Error Handling

**Connection Error Handling**:

```javascript
async function connectDatabase() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('✓ MongoDB connected successfully');
      return;
    } catch (error) {
      retries--;
      console.error(`MongoDB connection attempt failed. Retries left: ${retries}`);
      
      if (retries === 0) {
        console.error('✗ MongoDB connection failed. Exiting...');
        process.exit(1);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 5000 * (4 - retries)));
    }
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});
```

**Query Error Handling**:

```javascript
async function getAnnouncementById(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement retrieved successfully'
    });
  } catch (error) {
    // CastError (invalid ID format) automatically handled by errorHandler
    next(error);
  }
}
```

### Graceful Shutdown

**Server Cleanup on Exit**:

```javascript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connection...');
  
  server.close(async () => {
    await mongoose.connection.close();
    console.log('Cleanup complete. Exiting process.');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});
```

## Testing Strategy

### Testing Overview

The CommunityLink project implements a comprehensive testing strategy that validates functionality at multiple levels while avoiding over-testing through intelligent test selection.

**Testing Philosophy**:
- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Integration tests**: Validate API endpoints with real database operations
- **Manual tests**: Confirm end-to-end workflows and UI behavior

**Property-Based Testing Assessment**:
This project is **NOT suitable for property-based testing** because:
1. **Infrastructure as Code**: Kubernetes manifests and Docker configurations are declarative (use snapshot/policy tests instead)
2. **Simple CRUD operations**: Database operations have no complex transformation logic (use integration tests instead)
3. **External dependencies**: Heavy reliance on MongoDB, authentication, and UI rendering (use mocks and integration tests)
4. **DevOps laboratory focus**: Project emphasizes deployment, not algorithmic correctness

Therefore, the Correctness Properties section is intentionally omitted from this design document.

### Backend Testing

#### 1. Automated API Tests

**Testing Framework**: Jest + Supertest

**Test Database Configuration**:
- Separate test database: `communitylink_test`
- Database cleared before each test suite
- In-memory MongoDB for faster tests (optional)

**Test Structure** (`backend/tests/`):

```
tests/
├── auth.test.js          # Authentication endpoints
├── announcements.test.js # Announcement CRUD operations
├── events.test.js        # Event CRUD operations
├── health.test.js        # Health check endpoint
└── setup.js              # Test configuration and helpers
```

**Test Setup** (`tests/setup.js`):

```javascript
const mongoose = require('mongoose');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/communitylink_test';
  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

**Example Test Suite** (`tests/announcements.test.js`):

```javascript
const request = require('supertest');
const app = require('../server');

describe('Announcements API', () => {
  let adminToken;
  let residentToken;
  let announcementId;
  
  beforeEach(async () => {
    // Create admin user and get token
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'admin', email: 'admin@test.com', password: 'password123' });
    
    // Manually set role to Administrator (in tests only)
    await User.findByIdAndUpdate(adminRes.body.data.userId, { role: 'Administrator' });
    
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.data.token;
    
    // Create resident user and get token
    const residentRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'resident', email: 'resident@test.com', password: 'password123' });
    
    const residentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resident@test.com', password: 'password123' });
    residentToken = residentLogin.body.data.token;
  });
  
  describe('POST /api/announcements', () => {
    it('should create announcement with valid admin token', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Announcement',
          content: 'This is a test',
          author: 'Admin Team'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.title).toBe('Test Announcement');
      
      announcementId = res.body.data._id;
    });
    
    it('should reject creation with missing fields (400)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Incomplete' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('should reject creation without token (401)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .send({
          title: 'Test',
          content: 'Test',
          author: 'Test'
        });
      
      expect(res.status).toBe(401);
    });
    
    it('should reject creation with resident token (403)', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          title: 'Test',
          content: 'Test',
          author: 'Test'
        });
      
      expect(res.status).toBe(403);
    });
  });
  
  describe('GET /api/announcements', () => {
    beforeEach(async () => {
      // Create test announcements
      await Announcement.create([
        { title: 'First', content: 'Content 1', author: 'Admin' },
        { title: 'Second', content: 'Content 2', author: 'Admin' }
      ]);
    });
    
    it('should retrieve all announcements', async () => {
      const res = await request(app).get('/api/announcements');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('Second'); // Newest first
    });
  });
  
  describe('GET /api/announcements/:id', () => {
    it('should retrieve single announcement by valid ID', async () => {
      const announcement = await Announcement.create({
        title: 'Test',
        content: 'Content',
        author: 'Admin'
      });
      
      const res = await request(app).get(`/api/announcements/${announcement._id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Test');
    });
    
    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/announcements/${fakeId}`);
      
      expect(res.status).toBe(404);
    });
    
    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/api/announcements/invalid-id');
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('PUT /api/announcements/:id', () => {
    it('should update announcement with admin token', async () => {
      const announcement = await Announcement.create({
        title: 'Original',
        content: 'Content',
        author: 'Admin'
      });
      
      const res = await request(app)
        .put(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated');
    });
    
    it('should reject update with resident token (403)', async () => {
      const announcement = await Announcement.create({
        title: 'Test',
        content: 'Content',
        author: 'Admin'
      });
      
      const res = await request(app)
        .put(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ title: 'Updated' });
      
      expect(res.status).toBe(403);
    });
  });
  
  describe('DELETE /api/announcements/:id', () => {
    it('should delete announcement with admin token', async () => {
      const announcement = await Announcement.create({
        title: 'To Delete',
        content: 'Content',
        author: 'Admin'
      });
      
      const res = await request(app)
        .delete(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      
      // Verify deletion
      const deleted = await Announcement.findById(announcement._id);
      expect(deleted).toBeNull();
    });
  });
});
```

**Test Coverage Goals**:
- Successful operations (201, 200)
- Validation errors (400)
- Authentication failures (401)
- Authorization failures (403)
- Resource not found (404)
- Server errors (500)

**Running Tests**:
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- announcements.test.js

# Watch mode for development
npm test -- --watch
```

#### 2. Unit Tests for Business Logic

**Testing Utilities and Helpers**:

```javascript
// tests/utils/jwt.test.js
describe('JWT Utilities', () => {
  it('should generate valid token with user payload', () => {
    const user = { _id: '123', email: 'test@test.com', role: 'Resident' };
    const token = generateToken(user);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe('123');
    expect(decoded.role).toBe('Resident');
  });
  
  it('should create token that expires in 24 hours', () => {
    const user = { _id: '123', email: 'test@test.com', role: 'Resident' };
    const token = generateToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const expiryTime = decoded.exp - decoded.iat;
    expect(expiryTime).toBe(86400); // 24 hours in seconds
  });
});

// tests/utils/password.test.js
describe('Password Hashing', () => {
  it('should hash password before saving user', async () => {
    const user = new User({
      username: 'test',
      email: 'test@test.com',
      password: 'plaintext123'
    });
    
    await user.save();
    
    expect(user.password).not.toBe('plaintext123');
    expect(user.password.length).toBe(60); // bcrypt hash length
  });
  
  it('should correctly compare valid password', async () => {
    const user = new User({
      username: 'test',
      email: 'test@test.com',
      password: 'password123'
    });
    await user.save();
    
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
  });
  
  it('should reject invalid password', async () => {
    const user = new User({
      username: 'test',
      email: 'test@test.com',
      password: 'password123'
    });
    await user.save();
    
    const isMatch = await user.comparePassword('wrongpassword');
    expect(isMatch).toBe(false);
  });
});
```

### Manual API Testing

#### Postman Collection

**File**: `postman/CommunityLink_API.postman_collection.json`

**Collection Structure**:
1. **Variables**:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: (automatically set after login)
   - `announcementId`: (automatically set after creation)
   - `eventId`: (automatically set after creation)

2. **Authentication Folder**:
   - Register User
   - Login User
   - Test scripts to extract and save token

3. **Announcements Folder**:
   - Create Announcement (admin only)
   - Get All Announcements
   - Get Single Announcement
   - Update Announcement (admin only)
   - Delete Announcement (admin only)

4. **Events Folder**:
   - Create Event (admin only)
   - Get All Events
   - Get Single Event
   - Update Event (admin only)
   - Delete Event (admin only)

5. **Health Check Folder**:
   - Get Health Status

**Example Request with Test Script** (Login):

```json
{
  "name": "Login User",
  "request": {
    "method": "POST",
    "header": [{ "key": "Content-Type", "value": "application/json" }],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"admin@test.com\",\n  \"password\": \"password123\"\n}"
    },
    "url": "{{baseUrl}}/auth/login"
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test(\"Status code is 200\", function () {",
          "    pm.response.to.have.status(200);",
          "});",
          "",
          "pm.test(\"Response has token\", function () {",
          "    var jsonData = pm.response.json();",
          "    pm.expect(jsonData.data.token).to.exist;",
          "    pm.collectionVariables.set(\"token\", jsonData.data.token);",
          "});"
        ]
      }
    }
  ]
}
```

**Usage Documentation** (in README):

```markdown
### Using Postman Collection

1. Import collection: `postman/CommunityLink_API.postman_collection.json`
2. Set collection variable `baseUrl` to your API URL
3. Run requests in order:
   - First run "Register User" to create an account
   - Run "Login User" to get authentication token (automatically saved)
   - Run other requests (token automatically included)
4. To test admin operations:
   - Manually update user role in database: `db.users.updateOne({email: "admin@test.com"}, {$set: {role: "Administrator"}})`
   - Run "Login User" again to get new token with admin role
```

### Frontend Testing

**Strategy**: Manual testing focus for laboratory project (automated UI tests optional)

**Manual Test Scenarios**:

1. **Authentication Flow**:
   - Register new user → verify redirect to login
   - Login with valid credentials → verify redirect to dashboard
   - Login with invalid credentials → verify error message
   - Access protected route without auth → verify redirect to login
   - Logout → verify token cleared and redirect to login

2. **Announcements**:
   - View announcements list as resident
   - Create announcement as admin → verify appears in list
   - Edit announcement as admin → verify changes saved
   - Delete announcement as admin → verify removed from list
   - Attempt admin operations as resident → verify controls hidden

3. **Events**:
   - View events list as resident
   - Create event as admin → verify appears in list
   - Edit event as admin → verify changes saved
   - Delete event as admin → verify removed from list

4. **Error Handling**:
   - Submit forms with missing fields → verify validation errors
   - Simulate API error → verify error message displayed
   - Test with expired token → verify redirect to login

5. **Responsive Design**:
   - Test on desktop viewport
   - Test on mobile viewport (responsive breakpoints)

### Integration Testing

**Docker Compose Integration Test**:

```bash
# Start all services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Login and extract token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  | jq -r '.data.token')

# Test protected endpoint
curl http://localhost:5000/api/announcements \
  -H "Authorization: Bearer $TOKEN"

# Cleanup
docker-compose down
```

**Kubernetes Integration Test**:

```bash
# Apply all manifests
kubectl apply -f k8s/

# Wait for rollout
kubectl rollout status deployment/backend -n communitylink
kubectl rollout status deployment/frontend -n communitylink

# Port forward to test
kubectl port-forward service/backend-service 5000:5000 -n communitylink &

# Run health check
curl http://localhost:5000/health

# Cleanup
kubectl delete namespace communitylink
```

### Test Execution in CI/CD

The GitHub Actions pipeline automatically runs:
1. Backend unit tests with coverage reporting
2. Frontend build verification
3. Docker image builds (on main branch)
4. Kubernetes deployment (on main branch)

**Test Requirements for PR Merge**:
- All backend tests must pass
- Frontend must build successfully
- Test coverage > 70% (configurable)

---

This design document provides the complete technical blueprint for implementing the CommunityLink DevOps laboratory project. All 16 requirements from the requirements document are addressed through detailed architecture, API specifications, data models, component designs, and testing strategies. The design is practical and suitable for B.Tech laboratory implementation and evaluation.
