# Gemini Context File for SortWise

This document provides essential context for any AI agent working on the SortWise project. It covers the project overview, technical specifications, development workflow, and a summary of key decisions made during its initial development.

---

## 1. Project Overview

SortWise is a cross-platform desktop application built with Electron, React, and Python. Its primary purpose is to help users organize their photos and videos into a structured directory system based on file metadata (like EXIF data) or file system properties.

**Core Functionality:**
- Select one or more source folders.
- Choose from various sorting criteria (date, file type, camera model, etc.).
- Choose a file operation (move or copy).
- The application processes the files and organizes them into a clean, hierarchical folder structure in the source directory.
- A log of all operations is created, and the user can undo the last sort.

**Upcoming Features:**
- **Granular Date Sorting:** Allow users to choose between sorting by year only, or by year and month.
- **Custom Folder Structure:** Allow users to define their own output folder template using placeholders.

---

## 2. Technical Specifications & Tech Stack

- **Frontend:**
  - **Framework:** React (using `create-react-app`)
  - **UI:** Standard HTML/CSS, no specific UI library is in use.
  - **State Management:** React Hooks (`useState`, `useEffect`).

- **Desktop Framework:**
  - **Framework:** Electron
  - **Communication:** The frontend communicates with the backend Python script via Electron's `ipcRenderer` and a `preload.js` script, which exposes the `window.electronAPI` object.

- **Backend:**
  - **Language:** Python 3 (run from a virtual environment `venv`)
  - **Core Logic:** A single Python script (`backend/main.py`) handles all file processing.
  - **Dependencies:** `Pillow`, `exifread`, `geopy`, `hachoir`, `pyinstaller`. These are managed in `backend/requirements.txt`.

- **Packaging:**
  - **Tool:** `electron-builder` is used to package the application into a distributable `.app` for macOS.

---

## 3. Project Structure

```
/Users/bharat/PythonProjects/photo_organizer/
├── backend/              # Python backend logic
│   ├── main.py
│   └── requirements.txt
├── frontend/             # React and Electron frontend
│   ├── build/            # React production build (ignored by git)
│   ├── dist/             # Packaged application (ignored by git)
│   ├── node_modules/     # (ignored by git)
│   ├── public/           # Public assets and electron.js
│   ├── src/              # React source code
│   ├── main.js           # Electron main process entry point
│   └── preload.js        # Electron preload script
├── .gitignore
├── README.md
├── venv/                 # Python virtual environment
└── LICENSE
```

---

## 4. Development & Build Workflow

- **To run in development mode:**
  - Navigate to the `frontend` directory.
  - Run `npm run dev`. This command starts the React development server and then launches the Electron application.

- **To build the application for production:**
  1. Navigate to the `frontend` directory.
  2. Run `npm run electron-pack`. This command will build the React app and package it into a distributable file in the `frontend/dist` directory.

---

## 5. Key Decisions & Project History

- **UI Overhaul:** The initial UI was replaced with a more user-friendly interface with a black background, white text, and a centered layout.
- **Progress Bar:** A progress bar with a percentage indicator was added to provide feedback during the sorting process.
- **Undo Functionality:** The undo functionality was fixed by ensuring the log file path is correctly passed from the backend to the frontend.
- **Python Virtual Environment:** A Python virtual environment (`venv`) was implemented to manage backend dependencies and resolve `ModuleNotFoundError` issues.
- **Date Sorting Logic:** The initial implementation for sorting by date was too rigid and only parsed one specific EXIF date format. This was fixed by making the parsing more flexible and adding a fallback mechanism to use the file's "last modified" date if EXIF data is not present.
- **Git Submodule Issue:** The `frontend` directory was initially a separate Git repository, causing it to be treated as a submodule. This was resolved by deleting the `frontend/.git` directory and re-integrating the files into the main repository.
- **Application Packaging:** There were several challenges with `electron-builder` configuration. The final, working solution involved:
  - Placing the Electron entry point at `frontend/main.js`.
  - Referencing this file in the `main` key of `frontend/package.json`.
  - The packaged application (`dist` directory) is ignored by Git.
- **Distributing Large Files:** The packaged application files are too large for GitHub's file size limits. The standard practice of using **GitHub Releases** was adopted to host the distributable `.dmg` and `.zip` files.

---

## 6. Coding Style

- **Python:** The backend follows standard PEP 8 style. It is a procedural script with clear, single-purpose functions.
- **JavaScript/React:** The frontend follows the standard conventions and style enforced by `create-react-app` and Prettier. The code uses functional components with Hooks.