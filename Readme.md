# React Learning Collection

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Redux](https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white)

A comprehensive collection of React projects documenting the journey from fundamental concepts to production-ready applications. This repository serves as a practical guide and portfolio demonstrating proficiency in the modern React ecosystem.

## 🚀 Overview

This repository contains a series of projects built while mastering React, ranging from simple component demonstrations to complex, full-stack applications. Each directory represents a specific concept or application, showcasing the progression of skills in frontend development.

## ✨ Key Features

- **Modern Tooling**: Built with **Vite** for fast development and optimised builds.
- **Latest React Features**: Utilizes React 18+ and React 19 concepts, including functional components and Hooks (`useState`, `useEffect`, `useCallback`, `useContext`).
- **State Management**: implementations using both **Context API** and **Redux Toolkit**.
- **Routing**: Client-side routing with **React Router DOM** (v6/v7).
- **Backend Integration**: Full-stack capabilities demonstrated with **Appwrite** (Auth, Database, Storage).
- **Form Handling**: Efficient form management with **React Hook Form**.
- **Styling**: Responsive and modern UI designs using **Tailwind CSS**.

## 📂 Project Directory

### 🌟 Featured Project: `Mega_Project`
A production-grade blogging application featuring:
- **Authentication**: Secure login/signup flow using Appwrite.
- **State Management**: Centralized store with Redux Toolkit.
- **Rich Text Editor**: Integration with TinyMCE.
- **Routing**: Protected routes and dynamic navigation.
- **Tech Stack**: React 19, Redux Toolkit, React Router DOM, TailwindCSS, Appwrite.

### 📚 Learning Modules

| Project | Description | Key Concepts |
|---------|-------------|--------------|
| `reduxToolKitTodo` | Advanced Todo App | Redux Toolkit, State Persistence |
| `07reactRouter` | Routing Demo | React Router DOM, Dynamic Routes |
| `09themeSwitcher` | Dark/Light Mode | Context API, DOM Manipulation |
| `08miniContext` | Auth Context Demo | Context API Basics, Provider Pattern |
| `06currencyConvertor` | Currency Tool | Custom Hooks, API Integration |
| `05passwordGenerator` | Password Tool | `useCallback`, `useEffect`, Clipboard API |
| `04bgchanger` | Background Color | `useState`, Event Handling |
| `11todo` | Todo Application | Context API, Local Storage |

## 🛠️ Getting Started

Follow these instructions to run any project locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/React_Learning.git
   cd React_Learning
   ```

2. **Run a specific project** (e.g., `Mega_Project`)
   ```bash
   cd Mega_Project
   npm install
   npm run dev
   ```
   The application will typically start at `http://localhost:5173`.

### Configuration (Mega_Project only)

This project requires environment variables for Appwrite backend services. Create a `.env` file in the root of the `Mega_Project` directory with the following keys:

```bash
VITE_APPWRITE_URL="your_appwrite_endpoint"
VITE_APPWRITE_PROJECT_ID="your_project_id"
VITE_APPWRITE_DATABASE_ID="your_database_id"
VITE_APPWRITE_COLLECTION_ID="your_collection_id"
VITE_APPWRITE_BUCKET_ID="your_storage_bucket_id"
```

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to add new features:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 💬 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/React_Learning/issues) on GitHub.

## 📝 License

This project is open source and available for learning and personal use.

## 👤 Maintainer

Created and maintained by a passionate React developer. Feel free to reach out for collaborations!