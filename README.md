<div align="center">

# 🎓 **Online Learning Platform**

<img src="https://avatars.githubusercontent.com/u/251194299?s=200&v=4" width="140" alt="500InternalServer Logo" />

**Empowering knowledge sharing with an intuitive and modern frontend**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5+-0170FE.svg)](https://ant.design/)

</div>

---

## 📖 Overview

The **Online Learning Platform** is a dynamic frontend application designed to deliver a seamless
e-learning experience. Built with **React**, **Vite**, **Ant Design**, and **Redux Toolkit**, it
provides an intuitive interface for learners, instructors, and administrators. This project focuses
on responsive design, state management, and user-friendly navigation, making education accessible
and engaging.

Ideal for:

- 🏫 **Educational Institutions** seeking modern e-learning interfaces.
- 🧑‍🏫 **Independent Instructors** delivering interactive courses.
- 🏢 **Corporate Training Programs** enhancing employee skills.

---

## 🚀 Key Features

| Feature                     | Description                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| 🔐 **User Authentication**  | Secure login and registration with role-based UI (Student, Instructor, Admin). |
| 📚 **Course Browsing**      | Explore courses with filters, search, and responsive layouts.                  |
| 📋 **Enrollment Dashboard** | Track enrolled courses, progress, and certificates in a centralized view.      |
| 🎨 **Responsive Design**    | Seamless experience across devices using Ant Design’s responsive components.   |
| 🛠️ **State Management**     | Efficient global state handling with Redux Toolkit for smooth interactions.    |
| ⚡ **Fast Performance**     | Optimized builds and hot-reloading with Vite for rapid development.            |

---

## 🧱 Tech Stack

| Component      | Technology                     |
| -------------- | ------------------------------ |
| **Frontend**   | React, Vite                    |
| **UI Library** | Ant Design                     |
| **State**      | Redux Toolkit                  |
| **Styling**    | CSS Modules, Ant Design Themes |
| **Build Tool** | Vite                           |

---

## ⚙️ Installation & Setup

### 📋 Prerequisites

Ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### 🔧 Step-by-Step Guide

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/elearning-ui.git
   cd elearning-ui
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment** Create a `.env` file in the root directory:

   ```env
   VITE_API_URL=https://edu-verse-api-rho.vercel.app/api/v1
   VITE_NODE_ENV=development
   ```

   - `VITE_API_URL`: Set to your backend API (e.g., Node.js/Express server).
   - Ensure the backend is running for full functionality.

4. **Start the Development Server**

   ```bash
   npm run dev
   ```

   Open `http://localhost:4000` in your browser to view the app.

5. **Build for Production**
   ```bash
   npm run build
   ```
   Serve the `dist/` folder using a static server (e.g., `npm run preview`).

### 🛠️ Troubleshooting

- **API Errors**: Verify the backend server is running and `VITE_API_URL` is correct.
- **Port Conflicts**: Vite defaults to port `4000`. Change it in `vite.config.ts` if needed.
- **Dependency Issues**: Delete `node_modules` and `package-lock.json`, then reinstall.
- **Browser Caching**: Clear browser cache if UI updates don’t appear.

---

## ✨ Core Functionalities

### 🔐 User Authentication

A clean login and registration interface with role-based navigation.

- **UI**: Ant Design forms with validation.
- **State**: Redux Toolkit manages auth tokens and user data.

---

### 📚 Course Browsing

Explore courses with dynamic filters, search, and grid/list views.

- **UI**: Ant Design Cards and Table components.
- **State**: Redux Toolkit for caching course data.
- **Example**:
  ```jsx
  <CourseCard
    title="JavaScript Mastery"
    instructor="John Doe"
    price={49.99}
    onEnroll={handleEnroll}
  />
  ```

---

### 📋 Enrollment Dashboard

View enrolled courses, track progress, and download certificates.

- **UI**: Ant Design Progress and Timeline components.
- **State**: Redux Toolkit for real-time progress updates.

---

### 🎨 Responsive Design

Seamless experience on desktops, tablets, and mobiles.

- **UI**: Ant Design’s grid system and responsive utilities.
- **Example**: Layout adapts dynamically to screen size.

---

## 🗂️ Project Structure

```bash
src/
│   ├── assets/     # Images, icons, and static files
│   ├── components/ # Reusable React components
│   ├── pages/      # Page-level components (e.g., Home, Dashboard)
│   ├── store/      # Redux Toolkit slices and store setup
│   ├── styles/     # CSS Modules and global styles
│   ├── utils/      # API helpers and utilities
│   ├── routers/    # Route feature in systems
├── App.tsx         # Main app component
├── main.tsx        # Entry point
├── .env.example    # Environment template
├── package.json
├── tsconfig.json
└── vite.config.ts  # Vite configuration
```

---

## 🧪 Testing

Test the UI and state logic to ensure reliability.

1. **Run Tests**:

   ```bash
   npm run test
   ```

   _(Note: Add Jest or Vitest setup for full testing support.)_

2. **Linting**:
   ```bash
   npm run lint
   ```

---

## 🚀 Getting Started

1. Follow the **Installation & Setup** steps.
2. Open `http://localhost:4000` to explore the app.
3. Use dummy credentials (e.g., `test@example.com`) if no backend is connected.
4. Customize components in `src/components/` for your needs.

---

## 🌟 Roadmap

- [ ] Add real-time notifications with WebSockets.
- [ ] Integrate video player for course content.
- [ ] Support dark mode with Ant Design themes.
- [ ] Implement accessibility (a11y) standards.
- [ ] Add unit tests with Jest/Vitest.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
3. Commit changes:
   ```bash
   git commit -m "feat: add your feature"
   ```
4. Push and open a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 👥 Contributors

Developed by the talented **New Bie Coder Team**:

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/Vix1311">
        <img src="https://avatars.githubusercontent.com/u/166972180?v=4" width="100px;" alt="Mai Kỳ Vĩ"/>
        <br /><sub><b>Mai Kỳ Vĩ</b></sub>
      </a><br />
      <a href="#" title="Code">💻</a>
    </td>
    <td align="center">
      <a href="https://github.com/GiaHuy88693">
        <img src="https://avatars.githubusercontent.com/u/181533253?v=4" width="100px;" alt="Huỳnh Lê Gia Huy"/>
        <br /><sub><b>Huỳnh Lê Gia Huy</b></sub>
      </a><br />
      <a href="#" title="Code">💻</a>
    </td>
    <td align="center">
      <a href="https://github.com/truongquangquoc2011">
        <img src="https://avatars.githubusercontent.com/truongquangquoc2011" width="100px;" alt="Trương Quang Quốc"/>
        <br /><sub><b>Trương Quang Quốc</b></sub>
      </a><br />
      <a href="#" title="Code">💻</a>
    </td
  </tr>
</table>

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ by the 500InternalServer<br />
  <a href="https://github.com/your-username/elearning-ui">⭐ Star us on GitHub!</a>
</div>
