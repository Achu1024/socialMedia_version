from django.http import JsonResponse

from rest_framework.decorators import api_view, authentication_classes, permission_classes

from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
def notifications(request):
    received_notifications = request.user.received_notifications.filter(is_read=False)
    serializer = NotificationSerializer(received_notifications, many=True)

    return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
def read_notification(request, pk):
    notification = Notification.objects.filter(created_for=request.user).get(pk=pk)
    notification.is_read = True
    notification.save()

    return JsonResponse({'message': 'notification read'})


@api_view(['POST'])
def read_all_notifications(request):
    """将用户的所有未读通知标记为已读"""
    notifications = Notification.objects.filter(created_for=request.user, is_read=False)
    count = notifications.count()
    
    # 批量更新为已读
    notifications.update(is_read=True)
    
    return JsonResponse({
        'message': 'all notifications marked as read',
        'count': count
    })