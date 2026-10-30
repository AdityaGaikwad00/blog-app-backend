# InkWell Blog - Backend API

REST API for the InkWell blog application, built with Node.js and Express.js (Module 02 of my internship at Codomax Digital Solutions).

## Features
- User registration with validation and password hashing (bcrypt)
- User login with JWT token authentication
- Protected routes using middleware
- Create and fetch blogs
- Connected to the InkWell frontend with the Fetch API

## Tech Stack
Node.js, Express.js, bcryptjs, jsonwebtoken, cors, dotenv

## API Endpoints
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | No | Create an account |
| POST | /api/auth/login | No | Log in and get a token |
| GET | /api/blogs | No | Get all blogs |
| GET | /api/blogs/mine | Yes | Get my blogs |
| POST | /api/blogs | Yes | Create a blog |

## Folder Structure
```
backend/
├── server.js
├── routes/        (auth.js, blogs.js)
├── middleware/    (auth.js)
├── utils/         (db.js)
├── data/          (JSON storage, created automatically)
└── .env.example
```

## How to Run
1. Install dependencies
   ```
   npm install
   ```
2. Create a `.env` file from the example
   ```
   copy .env.example .env
   ```
   Then set your own `JWT_SECRET` inside `.env`.
3. Start the server
   ```
   npm start
   ```
   The API runs on http://localhost:5000

## Notes
- Data is stored in a JSON file for now. A real database comes in the next module.
- Passwords are hashed and never stored as plain text.
