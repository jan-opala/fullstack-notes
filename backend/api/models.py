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
        return f"{self.username} ({self.id})"

class PreserveWhitespaceTextField(models.TextField):
    def get_prep_value(self, value):
        # Ensure the value is not stripped of whitespaces
        return value if value is not None else ''

class Note(models.Model):
    owner = models.ForeignKey(
        'User',
        on_delete = models.CASCADE,
        related_name = 'notes'
    )
    title = models.CharField(max_length=100)
    content = PreserveWhitespaceTextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.owner.username} ({self.owner.id}) | {self.title} | {self.content}"