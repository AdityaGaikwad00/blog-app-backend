# InkWell Blog - Full Stack (Node.js, Express, MongoDB)

Blog application built during my internship at Codomax Digital Solutions.
- Module 01: Frontend (HTML, CSS, JavaScript)
- Module 02: Backend REST APIs (Node.js, Express, JWT)
- Module 03: Database integration (MongoDB with Mongoose)
- Module 04: CRUD operations (edit, delete, search and category filter)

## Features
- Register and login with hashed passwords (bcrypt) and JWT tokens
- User credentials and blog posts stored in MongoDB
- Home page loads all blogs from the database
- Create blogs (login required), personal dashboard
- Blog details page for each post (`blog.html?id=...`)
- Full CRUD: create, read, update and delete blogs (only the author can edit or delete)
- Search blogs by title or content, and filter by category

## Tech Stack
Node.js, Express.js, MongoDB, Mongoose, bcryptjs, jsonwebtoken, cors, dotenv

## API Endpoints
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | No | Create an account |
| POST | /api/auth/login | No | Log in and get a token |
| GET | /api/blogs | No | Get all blogs (optional `?search=` and `?category=`) |
| GET | /api/blogs/mine | Yes | Get my blogs |
| GET | /api/blogs/:id | No | Get one blog (details page) |
| POST | /api/blogs | Yes | Create a blog |
| PUT | /api/blogs/:id | Yes (author only) | Update a blog |
| DELETE | /api/blogs/:id | Yes (author only) | Delete a blog |

## Folder Structure
```
backend/
├── server.js
├── config/db.js        (MongoDB connection)
├── models/             (User.js, Blog.js)
├── routes/             (auth.js, blogs.js)
├── middleware/auth.js  (JWT check)
├── public/             (frontend pages, CSS, JS)
└── .env.example
```

## How to Run
1. Install dependencies
   ```
   npm install
   ```
2. Create `.env` from the example and fill in your own values
   ```
   copy .env.example .env
   ```
   - `JWT_SECRET`: any long random text
   - `MONGO_URI`: your MongoDB Atlas connection string
3. Start the server
   ```
   npm start
   ```
4. Open http://localhost:5000

## Notes
- `.env` is not uploaded to GitHub because it holds secrets.
- The first run adds 3 sample blogs to an empty database.
