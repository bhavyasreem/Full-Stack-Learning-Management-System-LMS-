import urllib.request
import json
import sys

API_BASE = "http://127.0.0.1:8000"

def test_endpoint(name, path, method="GET", body=None):
    url = f"{API_BASE}{path}"
    print(f"Testing {name} [{method} {path}]...", end=" ")
    
    headers = {"Content-Type": "application/json"}
    data = None
    if body:
        data = json.dumps(body).encode("utf-8")
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            content = response.read().decode("utf-8")
            response_json = json.loads(content)
            
            if status in [200, 201]:
                print("\033[92mPASSED\033[0m")
                return response_json
            else:
                print(f"\033[91mFAILED (Status {status})\033[0m")
                print("Response:", content)
                return None
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        print(f"\033[91mHTTP ERROR {e.code}\033[0m")
        print("Response:", content)
        return None
    except Exception as e:
        print(f"\033[91mERROR: {e}\033[0m")
        return None

def run_tests():
    print("Starting LMS Django REST APIs Programmatic Verification...\n")
    
    # 1. Get initial students list
    students = test_endpoint("Get Students List", "/students/")
    if not students:
        print("\n\033[91mCould not connect to Django backend. Make sure the server is running on http://127.0.0.1:8000\033[0m")
        sys.exit(1)
        
    # 2. Test login api
    login_body = {"email": "rahul@gmail.com", "password": "rahul123"}
    test_endpoint("Student Login", "/students/login/", "POST", login_body)
    
    # 3. Test admin credentials
    admin_body = {"email": "admin@aegis.com", "password": "admin123"}
    test_endpoint("Admin Login", "/students/login/", "POST", admin_body)
    
    # 4. Get Instructors list
    test_endpoint("Get Instructors List", "/instructors/")
    
    # 5. Get Courses list
    test_endpoint("Get Courses List", "/courses/")
    
    # 6. Get Enrollments list
    test_endpoint("Get Enrollments List", "/enrollments/")
    
    # 7. Get Assignments list
    test_endpoint("Get Assignments List", "/assignments/")
    
    print("\nVerification process complete!")

if __name__ == "__main__":
    run_tests()
