from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = [
        ('USER', 'User'),
        ('ADMIN', 'Administrator'),
    ]
    role = models.CharField(
        max_length = 10,
        choices = ROLE_CHOICES,
        default = 'USER',
    )
    def __str__(self):
        return self.username

class Note(models.Model):
    owner = models.ForeignKey(
        'User',
        on_delete = models.CASCADE,
        related_name = 'notes'
    )
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.title} ({self.owner.username})"