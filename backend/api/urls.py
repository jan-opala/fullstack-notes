from django.urls import path
from .views import UserList, NoteList, UserDetail, NoteDetail

urlpatterns = [
    path('user/', UserList.as_view()),
    path('user/<int:pk>', UserDetail.as_view()),
    path('note/', NoteList.as_view()),
    path('note/<int:pk>', NoteDetail.as_view()),
]