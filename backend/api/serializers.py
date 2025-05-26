from rest_framework import serializers
from .models import User, Note

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'role']
        read_only_fields = ['id', 'username', 'password', 'email', 'role']

class NoteSerializer(serializers.ModelSerializer):
    content = serializers.CharField(trim_whitespace=False)
    class Meta:
        model = Note
        fields = ['id', 'owner', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']