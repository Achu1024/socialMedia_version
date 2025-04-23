from django.urls import path

from . import api


urlpatterns = [
    path('', api.notifications, name='notifications'),
    path('read/<uuid:pk>/', api.read_notification, name='read_notification'),
    path('read-all/', api.read_all_notifications, name='read_all_notifications'),
]