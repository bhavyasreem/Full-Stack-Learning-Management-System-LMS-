from django.urls import path
from . import views

urlpatterns = [
    # Student Management APIs
    path('students/add/', views.student_add, name='student_add'),
    path('students/', views.student_list, name='student_list'),
    path('students/update/<int:id>/', views.student_update, name='student_update'),
    path('students/delete/<int:id>/', views.student_delete, name='student_delete'),
    path('students/login/', views.student_login, name='student_login'),  # Custom login route

    # Instructor Management APIs
    path('instructors/add/', views.instructor_add, name='instructor_add'),
    path('instructors/', views.instructor_list, name='instructor_list'),
    path('instructors/update/<int:id>/', views.instructor_update, name='instructor_update'),
    path('instructors/delete/<int:id>/', views.instructor_delete, name='instructor_delete'),

    # Course Management APIs
    path('courses/add/', views.course_add, name='course_add'),
    path('courses/', views.course_list, name='course_list'),
    path('courses/update/<int:id>/', views.course_update, name='course_update'),
    path('courses/delete/<int:id>/', views.course_delete, name='course_delete'),

    # Enrollment Management APIs
    path('enrollments/add/', views.enrollment_add, name='enrollment_add'),
    path('enrollments/', views.enrollment_list, name='enrollment_list'),
    path('enrollments/update/<int:id>/', views.enrollment_update, name='enrollment_update'),
    path('enrollments/delete/<int:id>/', views.enrollment_delete, name='enrollment_delete'),

    # Assignment Management APIs
    path('assignments/add/', views.assignment_add, name='assignment_add'),
    path('assignments/', views.assignment_list, name='assignment_list'),
    path('assignments/update/<int:id>/', views.assignment_update, name='assignment_update'),
    path('assignments/delete/<int:id>/', views.assignment_delete, name='assignment_delete'),
]
