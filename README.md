# 🌐 ProjectSphere

> **Classroom Project Collaboration & Evaluation Platform**

A comprehensive MERN stack SaaS application designed to revolutionize how teachers and students collaborate on classroom projects. Built with modern technologies and a beautiful, responsive UI.

![ProjectSphere Banner](https://via.placeholder.com/1200x400/0a0a0f/8b5cf6?text=ProjectSphere)

## ✨ Features

# 🌐 ProjectSphere

2. Create your feature branch (`git checkout -b feature/AmazingFeature`)

3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)

---

## 🚩 Features

### 👩‍🏫 For Teachers
- Create and manage virtual classrooms with invite codes
- Assign projects with milestones and deadlines
- Oversee team formation and monitor progress
- Evaluate teams with marks, remarks, and weightage
- Export evaluations as CSV/XLSX
- Real-time chat with students (classroom, team, direct)

### 👨‍🎓 For Students
- Join classrooms via invite codes
- Form or join project teams
- Track project milestones, submissions, and deadlines
- Collaborate with teammates via internal chat
- Dashboard for all projects and tasks

### 💬 Chat System
- Classroom-wide chat
- Team review chat (teacher-student)
- Team internal chat
- Direct messages

### 📊 Project Workflows
1. Student-initiated projects
2. Teacher-assigned projects
3. Mini-projects for quick assignments

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (Express.js)
- **MongoDB** with Mongoose
- **JWT** authentication (access + refresh tokens)
- **Socket.IO** for real-time features
- **Security**: Helmet, bcrypt, rate limiting
- **Validation**: express-validator
- **Export**: xlsx for Excel exports

### Frontend
- **React 19** (Vite)
- **Mantine UI v7** (Dark Theme)
- **Zustand** for state management
- **React Router DOM v7**
- **Framer Motion** for animations
- **Three.js** & React Three Fiber for 3D
- **Tabler Icons**
- **Axios** for HTTP requests

---

## 📁 Project Structure

```
ProjectSphere/
│
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/
│       │   ├── database.js
│       │   └── index.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── chatController.js
│       │   ├── classroomController.js
│       │   ├── dashboardController.js
│       │   ├── index.js
│       │   ├── projectController.js
│       │   ├── teamController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── errorHandler.js
│       │   ├── index.js
│       │   ├── rateLimiter.js
│       │   └── validators.js
│       ├── models/
│       │   ├── Chat.js
│       │   ├── Classroom.js
│       │   ├── index.js
│       │   ├── Project.js
│       │   ├── Team.js
│       │   └── User.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── chatRoutes.js
│       │   ├── classroomRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── index.js
│       │   ├── projectRoutes.js
│       │   ├── teamRoutes.js
│       │   └── userRoutes.js
│       ├── socket/
│       │   └── index.js
│       └── utils/
│           ├── ApiError.js
│           ├── ApiResponse.js
│           ├── helpers.js
│           ├── index.js
│           └── jwt.js
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── postcss.config.cjs
│   ├── eslint.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── main.jsx
│       ├── api/
│       │   └── index.js
│       ├── assets/
│       ├── components/
│       │   ├── 3d/
│       │   │   ├── FloatingPolyhedrons.jsx
│       │   │   ├── index.js
│       │   │   └── ParticleBackground.jsx
│       │   └── common/
│       │       ├── EmptyState.jsx
│       │       ├── GlassCard.jsx
│       │       ├── index.js
│       │       ├── LoadingScreen.jsx
│       │       ├── Logo.jsx
│       │       ├── notifications.jsx
│       │       ├── ProtectedRoute.jsx
│       │       ├── StatsCard.jsx
│       │       ├── StatusBadge.jsx
│       │       └── UserAvatar.jsx
│       ├── layouts/
│       │   ├── AuthLayout.jsx
│       │   ├── DashboardLayout.jsx
│       │   └── index.js
│       ├── pages/
│       │   ├── index.js
│       │   ├── Landing.jsx
│       │   ├── auth/
│       │   │   ├── index.js
│       │   │   ├── Login.jsx
│       │   │   └── Register.jsx
│       │   ├── shared/
│       │   │   ├── Chat.jsx
│       │   │   ├── index.js
│       │   │   └── Settings.jsx
│       │   ├── student/
│       │   │   ├── ClassroomDetails.jsx
│       │   │   ├── Classrooms.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Discovery.jsx
│       │   │   ├── index.js
│       │   │   ├── ProjectDetails.jsx
│       │   │   ├── Projects.jsx
│       │   │   ├── TeamDetails.jsx
│       │   │   └── Teams.jsx
│       │   └── teacher/
│       │       ├── ClassroomDetails.jsx
│       │       ├── Classrooms.jsx
│       │       ├── Dashboard.jsx
│       │       ├── Discovery.jsx
│       │       ├── index.js
│       │       ├── Projects.jsx
│       │       └── Teams.jsx
│       ├── store/
│       │   ├── authStore.js
│       │   ├── chatStore.js
│       │   └── index.js
│       └── theme/
│           └── index.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your config
npm run dev   # for development
npm start     # for production
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/auth/register | Register new user |
| POST   | /api/auth/login    | User login        |
| POST   | /api/auth/logout   | User logout       |
| POST   | /api/auth/refresh  | Refresh token     |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/users/profile   | Get current user profile |
| PUT    | /api/users/profile   | Update profile           |
| PUT    | /api/users/password  | Change password          |

### Classrooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/classrooms         | Get user's classrooms      |
| POST   | /api/classrooms         | Create classroom (Teacher) |
| POST   | /api/classrooms/join    | Join with invite code      |
| GET    | /api/classrooms/:id     | Get classroom details      |
| PUT    | /api/classrooms/:id     | Update classroom           |
| DELETE | /api/classrooms/:id     | Delete classroom           |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/teams           | Get user's teams |
| POST   | /api/teams           | Create team      |
| POST   | /api/teams/:id/join  | Join team        |
| GET    | /api/teams/:id       | Get team details |
| PUT    | /api/teams/:id       | Update team      |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/projects                  | Get projects         |
| POST   | /api/projects                  | Create project       |
| GET    | /api/projects/:id              | Get project details  |
| PUT    | /api/projects/:id              | Update project       |
| POST   | /api/projects/:id/milestones   | Add milestone        |
| POST   | /api/projects/:id/evaluate     | Evaluate project     |
| GET    | /api/projects/:id/export       | Export evaluations   |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/chat/rooms              | Get chat rooms |
| GET    | /api/chat/rooms/:id/messages | Get messages   |
| POST   | /api/chat/rooms/:id/messages | Send message   |

---

## 🔌 Socket Events

### Client → Server
- `join_room`      — Join a chat room
- `leave_room`     — Leave a chat room
- `send_message`   — Send a message
- `typing`         — User is typing
- `stop_typing`    — User stopped typing
- `mark_read`      — Mark messages as read

### Server → Client
- `new_message`         — New message received
- `user_typing`         — Someone is typing
- `user_stopped_typing` — Someone stopped typing
- `message_read`        — Message was read

---

## 🎨 Design System

### Colors
- **Primary**: Violet (#8B5CF6)
- **Secondary**: Cyan (#06B6D4)
- **Background**: Dark gradient (#0a0a0f → #1a1a2e)
- **Surface**: Glassmorphism, blur effects

### Components
- Glassmorphism cards
- Gradient buttons
- Animated transitions
- 3D particle backgrounds
- Interactive floating sphere

---

## 🔒 Security
- JWT authentication with refresh tokens
- HTTP-only cookies for tokens
- Password hashing (bcrypt)
- Rate limiting on sensitive endpoints
- Input validation & sanitization
- CORS protection
- Helmet security headers

---

## 📱 Responsive Design
Works seamlessly on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

---

## 🧪 Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

---

## 📦 Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist
```

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to your branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License
MIT License — see [LICENSE](LICENSE)

---

## 👏 Acknowledgments
- [Mantine UI](https://mantine.dev/)
- [Three.js](https://threejs.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tabler Icons](https://tabler-icons.io/)

---

<p align="center">
  Made with ❤️ by ProjectSphere Team
</p>
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [Mantine UI](https://mantine.dev/) - Beautiful React components
- [Three.js](https://threejs.org/) - 3D graphics library
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Tabler Icons](https://tabler-icons.io/) - Beautiful open source icons

---

<p align="center">
  Made with ❤️ by <a href="#">ProjectSphere Team</a>
</p>
