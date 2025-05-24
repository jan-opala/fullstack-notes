from django.shortcuts import render, get_object_or_404, get_list_or_404
from django.core.exceptions import FieldDoesNotExist
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListCreateAPIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework import status
from .models import User, Note
from .serializers import UserSerializer, NoteSerializer
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class UserList(ListCreateAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        return queryset

class UserDetail(RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    queryset = User.objects.all()

class NoteList(ListCreateAPIView):
    serializer_class = NoteSerializer

    def get_queryset(self):
        queryset = Note.objects.all()
        owner = self.request.query_params.get('owner')
        if owner is not None:
            queryset = queryset.filter(owner=owner)
        return queryset

class NoteDetail(RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    queryset = Note.objects.all()

# AUTH

@api_view(['POST'])
def Login(request):
    user = get_object_or_404(User, username=request.data['username'])
    if not user.check_password(request.data['password']):
        return Response({"detail": "No User matches the given query."}, status=status.HTTP_404_NOT_FOUND)
    token, created = Token.objects.get_or_create(user=user)
    serializer = UserSerializer(instance=user)
    response = JsonResponse({'detail': 'Login successful'})
    response.set_cookie(
        key = 'token',
        value = token,
        httponly = True,
        secure = False,
        samesite = 'Lax',
        max_age = 3600*24*7,
    )
    return response

@api_view(['POST'])
def Register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        user = User.objects.get(username=request.data['username'])
        user.set_password(request.data['password'])
        user.save()
        token = Token.objects.create(user=user)
        return Response({"token": token.key, "user": serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) # Dodać więcej błędów!

@api_view(['GET'])
def TestToken(request):
    token_key = request.COOKIES.get('token')
    
    if not token_key:
        return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        token = Token.objects.get(key=token_key)
        user = token.user
    except Token.DoesNotExist:
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(f"passed")

@api_view(['GET'])
def UserNoteList(request):
    token_key = request.COOKIES.get('token')
    
    if not token_key:
        return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        token = Token.objects.get(key=token_key)
        user = token.user
        user_id = user.id
        notes = get_list_or_404(Note, owner=user_id)
        try:
            serializer = NoteSerializer(notes, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(e)
            print(e)
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Token.DoesNotExist:
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_401_UNAUTHORIZED)
    
@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def UpdateNote(request):
    try:
        user_id = request.user.id
        note_id = request.data['id']
        
        note = get_object_or_404(Note, owner=user_id, id=note_id)
        serializer = NoteSerializer(note, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        if str(e) == "No Note matches the given query.":
            return Response(status=status.HTTP_404_NOT_FOUND)
        logger.error(e)
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def NewNote(request):
    try:
        user = request.user
        try:
            title = request.data['title']
        except:
            title = "New note"
        try:
            content = request.data['content']
        except:
            content = ""
        serializer = NoteSerializer(data={"title": title, "content": content})
        if not serializer.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST)
        serializer.save(owner=user)
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        if str(e) == "No Note matches the given query.":
            return Response(status=status.HTTP_404_NOT_FOUND)
        logger.error(e)
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def DeleteNote(request):
    try:
        user_id = request.user.id
        note_id = request.data["id"]
        note = get_object_or_404(Note, owner=user_id, id=note_id)
        note.delete()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        if str(e) == "No Note matches the given query.":
            return Response(status=status.HTTP_404_NOT_FOUND)
        logger.error(e)
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)