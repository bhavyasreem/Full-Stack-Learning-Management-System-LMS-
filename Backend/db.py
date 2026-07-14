import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load local environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI is missing from the environment. Check your .env file.")

try:
    # Initialize PyMongo Client
    client = MongoClient(MONGO_URI)
    # Connect to database named "LMS_Database"
    db = client.get_database("LMS_Database")
    logger.info("Successfully connected to MongoDB Atlas.")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB Atlas: {e}")
    db = None

def get_next_id(collection_name, start_id=101):
    """
    Simulates auto-increment for custom numeric IDs.
    Finds the document with the highest ID key and returns it + 1.
    """
    if db is None:
        return start_id

    col = db[collection_name]
    
    # Map collection names to their respective custom ID field names
    id_keys = {
        'students': 'student_id',
        'instructors': 'instructor_id',
        'courses': 'course_id',
        'enrollments': 'enrollment_id',
        'assignments': 'assignment_id'
    }
    
    id_key = id_keys.get(collection_name)
    if not id_key:
        return start_id

    try:
        last_doc = col.find_one(sort=[(id_key, -1)])
        if last_doc and id_key in last_doc:
            return int(last_doc[id_key]) + 1
    except Exception as e:
        logger.error(f"Error fetching next ID for {collection_name}: {e}")
        
    return start_id

def seed_database():
    """
    Seeds the MongoDB collections with sample testing data if they are empty.
    """
    if db is None:
        logger.error("Seeding skipped: Database connection is not established.")
        return

    # 1. Seed Students
    students_col = db['students']
    if students_col.count_documents({}) == 0:
        students_col.insert_one({
            "student_id": 101,
            "full_name": "Rahul Sharma",
            "email": "rahul@gmail.com",
            "phone": "9876543210",
            "qualification": "B.Tech",
            "password": "rahul123"
        })
        logger.info("Seeded Student collection.")

    # 2. Seed Instructors
    instructors_col = db['instructors']
    if instructors_col.count_documents({}) == 0:
        instructors_col.insert_one({
            "instructor_id": 201,
            "instructor_name": "Saran Velmurugan",
            "specialization": "Full Stack Development",
            "experience": 5,
            "email": "trainer@gmail.com",
            "phone": "9876543211"
        })
        logger.info("Seeded Instructor collection.")

    # 3. Seed Courses
    courses_col = db['courses']
    courses_to_seed = [
        {
            "course_id": 301,
            "course_name": "Python Full Stack",
            "instructor_name": "Saran Velmurugan",
            "category": "Programming",
            "duration": "6 Months",
            "price": 25000,
            "level": "Beginner"
        },
        {
            "course_id": 302,
            "course_name": "Java Enterprise Edition",
            "instructor_name": "Saran Velmurugan",
            "category": "Programming",
            "duration": "4 Months",
            "price": 22000,
            "level": "Intermediate"
        },
        {
            "course_id": 303,
            "course_name": "React & Next.js Development",
            "instructor_name": "Saran Velmurugan",
            "category": "Web Development",
            "duration": "3 Months",
            "price": 18000,
            "level": "Advanced"
        },
        {
            "course_id": 304,
            "course_name": "Data Science with Python",
            "instructor_name": "Saran Velmurugan",
            "category": "Data Science",
            "duration": "6 Months",
            "price": 30000,
            "level": "Intermediate"
        },
        {
            "course_id": 305,
            "course_name": "UI/UX Design Masterclass",
            "instructor_name": "Saran Velmurugan",
            "category": "Design",
            "duration": "2 Months",
            "price": 12000,
            "level": "Beginner"
        }
    ]
    for course in courses_to_seed:
        if courses_col.count_documents({"course_id": course["course_id"]}) == 0:
            courses_col.insert_one(course)
            logger.info(f"Seeded Course: {course['course_name']}")

    # 4. Seed Enrollments
    enrollments_col = db['enrollments']
    if enrollments_col.count_documents({}) == 0:
        enrollments_col.insert_one({
            "enrollment_id": 401,
            "student_name": "Rahul Sharma",
            "course_name": "Python Full Stack",
            "enrollment_date": "2026-07-15",
            "payment_status": "Paid",
            "course_status": "Active",
            "progress": 60 # Initialize sample enrollment progress (Bonus feature)
        })
        logger.info("Seeded Enrollment collection.")

    # 5. Seed Assignments
    assignments_col = db['assignments']
    if assignments_col.count_documents({}) == 0:
        assignments_col.insert_one({
            "assignment_id": 501,
            "course_name": "Python Full Stack",
            "student_name": "Rahul Sharma",
            "assignment_title": "Student Management System",
            "submission_date": "2026-07-25",
            "marks": 95,
            "status": "Evaluated"
        })
        logger.info("Seeded Assignment collection.")

# Run seeding routine upon loading db module
try:
    seed_database()
except Exception as err:
    logger.error(f"Error seeding database: {err}")
