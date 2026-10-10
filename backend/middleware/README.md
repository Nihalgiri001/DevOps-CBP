# Authentication Middleware

## Overview

This directory contains middleware functions for the CommunityLink backend API.

## authMiddleware.js

**Purpose**: JWT-based authentication middleware for protecting endpoints

**Usage**:

```javascript
const authenticate = require('./middleware/authMiddleware');

// Apply to specific routes
router.post('/api/announcements', authenticate, announcementController.create);
router.put('/api/announcements/:id', authenticate, announcementController.update);

// Or apply to all routes in a router
router.use(authenticate);
```

**How it works**:

1. Extracts JWT token from `Authorization` header in format: `Bearer <token>`
2. Verifies the token using `JWT_SECRET` environment variable
3. Decodes the token payload containing: `{ userId, email, role }`
4. Attaches decoded user info to `req.user` for use in route handlers
5. Returns 401 error if:
   - No Authorization header provided
   - Invalid header format (not "Bearer <token>")
   - Invalid or expired token

**Requirements Satisfied**: 1.7, 1.8, 1.9

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/announcements \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"title":"Community Update","content":"Important notice","author":"Admin"}'
```

**Example Response (401 Unauthorized)**:

```json
{
  "success": false,
  "error": "No authorization header provided",
  "message": "Authentication required",
  "statusCode": 401
}
```

**Tests**: See `tests/authMiddleware.test.js` for comprehensive test coverage.
