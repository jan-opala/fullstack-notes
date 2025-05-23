from django.urls import path
from .views import Register, Login, TestToken, UserNoteList, UpdateNote, NewNote, DeleteNote, UserList, NoteList, UserDetail, NoteDetail

urlpatterns = [
    # path('user/', UserList.as_view()),
    # path('user/<int:pk>', UserDetail.as_view()),
    # path('note/', NoteList.as_view()),
    # path('note/<int:pk>', NoteDetail.as_view()),
    path('register', Register),
    path('login', Login),
    path('test-token', TestToken),
    path('my-notes', UserNoteList),
    path('update-note', UpdateNote),
    path('new-note', NewNote),
    path('delete-note', DeleteNote),
]