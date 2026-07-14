// API Config
const API_BASE = "http://127.0.0.1:8000";

// Global Session Management
let currentUser = null;

try {
    const sessionData = localStorage.getItem("currentUser");
    if (sessionData) {
        currentUser = JSON.parse(sessionData);
    }
} catch (e) {
    console.error("Failed to load user session", e);
}

// Global DOM Initializer
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupMobileNav();

    // Detect Page and run matching routing controller
    const bodyId = document.body.id;
    switch (bodyId) {
        case "page-index":
            initIndexPage();
            break;
        case "page-login":
            initLoginPage();
            break;
        case "page-register":
            initRegisterPage();
            break;
        case "page-courses":
            initCoursesPage();
            break;
        case "page-enrollments":
            initEnrollmentsPage();
            break;
        case "page-assignments":
            initAssignmentsPage();
            break;
        case "page-dashboard":
            initDashboardPage();
            break;
        case "page-admin":
            initAdminPage();
            break;
    }
});

// Setup Navigation links based on login role
function setupNavigation() {
    const authButtons = document.getElementById("auth-buttons");
    
    // Hide student-only links for visitors/admins
    const studentLinks = document.querySelectorAll(".student-only");
    const adminLinks = document.querySelectorAll(".admin-only");

    if (currentUser) {
        // User logged in
        if (currentUser.role === "admin") {
            studentLinks.forEach(el => el.style.display = "none");
            adminLinks.forEach(el => el.style.display = "block");
        } else {
            studentLinks.forEach(el => el.style.display = "block");
            adminLinks.forEach(el => el.style.display = "none");
        }

        if (authButtons) {
            authButtons.innerHTML = `
                <span style="font-size: 14px; color: var(--text-secondary); font-weight: 500;">
                    Hi, ${currentUser.full_name} (${currentUser.role})
                </span>
                <button class="btn btn-secondary" id="logout-btn">Logout</button>
            `;
            document.getElementById("logout-btn").addEventListener("click", logout);
        }
    } else {
        // Visitor mode
        studentLinks.forEach(el => el.style.display = "none");
        adminLinks.forEach(el => el.style.display = "none");

        if (authButtons) {
            authButtons.innerHTML = `
                <a href="login.html" class="btn btn-secondary">Login</a>
                <a href="register.html" class="btn btn-primary">Register</a>
            `;
        }

        // If trying to access protected pages, redirect to login
        const protectedPages = ["page-dashboard", "page-enrollments", "page-assignments", "page-admin"];
        if (protectedPages.includes(document.body.id)) {
            alert("Please login to access this section.");
            window.location.href = "login.html";
        }
    }
}

function logout() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    alert("Logged out successfully.");
    window.location.href = "index.html";
}

function setupMobileNav() {
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (toggle && links) {
        toggle.addEventListener("click", () => {
            links.classList.toggle("open");
        });
    }
}

// Helper to format date
function getTodayDateString() {
    const d = new Date();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


// ==================== 1. HOME PAGE (index.html) ====================
function initIndexPage() {
    fetch(`${API_BASE}/courses/`)
        .then(res => res.json())
        .then(courses => {
            const container = document.getElementById("featured-courses-container");
            if (!container) return;
            container.innerHTML = "";

            if (!courses || courses.length === 0) {
                container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <p style="color: var(--text-secondary);">No featured courses available.</p>
                </div>`;
                return;
            }

            // Display top 3 courses as featured
            const featured = courses.slice(0, 3);
            featured.forEach(c => {
                const card = document.createElement("div");
                card.className = "glass-card";
                card.innerHTML = `
                    <div class="course-card-body">
                        <div class="course-category">${c.category}</div>
                        <h3 class="course-title">${c.course_name}</h3>
                        <div class="course-meta">
                            <span>⏱ ${c.duration}</span>
                            <span>📶 ${c.level}</span>
                        </div>
                        <div class="course-price-row">
                            <span style="font-size: 13px; color: var(--text-muted);">Instructor: ${c.instructor_name}</span>
                            <span class="course-price">₹${c.price.toLocaleString()}</span>
                        </div>
                        <a href="courses.html" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Learn More</a>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Error fetching courses for index page:", err);
            const container = document.getElementById("featured-courses-container");
            if (container) {
                container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-color: var(--danger);">
                    <p style="color: var(--danger);">Failed to load courses from API. Is backend server running?</p>
                </div>`;
            }
        });
}


// ==================== 2. LOGIN PAGE (login.html) ====================
function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const isAdmin = document.getElementById("login-as-admin").checked;

        if (isAdmin) {
            // Check hardcoded admin credentials first
            if (email === "admin@aegis.com" && password === "admin123") {
                const adminSession = {
                    role: "admin",
                    email: email,
                    full_name: "System Administrator"
                };
                localStorage.setItem("currentUser", JSON.stringify(adminSession));
                alert("Welcome, Admin!");
                window.location.href = "admin.html";
                return;
            }
        }

        // Standard student auth via API
        fetch(`${API_BASE}/students/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }
            return data;
        })
        .then(user => {
            localStorage.setItem("currentUser", JSON.stringify(user));
            alert(`Welcome back, ${user.full_name}!`);
            
            if (user.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "dashboard.html";
            }
        })
        .catch(err => {
            alert(err.message);
        });
    });
}


// ==================== 3. REGISTER PAGE (register.html) ====================
function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const full_name = document.getElementById("full_name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const qualification = document.getElementById("qualification").value.trim();
        const password = document.getElementById("password").value;

        fetch(`${API_BASE}/students/add/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name, email, phone, qualification, password })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }
            return data;
        })
        .then(student => {
            alert("Registration successful! Please login.");
            window.location.href = "login.html";
        })
        .catch(err => {
            alert(err.message);
        });
    });
}


// ==================== 4. COURSES PAGE (courses.html) ====================
let allCoursesList = [];

function initCoursesPage() {
    const container = document.getElementById("courses-container");
    const searchInput = document.getElementById("course-search");
    const categoryFilter = document.getElementById("course-category");
    const levelFilter = document.getElementById("course-level");

    // Modal elements
    const enrollModal = document.getElementById("enroll-modal");
    const closeEnroll = document.getElementById("close-enroll-modal");
    const cancelEnroll = document.getElementById("cancel-enroll-btn");
    const confirmEnroll = document.getElementById("confirm-enroll-btn");
    let selectedCourseToEnroll = null;

    // Fetch and render courses
    function loadCourses() {
        fetch(`${API_BASE}/courses/`)
            .then(res => res.json())
            .then(courses => {
                allCoursesList = courses;
                renderCourses(courses);
            })
            .catch(err => {
                console.error("Error fetching courses:", err);
                container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-color: var(--danger);">
                    <p style="color: var(--danger);">Failed to load courses database.</p>
                </div>`;
            });
    }

    function renderCourses(courses) {
        if (!container) return;
        container.innerHTML = "";

        if (courses.length === 0) {
            container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary);">No courses matched your filters.</p>
            </div>`;
            return;
        }

        courses.forEach(c => {
            const card = document.createElement("div");
            card.className = "glass-card course-card";
            card.innerHTML = `
                <div class="course-card-body">
                    <div class="course-category">${c.category}</div>
                    <h3 class="course-title">${c.course_name}</h3>
                    <div class="course-meta">
                        <span>⏱ ${c.duration}</span>
                        <span>📶 ${c.level}</span>
                    </div>
                    <div style="margin-bottom: 20px; font-size: 14px; color: var(--text-secondary);">
                        Instructor: <strong style="color: var(--text-primary);">${c.instructor_name}</strong>
                    </div>
                    <div class="course-price-row">
                        <span class="course-price">₹${c.price.toLocaleString()}</span>
                        <button class="btn btn-primary enroll-btn" data-id="${c.course_id}">Enroll</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Set up enroll button listeners
        document.querySelectorAll(".enroll-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const cid = parseInt(e.target.getAttribute("data-id"));
                selectedCourseToEnroll = allCoursesList.find(x => x.course_id === cid);
                triggerEnrollFlow();
            });
        });
    }

    // Live search & filters logic
    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const cat = categoryFilter.value;
        const lvl = levelFilter.value;

        const filtered = allCoursesList.filter(c => {
            const matchesQuery = c.course_name.toLowerCase().includes(query) || 
                                 c.instructor_name.toLowerCase().includes(query);
            const matchesCategory = cat === "" || c.category === cat;
            const matchesLevel = lvl === "" || c.level === lvl;
            return matchesQuery && matchesCategory && matchesLevel;
        });

        renderCourses(filtered);
    }

    searchInput.addEventListener("input", applyFilters);
    categoryFilter.addEventListener("change", applyFilters);
    levelFilter.addEventListener("change", applyFilters);

    // Modal helpers
    function triggerEnrollFlow() {
        if (!currentUser) {
            alert("You must be logged in to enroll in a course.");
            window.location.href = "login.html";
            return;
        }
        if (currentUser.role === "admin") {
            alert("Administrators cannot enroll in student courses.");
            return;
        }

        // Show Modal
        document.getElementById("modal-course-title").textContent = `Enroll in "${selectedCourseToEnroll.course_name}"`;
        document.getElementById("modal-course-desc").innerHTML = `
            Category: ${selectedCourseToEnroll.category}<br>
            Duration: ${selectedCourseToEnroll.duration}<br>
            Level: ${selectedCourseToEnroll.level}<br>
            Price: <strong>₹${selectedCourseToEnroll.price.toLocaleString()}</strong><br><br>
            Are you sure you want to enroll? This will set payment status to Paid.
        `;
        enrollModal.style.display = "flex";
    }

    function closeEnrollModal() {
        enrollModal.style.display = "none";
        selectedCourseToEnroll = null;
    }

    if (closeEnroll) closeEnroll.addEventListener("click", closeEnrollModal);
    if (cancelEnroll) cancelEnroll.addEventListener("click", closeEnrollModal);

    if (confirmEnroll) {
        confirmEnroll.addEventListener("click", () => {
            if (!selectedCourseToEnroll) return;

            const enrollmentData = {
                student_name: currentUser.full_name,
                course_name: selectedCourseToEnroll.course_name,
                enrollment_date: getTodayDateString(),
                payment_status: "Paid",
                course_status: "Active",
                progress: 0
            };

            fetch(`${API_BASE}/enrollments/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(enrollmentData)
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Enrollment failed");
                }
                return data;
            })
            .then(enroll => {
                alert(`Successfully enrolled in ${selectedCourseToEnroll.course_name}!`);
                closeEnrollModal();
                window.location.href = "enrollments.html";
            })
            .catch(err => {
                alert(err.message);
                closeEnrollModal();
            });
        });
    }

    // Run loader
    loadCourses();
}


// ==================== 5. ENROLLMENTS PAGE (enrollments.html) ====================
function initEnrollmentsPage() {
    const listContainer = document.getElementById("enrollments-list-container");
    if (!listContainer) return;

    function loadEnrollments() {
        fetch(`${API_BASE}/enrollments/`)
            .then(res => res.json())
            .then(enrollments => {
                // Filter by current student
                const myEnrollments = enrollments.filter(e => e.student_name === currentUser.full_name);
                renderEnrollments(myEnrollments);
            })
            .catch(err => {
                console.error("Error loading enrollments:", err);
                listContainer.innerHTML = `<div class="glass-panel" style="padding: 40px; text-align: center; border-color: var(--danger);">
                    <p style="color: var(--danger);">Failed to load enrollments.</p>
                </div>`;
            });
    }

    function renderEnrollments(items) {
        listContainer.innerHTML = "";
        if (items.length === 0) {
            listContainer.innerHTML = `<div class="glass-panel" style="padding: 40px; text-align: center;">
                <p style="color: var(--text-secondary);">You are not enrolled in any courses yet.</p>
                <a href="courses.html" class="btn btn-primary" style="margin-top: 20px;">Browse Courses</a>
            </div>`;
            return;
        }

        items.forEach(e => {
            const card = document.createElement("div");
            card.className = "glass-panel";
            card.style.padding = "25px";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "15px";

            const progressVal = e.progress || 0;
            const isCompleted = e.course_status === "Completed";
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 5px;">${e.course_name}</h3>
                        <p style="color: var(--text-secondary); font-size: 13px;">Enrolled on: ${e.enrollment_date}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="badge badge-${e.payment_status.toLowerCase()}">Payment: ${e.payment_status}</span>
                        <span class="badge badge-${e.course_status.toLowerCase()}">${e.course_status}</span>
                    </div>
                </div>

                <!-- Progress Control (Bonus Feature) -->
                <div class="progress-container">
                    <div class="progress-header">
                        <span>Course Completion</span>
                        <strong>${progressVal}%</strong>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progressVal}%;"></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; flex-wrap: wrap; gap: 10px;">
                    <!-- Lesson Completer -->
                    <div>
                        ${!isCompleted ? 
                            `<button class="btn btn-secondary complete-lesson-btn" data-id="${e.enrollment_id}" data-progress="${progressVal}">+ Complete Lesson</button>` 
                            : `<span style="color: var(--success); font-size: 14px; font-weight: 500;">✓ Course Finished!</span>`
                        }
                    </div>

                    <!-- PDF Certificate Downloader (Bonus Feature) -->
                    <div>
                        ${isCompleted ? 
                            `<button class="btn btn-success cert-btn" data-student="${e.student_name}" data-course="${e.course_name}" data-date="${e.enrollment_date}">Download Certificate (PDF)</button>` 
                            : `<span style="color: var(--text-muted); font-size: 13px;">Complete 100% of course to unlock certificate</span>`
                        }
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        // Set up Lesson Completer listeners
        document.querySelectorAll(".complete-lesson-btn").forEach(btn => {
            btn.addEventListener("click", (evt) => {
                const eid = parseInt(evt.target.getAttribute("data-id"));
                const curProgress = parseInt(evt.target.getAttribute("data-progress"));
                incrementCourseProgress(eid, curProgress);
            });
        });

        // Set up Certificate PDF trigger listeners
        document.querySelectorAll(".cert-btn").forEach(btn => {
            btn.addEventListener("click", (evt) => {
                const student = evt.target.getAttribute("data-student");
                const course = evt.target.getAttribute("data-course");
                const date = evt.target.getAttribute("data-date");
                generatePDFCertificate(student, course, date);
            });
        });
    }

    function incrementCourseProgress(enrollmentId, currentProgress) {
        let newProgress = currentProgress + 10;
        let newStatus = "Active";

        if (newProgress >= 100) {
            newProgress = 100;
            newStatus = "Completed";
        }

        fetch(`${API_BASE}/enrollments/update/${enrollmentId}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ progress: newProgress, course_status: newStatus })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update progress");
            }
            return data;
        })
        .then(() => {
            loadEnrollments();
        })
        .catch(err => {
            alert(err.message);
        });
    }

    function generatePDFCertificate(student, course, date) {
        // Hydrate certificate template
        document.getElementById("cert-student-name").textContent = student;
        document.getElementById("cert-course-name").textContent = course;
        document.getElementById("cert-date").textContent = date;

        const element = document.getElementById("certificate-template");
        element.style.display = "block"; // Make block so html2pdf captures layout

        const opt = {
            margin:       0.2,
            filename:     `Certificate_${course.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, backgroundColor: "#0c0d14", useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        // Run pdf creator
        html2pdf().from(element).set(opt).save()
            .then(() => {
                element.style.display = "none"; // Re-hide element
            })
            .catch(err => {
                console.error("PDF generation failed:", err);
                element.style.display = "none";
                alert("Failed to render PDF certificate.");
            });
    }

    // Run loader
    loadEnrollments();
}


// ==================== 6. ASSIGNMENTS PAGE (assignments.html) ====================
function initAssignmentsPage() {
    const listTable = document.getElementById("assignments-list");
    const openModalBtn = document.getElementById("new-submission-btn");
    const modal = document.getElementById("submit-modal");
    const closeModalBtn = document.getElementById("close-submit-modal");
    const form = document.getElementById("submit-assignment-form");
    const courseSelect = document.getElementById("submit-course");

    if (!listTable) return;

    // Load list
    function loadAssignments() {
        fetch(`${API_BASE}/assignments/`)
            .then(res => res.json())
            .then(assignments => {
                // Filter by student
                const myAssignments = assignments.filter(a => a.student_name === currentUser.full_name);
                renderAssignments(myAssignments);
            })
            .catch(err => {
                console.error("Error loading assignments:", err);
                listTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load assignments directory.</td></tr>`;
            });
    }

    function renderAssignments(items) {
        listTable.innerHTML = "";
        if (items.length === 0) {
            listTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No assignment submissions found.</td></tr>`;
            return;
        }

        items.forEach(a => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.assignment_id}</td>
                <td><strong>${a.course_name}</strong></td>
                <td>${a.assignment_title}</td>
                <td>${a.submission_date}</td>
                <td>${a.status === 'Evaluated' ? `<strong>${a.marks}</strong> / 100` : '<span style="color:var(--text-muted)">-</span>'}</td>
                <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
            `;
            listTable.appendChild(tr);
        });
    }

    // Load active enrollments into submit dropdown
    function loadEnrollmentDropdown() {
        fetch(`${API_BASE}/enrollments/`)
            .then(res => res.json())
            .then(enrollments => {
                const myActive = enrollments.filter(e => e.student_name === currentUser.full_name && e.course_status === "Active");
                if (courseSelect) {
                    courseSelect.innerHTML = "";
                    if (myActive.length === 0) {
                        courseSelect.innerHTML = `<option value="">No Active Courses Available</option>`;
                        return;
                    }
                    myActive.forEach(e => {
                        const opt = document.createElement("option");
                        opt.value = e.course_name;
                        opt.textContent = e.course_name;
                        courseSelect.appendChild(opt);
                    });
                }
            });
    }

    // Modal actions
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            loadEnrollmentDropdown();
            // Pre-fill today's date
            document.getElementById("submit-date").value = getTodayDateString();
            modal.style.display = "flex";
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const course_name = courseSelect.value;
            const assignment_title = document.getElementById("submit-title").value.trim();
            const submission_date = document.getElementById("submit-date").value;

            if (!course_name) {
                alert("You must select an active course.");
                return;
            }

            const submissionData = {
                course_name,
                student_name: currentUser.full_name,
                assignment_title,
                submission_date,
                marks: 0,
                status: "Submitted"
            };

            fetch(`${API_BASE}/assignments/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData)
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Submission failed");
                }
                return data;
            })
            .then(() => {
                alert("Assignment submitted successfully!");
                modal.style.display = "none";
                form.reset();
                loadAssignments();
            })
            .catch(err => {
                alert(err.message);
            });
        });
    }

    loadAssignments();
}


// ==================== 7. STUDENT DASHBOARD (dashboard.html) ====================
function initDashboardPage() {
    const welcome = document.getElementById("welcome-student-name");
    const statTotal = document.getElementById("stat-total-courses");
    const statActive = document.getElementById("stat-active-courses");
    const statCompleted = document.getElementById("stat-completed-courses");
    const statEvaluated = document.getElementById("stat-evaluated-assignments");
    const recentActivity = document.getElementById("dashboard-recent-activity");
    const circleFill = document.getElementById("progress-circle-fill");
    const percentLabel = document.getElementById("progress-percentage-label");

    if (welcome) welcome.textContent = currentUser.full_name;

    Promise.all([
        fetch(`${API_BASE}/enrollments/`).then(res => res.json()),
        fetch(`${API_BASE}/assignments/`).then(res => res.json())
    ])
    .then(([enrollments, assignments]) => {
        // Filter by current student
        const myEnrollments = enrollments.filter(e => e.student_name === currentUser.full_name);
        const myAssignments = assignments.filter(a => a.student_name === currentUser.full_name);

        const totalCount = myEnrollments.length;
        const activeCount = myEnrollments.filter(e => e.course_status === "Active").length;
        const completedCount = myEnrollments.filter(e => e.course_status === "Completed").length;
        const gradedCount = myAssignments.filter(a => a.status === "Evaluated").length;

        // Render Stats values
        if (statTotal) statTotal.textContent = totalCount;
        if (statActive) statActive.textContent = activeCount;
        if (statCompleted) statCompleted.textContent = completedCount;
        if (statEvaluated) statEvaluated.textContent = gradedCount;

        // Calculate Average Progress (Bonus Feature)
        let totalProgress = 0;
        myEnrollments.forEach(e => {
            totalProgress += (e.progress || 0);
        });
        const averageProgress = totalCount > 0 ? Math.round(totalProgress / totalCount) : 0;

        // Update overall progress circle SVG
        if (circleFill && percentLabel) {
            percentLabel.textContent = `${averageProgress}%`;
            // SVG perimeter = 2 * PI * r = 2 * 3.14159 * 65 = 408.4.
            const strokeDashOffset = 408 - (408 * averageProgress) / 100;
            circleFill.style.strokeDashoffset = strokeDashOffset;
        }

        // Render recent activity feeds
        if (recentActivity) {
            recentActivity.innerHTML = "";
            if (myEnrollments.length === 0) {
                recentActivity.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Enroll in a course to view details.</p>`;
                return;
            }

            myEnrollments.forEach(e => {
                const row = document.createElement("div");
                row.style.padding = "15px 0";
                row.style.borderBottom = "1px solid var(--glass-border)";
                row.style.display = "flex";
                row.style.justifyContent = "space-between";
                row.style.alignItems = "center";
                row.style.flexWrap = "wrap";
                row.style.gap = "10px";

                row.innerHTML = `
                    <div>
                        <strong style="color: #fff; font-size: 15px;">${e.course_name}</strong>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Status: ${e.course_status} | Progress: ${e.progress || 0}%</div>
                    </div>
                    <a href="enrollments.html" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">Update Progress</a>
                `;
                recentActivity.appendChild(row);
            });
            if (recentActivity.lastChild) {
                recentActivity.lastChild.style.borderBottom = "none";
            }
        }
    })
    .catch(err => {
        console.error("Dashboard error loading stats", err);
    });
}


// ==================== 8. ADMIN DASHBOARD CONTROL (admin.html) ====================
let currentActiveTab = "students";
let instructorsList = [];
let studentsList = [];
let coursesList = [];

// Switch administrative tabs
window.switchTab = function(tabName) {
    currentActiveTab = tabName;
    
    // Toggle active tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.textContent.toLowerCase() === tabName.toLowerCase()) {
            btn.classList.add("active");
        }
    });

    // Toggle active pane display
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });
    document.getElementById(`tab-${tabName}`).classList.add("active");

    // Load data for selected view
    refreshAdminData();
};

function refreshAdminData() {
    switch (currentActiveTab) {
        case "students":
            loadAdminStudents();
            break;
        case "instructors":
            loadAdminInstructors();
            break;
        case "courses":
            loadAdminCourses();
            break;
        case "enrollments":
            loadAdminEnrollments();
            break;
        case "assignments":
            loadAdminAssignments();
            break;
    }
}

function initAdminPage() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Access Denied. Admins Only.");
        window.location.href = "login.html";
        return;
    }

    // Initial load directories to pre-cache reference names
    fetch(`${API_BASE}/students/`).then(res => res.json()).then(data => studentsList = data);
    fetch(`${API_BASE}/instructors/`).then(res => res.json()).then(data => instructorsList = data);
    fetch(`${API_BASE}/courses/`).then(res => res.json()).then(data => coursesList = data);

    // Load standard first view
    loadAdminStudents();
}

// Model Loaders

function loadAdminStudents() {
    fetch(`${API_BASE}/students/`)
        .then(res => res.json())
        .then(data => {
            studentsList = data;
            const body = document.getElementById("admin-students-list");
            body.innerHTML = "";
            
            if (data.length === 0) {
                body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No student records.</td></tr>`;
                return;
            }

            data.forEach(s => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${s.student_id}</td>
                    <td><strong>${s.full_name}</strong></td>
                    <td>${s.email}</td>
                    <td>${s.phone}</td>
                    <td>${s.qualification}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-icon-edit" onclick="openEditModal('student', ${s.student_id})" title="Edit">✎</button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteRecord('student', ${s.student_id})" title="Delete">🗑</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        });
}

function loadAdminInstructors() {
    fetch(`${API_BASE}/instructors/`)
        .then(res => res.json())
        .then(data => {
            instructorsList = data;
            const body = document.getElementById("admin-instructors-list");
            body.innerHTML = "";

            if (data.length === 0) {
                body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No instructor records.</td></tr>`;
                return;
            }

            data.forEach(inst => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${inst.instructor_id}</td>
                    <td><strong>${inst.instructor_name}</strong></td>
                    <td>${inst.specialization}</td>
                    <td>${inst.experience}</td>
                    <td>${inst.email}</td>
                    <td>${inst.phone}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-icon-edit" onclick="openEditModal('instructor', ${inst.instructor_id})" title="Edit">✎</button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteRecord('instructor', ${inst.instructor_id})" title="Delete">🗑</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        });
}

function loadAdminCourses() {
    fetch(`${API_BASE}/courses/`)
        .then(res => res.json())
        .then(data => {
            coursesList = data;
            const body = document.getElementById("admin-courses-list");
            body.innerHTML = "";

            if (data.length === 0) {
                body.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No courses.</td></tr>`;
                return;
            }

            data.forEach(c => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${c.course_id}</td>
                    <td><strong>${c.course_name}</strong></td>
                    <td>${c.instructor_name}</td>
                    <td>${c.category}</td>
                    <td>${c.duration}</td>
                    <td>₹${c.price.toLocaleString()}</td>
                    <td><span class="badge" style="background:rgba(255,255,255,0.06);">${c.level}</span></td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-icon-edit" onclick="openEditModal('course', ${c.course_id})" title="Edit">✎</button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteRecord('course', ${c.course_id})" title="Delete">🗑</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        });
}

function loadAdminEnrollments() {
    fetch(`${API_BASE}/enrollments/`)
        .then(res => res.json())
        .then(data => {
            const body = document.getElementById("admin-enrollments-list");
            body.innerHTML = "";

            if (data.length === 0) {
                body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No enrollment entries.</td></tr>`;
                return;
            }

            data.forEach(e => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${e.enrollment_id}</td>
                    <td><strong>${e.student_name}</strong></td>
                    <td>${e.course_name}</td>
                    <td>${e.enrollment_date}</td>
                    <td><span class="badge badge-${e.payment_status.toLowerCase()}">${e.payment_status}</span></td>
                    <td><span class="badge badge-${e.course_status.toLowerCase()}">${e.course_status} (${e.progress || 0}%)</span></td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-icon-edit" onclick="openEditModal('enrollment', ${e.enrollment_id})" title="Edit">✎</button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteRecord('enrollment', ${e.enrollment_id})" title="Delete">🗑</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        });
}

function loadAdminAssignments() {
    fetch(`${API_BASE}/assignments/`)
        .then(res => res.json())
        .then(data => {
            const body = document.getElementById("admin-assignments-list");
            body.innerHTML = "";

            if (data.length === 0) {
                body.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No assignment records.</td></tr>`;
                return;
            }

            data.forEach(a => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${a.assignment_id}</td>
                    <td><strong>${a.course_name}</strong></td>
                    <td>${a.student_name}</td>
                    <td>${a.assignment_title}</td>
                    <td>${a.submission_date}</td>
                    <td><strong>${a.marks}</strong> / 100</td>
                    <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-icon-edit" onclick="openEditModal('assignment', ${a.assignment_id})" title="Grade / Edit">✎</button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteRecord('assignment', ${a.assignment_id})" title="Delete">🗑</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        });
}

// Modal Form Controllers

window.openAddModal = function(type) {
    // Reset forms
    const form = document.getElementById(`form-${type}`);
    if (form) form.reset();

    // Hide edit identifiers & show custom ID input fields for creations
    document.getElementById(`${type}-edit-id`).value = "";
    const idField = document.getElementById(`${type}-id-field-group`);
    if (idField) idField.style.display = "block";
    
    // Student specific pwd
    const pwdGroup = document.getElementById("student-password-field-group");
    if (pwdGroup) pwdGroup.style.display = "block";

    // Load related selectors dropdowns to keep data integrated
    populateSelectors(type);

    document.getElementById(`${type}-modal-title`).textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById(`modal-${type}`).style.display = "flex";
};

window.closeModal = function(type) {
    document.getElementById(`modal-${type}`).style.display = "none";
};

function populateSelectors(type) {
    // Populates selection options in course, enrollment, and assignment forms
    if (type === "course") {
        const select = document.getElementById("course_instructor");
        select.innerHTML = "";
        instructorsList.forEach(i => {
            const opt = document.createElement("option");
            opt.value = i.instructor_name;
            opt.textContent = i.instructor_name;
            select.appendChild(opt);
        });
    } else if (type === "enrollment") {
        const studentSelect = document.getElementById("enrollment_student");
        studentSelect.innerHTML = "";
        studentsList.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.full_name;
            opt.textContent = s.full_name;
            studentSelect.appendChild(opt);
        });

        const courseSelect = document.getElementById("enrollment_course");
        courseSelect.innerHTML = "";
        coursesList.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.course_name;
            opt.textContent = c.course_name;
            courseSelect.appendChild(opt);
        });
        
        // Hide progress inputs on creation flow
        document.getElementById("enrollment-progress-group").style.display = "none";
    } else if (type === "assignment") {
        const studentSelect = document.getElementById("assignment_student");
        studentSelect.innerHTML = "";
        studentsList.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.full_name;
            opt.textContent = s.full_name;
            studentSelect.appendChild(opt);
        });

        const courseSelect = document.getElementById("assignment_course");
        courseSelect.innerHTML = "";
        coursesList.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.course_name;
            opt.textContent = c.course_name;
            courseSelect.appendChild(opt);
        });
    }
}

window.openEditModal = function(type, id) {
    const editId = parseInt(id);
    document.getElementById(`${type}-edit-id`).value = editId;

    // Load dropdown options first
    populateSelectors(type);

    // Hide manual ID entry and pwd field in edits
    const idField = document.getElementById(`${type}-id-field-group`);
    if (idField) idField.style.display = "none";

    const pwdField = document.getElementById("student-password-field-group");
    if (pwdField) pwdField.style.display = "none";

    document.getElementById(`${type}-modal-title`).textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} #${editId}`;

    // Pre-fill inputs
    if (type === "student") {
        const record = studentsList.find(x => x.student_id === editId);
        document.getElementById("student_full_name").value = record.full_name;
        document.getElementById("student_email").value = record.email;
        document.getElementById("student_phone").value = record.phone;
        document.getElementById("student_qualification").value = record.qualification;
    } else if (type === "instructor") {
        const record = instructorsList.find(x => x.instructor_id === editId);
        document.getElementById("instructor_name").value = record.instructor_name;
        document.getElementById("instructor_specialization").value = record.specialization;
        document.getElementById("instructor_experience").value = record.experience;
        document.getElementById("instructor_email").value = record.email;
        document.getElementById("instructor_phone").value = record.phone;
    } else if (type === "course") {
        const record = coursesList.find(x => x.course_id === editId);
        document.getElementById("course_name").value = record.course_name;
        document.getElementById("course_instructor").value = record.instructor_name;
        document.getElementById("course_category").value = record.category;
        document.getElementById("course_duration").value = record.duration;
        document.getElementById("course_price").value = record.price;
        document.getElementById("course_level").value = record.level;
    } else if (type === "enrollment") {
        // Show progress inputs on edit flows
        document.getElementById("enrollment-progress-group").style.display = "block";
        
        fetch(`${API_BASE}/enrollments/`)
            .then(res => res.json())
            .then(list => {
                const record = list.find(x => x.enrollment_id === editId);
                document.getElementById("enrollment_student").value = record.student_name;
                document.getElementById("enrollment_course").value = record.course_name;
                document.getElementById("enrollment_date").value = record.enrollment_date;
                document.getElementById("enrollment_payment").value = record.payment_status;
                document.getElementById("enrollment_status").value = record.course_status;
                document.getElementById("enrollment_progress").value = record.progress || 0;
            });
    } else if (type === "assignment") {
        fetch(`${API_BASE}/assignments/`)
            .then(res => res.json())
            .then(list => {
                const record = list.find(x => x.assignment_id === editId);
                document.getElementById("assignment_course").value = record.course_name;
                document.getElementById("assignment_student").value = record.student_name;
                document.getElementById("assignment_title").value = record.assignment_title;
                document.getElementById("assignment_date").value = record.submission_date;
                document.getElementById("assignment_marks").value = record.marks;
                document.getElementById("assignment_status").value = record.status;
            });
    }

    document.getElementById(`modal-${type}`).style.display = "flex";
};

// CRUD Save Trigger

window.saveRecord = function(e, type) {
    e.preventDefault();
    const editId = document.getElementById(`${type}-edit-id`).value;
    const isEdit = editId !== "";

    let url = `${API_BASE}/${type}s/`;
    let method = "POST";
    let payload = {};

    if (isEdit) {
        url += `update/${editId}/`;
        method = "PUT";
    } else {
        url += "add/";
    }

    // Extract payloads
    if (type === "student") {
        payload = {
            full_name: document.getElementById("student_full_name").value.trim(),
            email: document.getElementById("student_email").value.trim(),
            phone: document.getElementById("student_phone").value.trim(),
            qualification: document.getElementById("student_qualification").value.trim(),
        };
        if (!isEdit) {
            payload.password = document.getElementById("student_password").value;
            const cid = document.getElementById("student_id").value;
            if (cid) payload.student_id = parseInt(cid);
        }
    } else if (type === "instructor") {
        payload = {
            instructor_name: document.getElementById("instructor_name").value.trim(),
            specialization: document.getElementById("instructor_specialization").value.trim(),
            experience: parseInt(document.getElementById("instructor_experience").value),
            email: document.getElementById("instructor_email").value.trim(),
            phone: document.getElementById("instructor_phone").value.trim()
        };
        if (!isEdit) {
            const cid = document.getElementById("instructor_id").value;
            if (cid) payload.instructor_id = parseInt(cid);
        }
    } else if (type === "course") {
        payload = {
            course_name: document.getElementById("course_name").value.trim(),
            instructor_name: document.getElementById("course_instructor").value,
            category: document.getElementById("course_category").value.trim(),
            duration: document.getElementById("course_duration").value.trim(),
            price: parseFloat(document.getElementById("course_price").value),
            level: document.getElementById("course_level").value
        };
        if (!isEdit) {
            const cid = document.getElementById("course_id").value;
            if (cid) payload.course_id = parseInt(cid);
        }
    } else if (type === "enrollment") {
        payload = {
            student_name: document.getElementById("enrollment_student").value,
            course_name: document.getElementById("enrollment_course").value,
            enrollment_date: document.getElementById("enrollment_date").value,
            payment_status: document.getElementById("enrollment_payment").value,
            course_status: document.getElementById("enrollment_status").value
        };
        if (isEdit) {
            payload.progress = parseInt(document.getElementById("enrollment_progress").value || 0);
        } else {
            const cid = document.getElementById("enrollment_id").value;
            if (cid) payload.enrollment_id = parseInt(cid);
            payload.progress = 0;
        }
    } else if (type === "assignment") {
        payload = {
            course_name: document.getElementById("assignment_course").value,
            student_name: document.getElementById("assignment_student").value,
            assignment_title: document.getElementById("assignment_title").value.trim(),
            submission_date: document.getElementById("assignment_date").value,
            marks: parseInt(document.getElementById("assignment_marks").value),
            status: document.getElementById("assignment_status").value
        };
        if (!isEdit) {
            const cid = document.getElementById("assignment_id").value;
            if (cid) payload.assignment_id = parseInt(cid);
        }
    }

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Save operation failed");
        }
        return data;
    })
    .then(() => {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} details saved successfully.`);
        closeModal(type);
        refreshAdminData();
    })
    .catch(err => {
        alert(err.message);
    });
};

// CRUD Delete Trigger

window.deleteRecord = function(type, id) {
    if (!confirm(`Are you sure you want to delete ${type} #${id}?`)) return;

    fetch(`${API_BASE}/${type}s/delete/${id}/`, {
        method: "DELETE"
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Delete operation failed");
        }
        return data;
    })
    .then(() => {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} successfully deleted.`);
        refreshAdminData();
    })
    .catch(err => {
        alert(err.message);
    });
};
