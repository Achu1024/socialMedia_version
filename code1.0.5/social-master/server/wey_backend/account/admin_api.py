from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password
from django.db.models import Count
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta
import nanoid

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, BasePermission

from .models import User, FriendshipRequest, MibtTestResult
from .serializers import UserSerializer
from post.models import Post


class IsAdminPermission(BasePermission):
    """
    自定义权限类，检查用户是否有is_admin权限
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_users_list(request):
    """获取所有用户列表，仅限管理员访问"""
    search = request.GET.get('search', '')
    is_active = request.GET.get('is_active', None)
    is_staff = request.GET.get('is_staff', None)
    
    users = User.objects.all().order_by('-date_joined')
    
    if search:
        users = users.filter(email__icontains=search) | users.filter(name__icontains=search)
    
    if is_active is not None:
        is_active = is_active.lower() == 'true'
        users = users.filter(is_active=is_active)
        
    if is_staff is not None:
        is_staff = is_staff.lower() == 'true'
        users = users.filter(is_staff=is_staff)
    
    serializer = UserSerializer(users, many=True)
    
    # 为每个用户添加创建时间
    user_data = serializer.data
    for user in user_data:
        user['created_at'] = User.objects.get(id=user['id']).date_joined
    
    return JsonResponse({
        'users': user_data
    })


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_user_detail(request, user_id):
    """获取特定用户详情，仅限管理员访问"""
    user = get_object_or_404(User, id=user_id)
    serializer = UserSerializer(user)
    
    # 获取用户好友请求
    friendship_requests_received = FriendshipRequest.objects.filter(created_for=user)
    friendship_requests_sent = FriendshipRequest.objects.filter(created_by=user)
    
    # 获取MBTI测试结果
    try:
        mibt_result = MibtTestResult.objects.get(user=user)
        mibt_data = {
            'personality_type': mibt_result.personality_type,
            'personality_category': mibt_result.personality_category,
            'created_at': mibt_result.created_at
        }
    except MibtTestResult.DoesNotExist:
        mibt_data = None
    
    return JsonResponse({
        'user': serializer.data,
        'friendship_requests': {
            'received': friendship_requests_received.count(),
            'sent': friendship_requests_sent.count()
        },
        'mibt_result': mibt_data
    })


@api_view(['POST'])
@permission_classes([IsAdminPermission])
def admin_create_user(request):
    """创建新用户，仅限管理员访问"""
    data = request.data
    
    # 检查邮箱是否已存在
    if User.objects.filter(email=data.get('email')).exists():
        return JsonResponse({
            'success': False,
            'message': '该邮箱已被注册'
        }, status=400)
    
    # 创建新用户
    user = User.objects.create(
        email=data.get('email'),
        name=data.get('name', ''),
        password=make_password(data.get('password')),
        is_active=data.get('is_active', True),
        is_staff=data.get('is_staff', False),
        is_superuser=data.get('is_superuser', False),
        is_admin=data.get('is_admin', False)
    )
    
    serializer = UserSerializer(user)
    
    return JsonResponse({
        'success': True,
        'user': serializer.data
    }, status=201)


@api_view(['PUT'])
@permission_classes([IsAdminPermission])
def admin_update_user(request, user_id):
    """更新用户信息，仅限管理员访问"""
    user = get_object_or_404(User, id=user_id)
    data = request.data
    
    # 更新用户信息
    if 'email' in data and data['email'] != user.email:
        if User.objects.filter(email=data['email']).exists():
            return JsonResponse({
                'success': False,
                'message': '该邮箱已被注册'
            }, status=400)
        user.email = data['email']
    
    if 'name' in data:
        user.name = data['name']
        
    if 'bio' in data:
        user.bio = data['bio']
        
    if 'is_active' in data:
        # 不允许禁用管理员账号
        if user.is_admin and not data['is_active']:
            return JsonResponse({
                'success': False,
                'message': '不能禁用管理员账号'
            }, status=400)
        user.is_active = data['is_active']
        
    if 'is_staff' in data:
        user.is_staff = data['is_staff']
        
    if 'is_superuser' in data:
        user.is_superuser = data['is_superuser']
        
    if 'is_admin' in data:
        user.is_admin = data['is_admin']
    
    # 如果提供了新密码，则更新密码
    if 'password' in data and data['password']:
        user.password = make_password(data['password'])
    
    user.save()
    
    serializer = UserSerializer(user)
    
    return JsonResponse({
        'success': True,
        'user': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAdminPermission])
def admin_delete_user(request, user_id):
    """删除用户，仅限管理员访问"""
    user = get_object_or_404(User, id=user_id)
    
    # 物理删除用户
    user.delete()
    
    return JsonResponse({
        'success': True,
        'message': '用户已成功删除'
    })


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_user_statistics(request):
    """获取用户统计信息，仅限管理员访问"""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    inactive_users = User.objects.filter(is_active=False).count()
    staff_users = User.objects.filter(is_staff=True).count()
    superusers = User.objects.filter(is_superuser=True).count()
    admin_users = User.objects.filter(is_admin=True).count()
    
    # 获取最近注册的用户
    recent_users = User.objects.all().order_by('-date_joined')[:10]
    recent_users_serializer = UserSerializer(recent_users, many=True)
    
    # 按天统计新用户注册数
    thirty_days_ago = datetime.now() - timedelta(days=30)
    daily_new_users = User.objects.filter(date_joined__gte=thirty_days_ago)\
        .annotate(date=TruncDate('date_joined'))\
        .values('date')\
        .annotate(count=Count('id'))\
        .order_by('date')
    
    daily_new_users_data = [
        {'date': item['date'].strftime('%Y-%m-%d'), 'count': item['count']}
        for item in daily_new_users
    ]
    
    # 获取总帖子数
    total_posts = Post.objects.count()
    
    # 获取最受欢迎的用户（获赞最多的前50个用户）
    popular_users = []
    for user in User.objects.all():
        total_likes_received = 0
        for post in Post.objects.filter(created_by=user):
            total_likes_received += post.likes_count
        
        if total_likes_received > 0:  # 只添加有获赞的用户
            popular_users.append({
                'id': str(user.id),
                'name': user.name,
                'likes_received': total_likes_received
            })
    
    # 排序并获取前50个
    most_popular_users = sorted(popular_users, key=lambda x: x['likes_received'], reverse=True)[:50]
    
    return JsonResponse({
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': inactive_users,
        'staff_users': staff_users,
        'superusers': superusers,
        'admin_users': admin_users,
        'total_posts': total_posts,
        'recent_users': recent_users_serializer.data,
        'daily_new_users': daily_new_users_data,
        'most_popular_users': most_popular_users
    })


@api_view(['POST'])
@permission_classes([IsAdminPermission])
def admin_toggle_admin_status(request, user_id):
    """切换用户的管理员状态，仅限管理员访问"""
    user = get_object_or_404(User, id=user_id)
    data = request.data
    
    # 切换管理员状态
    is_admin = data.get('is_admin', not user.is_admin)
    user.is_admin = is_admin
    user.save()
    
    serializer = UserSerializer(user)
    
    return JsonResponse({
        'success': True,
        'message': f"用户管理员状态已更新为: {'管理员' if is_admin else '普通用户'}",
        'user': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminPermission])
def admin_reset_user_password(request, user_id):
    """重置用户密码，仅限管理员访问"""
    user = get_object_or_404(User, id=user_id)
    
    # 生成随机密码，使用nanoid
    new_password = nanoid.generate(size=10)
    
    # 更新用户密码
    user.password = make_password(new_password)
    user.save()
    
    return JsonResponse({
        'success': True,
        'message': '密码已重置',
        'new_password': new_password
    }) 