# InkWell Blog

A full-stack blog platform where people can register, write, edit and share posts. Built with Node.js, Express and MongoDB as part of my internship at **Codomax Digital Solutions**.

**Live demo:** https://YOUR-APP-NAME.onrender.com
*(The free hosting plan sleeps after 15 minutes without visitors, so the first load can take about a minute.)*

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## Screenshots

| Home | Dashboard (dark mode) | Profile |
|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Profile](docs/screenshots/profile.png) |

## Features

- **Accounts:** register and log in with hashed passwords (bcrypt) and JWT sessions that expire after 2 hours
- **Blogs (full CRUD):** create, read, edit and delete posts, and only the author can change their own posts
- **Search and filter:** find posts by keyword and filter by category
- **Dashboard:** shows only your own posts, with a greeting and live stats
- **Profile:** edit your name and bio, change your password, and log out
- **Blog details page** for every post, with reading time
- **Light and dark theme**, toast messages, and a layout that works on phones, tablets and desktops
- **Security:** Helmet security headers, rate limiting on login and register, input validation on the server, and protection against HTML injection

## Tech stack

| Part | Technology |
|---|---|
| Frontend | HTML5, CSS3 (Flexbox, Grid, CSS variables), vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth and security | bcryptjs, jsonwebtoken, helmet, express-rate-limit, cors, dotenv |
| Hosting | Render (app) and MongoDB Atlas (database) |

## How it works

```
Browser (HTML, CSS, JS)  --fetch + JWT-->  Express API  --Mongoose-->  MongoDB
```

Express serves the pages from the `public` folder and the REST API under `/api`, so one server runs the whole app.

## Project structure

```
inkwell-blog/
├── server.js            app setup, security, routes, startup
├── config/db.js         MongoDB connection
├── models/              User.js, Blog.js
├── routes/              auth.js, blogs.js
├── middleware/auth.js   JWT check for protected routes
├── public/              pages, css/style.css, js/script.js
└── .env.example         settings template
```

## API reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | No | Create an account |
| POST | /api/auth/login | No | Log in and get a token |
| GET | /api/auth/me | Yes | Get my profile and stats |
| PUT | /api/auth/me | Yes | Update my name and bio |
| PUT | /api/auth/password | Yes | Change my password |
| GET | /api/blogs | No | List blogs (`?search=` and `?category=` are optional) |
| GET | /api/blogs/mine | Yes | List my blogs |
| GET | /api/blogs/:id | No | Get one blog |
| POST | /api/blogs | Yes | Create a blog |
| PUT | /api/blogs/:id | Yes (author) | Update a blog |
| DELETE | /api/blogs/:id | Yes (author) | Delete a blog |
| GET | /health | No | Check that the server is running |

Protected routes expect the header `Authorization: Bearer <token>`.

## Run it on your computer

You need Node.js 18 or newer and a MongoDB database (local, or free MongoDB Atlas).

```bash
git clone https://github.com/AdityaGaikwad00/blog-app-backend.git
cd blog-app-backend
npm install
cp .env.example .env      # on Windows: copy .env.example .env
npm start
```

Open http://localhost:5000

### Environment variables

| Name | Meaning |
|---|---|
| `PORT` | Port number (default 5000, hosting platforms set it for you) |
| `NODE_ENV` | `development` locally, `production` when deployed |
| `JWT_SECRET` | Long random text used to sign login tokens (required in production) |
| `MONGO_URI` | MongoDB connection string |

## Deployment (Render and MongoDB Atlas)

1. Create a free MongoDB Atlas cluster, add a database user, allow network access, and copy the connection string.
2. On Render, create a **Web Service** from this GitHub repo.
3. Build command `npm install`, start command `npm start`.
4. Add the environment variables `MONGO_URI`, `JWT_SECRET` and `NODE_ENV=production`.
5. Deploy, then open the Render URL.

## Roadmap

- Image uploads for blog covers
- Comments and likes
- Email verification and password reset
- Pagination for long lists of blogs

## Author

**Aditya Gaikwad**, intern at Codomax Digital Solutions
GitHub: [@AdityaGaikwad00](https://github.com/AdityaGaikwad00)

Released under the [MIT License](LICENSE).
