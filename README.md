# Aegis Academy - Learning Management System (LMS)

A premium, full-stack Learning Management System (LMS) designed for educational academies and online trainers. 
This application features a **Django REST API** backend interacting directly with **MongoDB Atlas**, and a stunning **glassmorphic dark-mode frontend** built with responsive CSS, Fetch API integration, and interactive lesson & assignment tracking dashboards.

---

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3 (Custom Glassmorphism design), ES6 JavaScript, Fetch API, `html2pdf.js` (for certificate generation).
- **Backend**: Django (Function-Based Views for REST APIs), `pymongo` (MongoDB Atlas connectivity), `python-dotenv` (security credentials manager), `django-cors-headers` (CORS resolver).
- **Database**: MongoDB Atlas (Cloud NoSQL).

---

## 💎 Implemented Features & Bonus Items (All Completed)

1. **Course Search & Filter (Bonus)**: Instantly search by name or instructor, and filter by level (Beginner/Intermediate/Advanced) or categories on `courses.html`.
2. **Student Progress Bar & Completion % (Bonus)**: Dynamically track completion metrics. Students can increment progress by clicking"+ Complete Lesson" in `enrollments.html`.
3. **Certificate Generation (PDF) (Bonus)**: Instantly generate and download a custom, styled landscape PDF completion certificate using `html2pdf.js` once progress reaches 100%.
4. **Responsive Mobile Dashboard (Bonus)**: Fully custom CSS styles with collapsible slide-in sidebar elements for tablets and mobile devices.
5. **Secure Connection Handling**: MongoDB credentials are kept secure in a `.env` file at the root. The `.env` file is excluded from git tracking using `.gitignore`.

---

## 📂 Project Structure

```
LearningManagementSystem/
│
├── Backend/
│   ├── db.py            # MongoDB Atlas connection & data seeder
│   ├── views.py         # 20+ Function-Based REST API views
│   ├── urls.py          # Django API url routing
│   ├── settings.py      # Django settings & CORS rules
│   ├── wsgi.py          # App WSGI server entry point
│   ├── verify_apis.py   # Automated API test script
│   └── __init__.py
│
├── Frontend/
│   ├── index.html       # Landing page (hero banner, featured courses)
│   ├── login.html       # Auth login (student/administrator roles)
│   ├── register.html    # Student registration form
│   ├── courses.html     # Live course catalog & filters
│   ├── enrollments.html # Enrolled course manager & PDF certificate generator
│   ├── assignments.html # Student assignment submissions panel
│   ├── dashboard.html   # Student stats overview & progress ring
│   ├── admin.html       # Admin control board (Student, Instructor, Course, Enrollment, Assignment CRUD)
│   ├── style.css        # Premium glassmorphic dark stylesheet
│   └── script.js        # DOM operations & Fetch integrations
│
├── manage.py            # Django command-line runner
├── .env                 # Environment secrets (Hidden)
├── .gitignore           # Git ignore list
└── README.md            # Documentation (This file)
```

---

## 🚀 Setup & Execution Guide

### Prerequisite
Ensure you have **Python 3** installed.

### 1. Configure Secrets
The backend connects automatically to MongoDB Atlas using the provided credentials. These are saved in a `.env` file at the root:
```env
MONGO_URI=your_URI
DJANGO_SECRET_KEY=....
```

### 2. Set Up Virtual Environment & Dependencies
Open your terminal at the project root and execute:

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\pip install django pymongo dnspython python-dotenv django-cors-headers
```

**On macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install django pymongo dnspython python-dotenv django-cors-headers
```

### 3. Launch the Backend Server
Start the Django development server:
```bash
# Windows
.venv\Scripts\python manage.py runserver

# macOS/Linux
source .venv/bin/activate
python manage.py runserver
```
The backend server will run on `http://127.0.0.1:8000/`. On startup, **the seeder script will run automatically**, creating `LMS_Database` and populating all five collections (students, instructors, courses, enrollments, assignments) with the required sample testing data.

### 4. Run Automated API Tests
With the server running, you can run the automated tests to verify the endpoints:
```bash
# Windows
.venv\Scripts\python Backend/verify_apis.py

# macOS/Linux
python Backend/verify_apis.py
```

### 5. Launch the Frontend
Simply open `Frontend/index.html` in any modern web browser.

---

## 🔐 Credentials for Immediate Testing

Use these seeded accounts to test different roles in the system:

### Student Account:
- **Email**: `rahul@gmail.com`
- **Password**: `....`

### Administrator Account:
- **Email**: `admin@aegis.com`
- **Password**: `....`
- *(Check the "Login as Administrator" box on the login screen)*

---

## 📡 REST API Specifications (20 CRUD + 1 Login)

| Method | Endpoint | Description |
|---|---|---|
| **POST** | `/students/login/` | Custom Authentication endpoint (Returns user data & role) |
| **POST** | `/students/add/` | Register/Create a student (Auto-increments starting from 101) |
| **GET** | `/students/` | Fetch all registered student accounts |
| **PUT** | `/students/update/<id>/` | Edit student information |
| **DELETE**| `/students/delete/<id>/` | Delete a student profile |
| **POST** | `/instructors/add/` | Add a new instructor (Auto-increments starting from 201) |
| **GET** | `/instructors/` | List all instructors |
| **PUT** | `/instructors/update/<id>/` | Modify instructor profile |
| **DELETE**| `/instructors/delete/<id>/` | Remove an instructor record |
| **POST** | `/courses/add/` | Create a course (Auto-increments starting from 301) |
| **GET** | `/courses/` | Retrieve course catalog |
| **PUT** | `/courses/update/<id>/` | Edit course price, instructor, level etc. |
| **DELETE**| `/courses/delete/<id>/` | Delete a course |
| **POST** | `/enrollments/add/` | Enroll a student in a course (Auto-increments starting from 401) |
| **GET** | `/enrollments/` | View enrollment history |
| **PUT** | `/enrollments/update/<id>/` | Adjust enrollment progress (0-100%) or status |
| **DELETE**| `/enrollments/delete/<id>/` | Delete an enrollment entry |
| **POST** | `/assignments/add/` | Submit assignment (Auto-increments starting from 501) |
| **GET** | `/assignments/` | Get assignment list |
| **PUT** | `/assignments/update/<id>/` | Edit submission grade marks or status |
| **DELETE**| `/assignments/delete/<id>/` | Delete assignment record |
