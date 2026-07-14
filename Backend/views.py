import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from .db import db, get_next_id

# Helper to serialize MongoDB documents (handles ObjectId conversion)
def serialize_doc(doc):
    if not doc:
        return None
    # Convert doc to dict just in case
    doc = dict(doc)
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

def serialize_list(cursor):
    return [serialize_doc(doc) for doc in cursor]

# ==================== STUDENT MODULE APIs ====================

@csrf_exempt
def student_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone')
        qualification = data.get('qualification')
        password = data.get('password')

        if not all([full_name, email, phone, qualification, password]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Check if email already registered
        if db['students'].find_one({"email": email}):
            return JsonResponse({"error": "Student with this email already exists"}, status=400)

        # Handle custom integer student_id
        student_id = data.get('student_id')
        if student_id:
            student_id = int(student_id)
            if db['students'].find_one({"student_id": student_id}):
                return JsonResponse({"error": f"Student ID {student_id} is already taken"}, status=400)
        else:
            student_id = get_next_id('students', start_id=101)

        new_student = {
            "student_id": student_id,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "qualification": qualification,
            "password": password
        }

        db['students'].insert_one(new_student)
        return JsonResponse(serialize_doc(new_student), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def student_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        students = db['students'].find()
        return JsonResponse(serialize_list(students), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def student_update(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        student_id = int(id)
        
        # Check if student exists
        student = db['students'].find_one({"student_id": student_id})
        if not student:
            return JsonResponse({"error": "Student not found"}, status=404)

        # Prepare update dict
        update_fields = {}
        for field in ['full_name', 'email', 'phone', 'qualification', 'password']:
            if field in data:
                update_fields[field] = data[field]

        if update_fields:
            db['students'].update_one({"student_id": student_id}, {"$set": update_fields})
            updated_student = db['students'].find_one({"student_id": student_id})
            return JsonResponse(serialize_doc(updated_student), status=200)
        else:
            return JsonResponse({"error": "No fields to update"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def student_delete(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        student_id = int(id)
        student = db['students'].find_one({"student_id": student_id})
        if not student:
            return JsonResponse({"error": "Student not found"}, status=404)
        
        # Optional: Also remove associated enrollments / assignments?
        # Standard CRUD deletes the record
        db['students'].delete_one({"student_id": student_id})
        return JsonResponse({"message": f"Student with ID {student_id} successfully deleted"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# Custom Student/Admin Login API
@csrf_exempt
def student_login(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return JsonResponse({"error": "Email and password are required"}, status=400)

        # Hardcoded Admin credentials check
        if email == "admin@aegis.com" and password == "admin123":
            return JsonResponse({
                "role": "admin",
                "email": email,
                "full_name": "System Administrator"
            }, status=200)

        # Query Student database
        student = db['students'].find_one({"email": email, "password": password})
        if not student:
            return JsonResponse({"error": "Invalid email or password"}, status=401)

        user_data = serialize_doc(student)
        user_data["role"] = "student"
        # Hide password in response
        if "password" in user_data:
            del user_data["password"]
            
        return JsonResponse(user_data, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== INSTRUCTOR MODULE APIs ====================

@csrf_exempt
def instructor_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        instructor_name = data.get('instructor_name')
        specialization = data.get('specialization')
        experience = data.get('experience')
        email = data.get('email')
        phone = data.get('phone')

        if not all([instructor_name, specialization, experience, email, phone]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        instructor_id = data.get('instructor_id')
        if instructor_id:
            instructor_id = int(instructor_id)
            if db['instructors'].find_one({"instructor_id": instructor_id}):
                return JsonResponse({"error": f"Instructor ID {instructor_id} already exists"}, status=400)
        else:
            instructor_id = get_next_id('instructors', start_id=201)

        new_instructor = {
            "instructor_id": instructor_id,
            "instructor_name": instructor_name,
            "specialization": specialization,
            "experience": int(experience),
            "email": email,
            "phone": phone
        }

        db['instructors'].insert_one(new_instructor)
        return JsonResponse(serialize_doc(new_instructor), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def instructor_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        instructors = db['instructors'].find()
        return JsonResponse(serialize_list(instructors), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def instructor_update(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        inst_id = int(id)
        
        instructor = db['instructors'].find_one({"instructor_id": inst_id})
        if not instructor:
            return JsonResponse({"error": "Instructor not found"}, status=404)

        update_fields = {}
        for field in ['instructor_name', 'specialization', 'experience', 'email', 'phone']:
            if field in data:
                if field == 'experience':
                    update_fields[field] = int(data[field])
                else:
                    update_fields[field] = data[field]

        if update_fields:
            db['instructors'].update_one({"instructor_id": inst_id}, {"$set": update_fields})
            updated_instructor = db['instructors'].find_one({"instructor_id": inst_id})
            return JsonResponse(serialize_doc(updated_instructor), status=200)
        else:
            return JsonResponse({"error": "No fields to update"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def instructor_delete(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        inst_id = int(id)
        instructor = db['instructors'].find_one({"instructor_id": inst_id})
        if not instructor:
            return JsonResponse({"error": "Instructor not found"}, status=404)

        db['instructors'].delete_one({"instructor_id": inst_id})
        return JsonResponse({"message": f"Instructor with ID {inst_id} successfully deleted"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== COURSE MODULE APIs ====================

@csrf_exempt
def course_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        course_name = data.get('course_name')
        instructor_name = data.get('instructor_name')
        category = data.get('category')
        duration = data.get('duration')
        price = data.get('price')
        level = data.get('level')

        if not all([course_name, instructor_name, category, duration, price, level]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if level not in ['Beginner', 'Intermediate', 'Advanced']:
            return JsonResponse({"error": "Level must be Beginner, Intermediate, or Advanced"}, status=400)

        course_id = data.get('course_id')
        if course_id:
            course_id = int(course_id)
            if db['courses'].find_one({"course_id": course_id}):
                return JsonResponse({"error": f"Course ID {course_id} already exists"}, status=400)
        else:
            course_id = get_next_id('courses', start_id=301)

        new_course = {
            "course_id": course_id,
            "course_name": course_name,
            "instructor_name": instructor_name,
            "category": category,
            "duration": duration,
            "price": float(price),
            "level": level
        }

        db['courses'].insert_one(new_course)
        return JsonResponse(serialize_doc(new_course), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def course_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        courses = db['courses'].find()
        return JsonResponse(serialize_list(courses), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def course_update(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        c_id = int(id)

        course = db['courses'].find_one({"course_id": c_id})
        if not course:
            return JsonResponse({"error": "Course not found"}, status=404)

        if 'level' in data and data['level'] not in ['Beginner', 'Intermediate', 'Advanced']:
            return JsonResponse({"error": "Level must be Beginner, Intermediate, or Advanced"}, status=400)

        update_fields = {}
        for field in ['course_name', 'instructor_name', 'category', 'duration', 'price', 'level']:
            if field in data:
                if field == 'price':
                    update_fields[field] = float(data[field])
                else:
                    update_fields[field] = data[field]

        if update_fields:
            db['courses'].update_one({"course_id": c_id}, {"$set": update_fields})
            updated_course = db['courses'].find_one({"course_id": c_id})
            return JsonResponse(serialize_doc(updated_course), status=200)
        else:
            return JsonResponse({"error": "No fields to update"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def course_delete(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        c_id = int(id)
        course = db['courses'].find_one({"course_id": c_id})
        if not course:
            return JsonResponse({"error": "Course not found"}, status=404)

        db['courses'].delete_one({"course_id": c_id})
        return JsonResponse({"message": f"Course with ID {c_id} successfully deleted"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== ENROLLMENT MODULE APIs ====================

@csrf_exempt
def enrollment_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        student_name = data.get('student_name')
        course_name = data.get('course_name')
        enrollment_date = data.get('enrollment_date')
        payment_status = data.get('payment_status')
        course_status = data.get('course_status')
        progress = data.get('progress', 0) # Defaults to 0% progress

        if not all([student_name, course_name, enrollment_date, payment_status, course_status]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if payment_status not in ['Paid', 'Pending']:
            return JsonResponse({"error": "Payment status must be Paid or Pending"}, status=400)

        if course_status not in ['Active', 'Completed', 'Cancelled']:
            return JsonResponse({"error": "Course status must be Active, Completed, or Cancelled"}, status=400)

        enrollment_id = data.get('enrollment_id')
        if enrollment_id:
            enrollment_id = int(enrollment_id)
            if db['enrollments'].find_one({"enrollment_id": enrollment_id}):
                return JsonResponse({"error": f"Enrollment ID {enrollment_id} already exists"}, status=400)
        else:
            enrollment_id = get_next_id('enrollments', start_id=401)

        new_enrollment = {
            "enrollment_id": enrollment_id,
            "student_name": student_name,
            "course_name": course_name,
            "enrollment_date": enrollment_date,
            "payment_status": payment_status,
            "course_status": course_status,
            "progress": int(progress)
        }

        db['enrollments'].insert_one(new_enrollment)
        return JsonResponse(serialize_doc(new_enrollment), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def enrollment_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        enrollments = db['enrollments'].find()
        return JsonResponse(serialize_list(enrollments), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def enrollment_update(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        enroll_id = int(id)

        enrollment = db['enrollments'].find_one({"enrollment_id": enroll_id})
        if not enrollment:
            return JsonResponse({"error": "Enrollment not found"}, status=404)

        if 'payment_status' in data and data['payment_status'] not in ['Paid', 'Pending']:
            return JsonResponse({"error": "Payment status must be Paid or Pending"}, status=400)

        if 'course_status' in data and data['course_status'] not in ['Active', 'Completed', 'Cancelled']:
            return JsonResponse({"error": "Course status must be Active, Completed, or Cancelled"}, status=400)

        update_fields = {}
        for field in ['student_name', 'course_name', 'enrollment_date', 'payment_status', 'course_status', 'progress']:
            if field in data:
                if field == 'progress':
                    update_fields[field] = int(data[field])
                else:
                    update_fields[field] = data[field]

        if update_fields:
            db['enrollments'].update_one({"enrollment_id": enroll_id}, {"$set": update_fields})
            updated_enrollment = db['enrollments'].find_one({"enrollment_id": enroll_id})
            return JsonResponse(serialize_doc(updated_enrollment), status=200)
        else:
            return JsonResponse({"error": "No fields to update"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def enrollment_delete(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        enroll_id = int(id)
        enrollment = db['enrollments'].find_one({"enrollment_id": enroll_id})
        if not enrollment:
            return JsonResponse({"error": "Enrollment not found"}, status=404)

        db['enrollments'].delete_one({"enrollment_id": enroll_id})
        return JsonResponse({"message": f"Enrollment with ID {enroll_id} successfully deleted"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ==================== ASSIGNMENT MODULE APIs ====================

@csrf_exempt
def assignment_add(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        course_name = data.get('course_name')
        student_name = data.get('student_name')
        assignment_title = data.get('assignment_title')
        submission_date = data.get('submission_date')
        marks = data.get('marks', 0)
        status = data.get('status')

        if not all([course_name, student_name, assignment_title, submission_date, status]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if status not in ['Pending', 'Submitted', 'Evaluated']:
            return JsonResponse({"error": "Status must be Pending, Submitted, or Evaluated"}, status=400)

        assignment_id = data.get('assignment_id')
        if assignment_id:
            assignment_id = int(assignment_id)
            if db['assignments'].find_one({"assignment_id": assignment_id}):
                return JsonResponse({"error": f"Assignment ID {assignment_id} already exists"}, status=400)
        else:
            assignment_id = get_next_id('assignments', start_id=501)

        new_assignment = {
            "assignment_id": assignment_id,
            "course_name": course_name,
            "student_name": student_name,
            "assignment_title": assignment_title,
            "submission_date": submission_date,
            "marks": int(marks) if marks is not None else 0,
            "status": status
        }

        db['assignments'].insert_one(new_assignment)
        return JsonResponse(serialize_doc(new_assignment), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def assignment_list(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        assignments = db['assignments'].find()
        return JsonResponse(serialize_list(assignments), safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def assignment_update(request, id):
    if request.method != 'PUT':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        assign_id = int(id)

        assignment = db['assignments'].find_one({"assignment_id": assign_id})
        if not assignment:
            return JsonResponse({"error": "Assignment not found"}, status=404)

        if 'status' in data and data['status'] not in ['Pending', 'Submitted', 'Evaluated']:
            return JsonResponse({"error": "Status must be Pending, Submitted, or Evaluated"}, status=400)

        update_fields = {}
        for field in ['course_name', 'student_name', 'assignment_title', 'submission_date', 'marks', 'status']:
            if field in data:
                if field == 'marks':
                    update_fields[field] = int(data[field])
                else:
                    update_fields[field] = data[field]

        if update_fields:
            db['assignments'].update_one({"assignment_id": assign_id}, {"$set": update_fields})
            updated_assignment = db['assignments'].find_one({"assignment_id": assign_id})
            return JsonResponse(serialize_doc(updated_assignment), status=200)
        else:
            return JsonResponse({"error": "No fields to update"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def assignment_delete(request, id):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        assign_id = int(id)
        assignment = db['assignments'].find_one({"assignment_id": assign_id})
        if not assignment:
            return JsonResponse({"error": "Assignment not found"}, status=404)

        db['assignments'].delete_one({"assignment_id": assign_id})
        return JsonResponse({"message": f"Assignment with ID {assign_id} successfully deleted"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
