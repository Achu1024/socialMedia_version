from django.db.models import Count, Sum, Avg, Q, F, ExpressionWrapper, FloatField
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework import status

from post.models import Post, Comment, Like, Trend, PostReport
from account.models import User, FriendshipRequest, MibtTestResult
from .models import VisualizationLog
from .views import log_visualization_access

class IsAdminPermission(BasePermission):
    """
    自定义权限类，检查用户是否有is_admin权限
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin



@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_dashboard(request):
    """管理员仪表盘综合数据"""
    log_visualization_access('admin_dashboard', request)
    
    # 获取当前时间和30天前的时间
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # 总用户数和最近30天新增用户数
    total_users = User.objects.count()
    new_users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    
    # 总帖子数和最近30天新增帖子数
    total_posts = Post.objects.count()
    new_posts_30d = Post.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # 总点赞数和最近30天新增点赞数
    total_likes = Like.objects.count()
    new_likes_30d = Like.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # 总评论数和最近30天新增评论数
    total_comments = Comment.objects.count()
    new_comments_30d = Comment.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # 平均每用户发帖数
    avg_posts_per_user = total_posts / total_users if total_users > 0 else 0
    
    # 平均每帖子获得的点赞数
    avg_likes_per_post = total_likes / total_posts if total_posts > 0 else 0
    
    # 平均每帖子获得的评论数
    avg_comments_per_post = total_comments / total_posts if total_posts > 0 else 0
    
    # 用户活跃度 - 计算过去30天有发帖、评论或点赞的用户数
    active_user_ids = set()
    active_user_ids.update(Post.objects.filter(created_at__gte=thirty_days_ago).values_list('created_by', flat=True))
    active_user_ids.update(Comment.objects.filter(created_at__gte=thirty_days_ago).values_list('created_by', flat=True))
    active_user_ids.update(Like.objects.filter(created_at__gte=thirty_days_ago).values_list('created_by', flat=True))
    active_users_30d = len(active_user_ids)
    
    # 用户活跃率
    user_activity_rate = active_users_30d / total_users * 100 if total_users > 0 else 0
    
    # 帖子举报情况
    total_reports = PostReport.objects.count()
    new_reports_30d = PostReport.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # 按周统计数据
    weeks = []
    for i in range(4):  # 过去4周的数据
        start_date = now - timedelta(days=now.weekday(), weeks=i+1)
        end_date = start_date + timedelta(days=6)
        
        new_users = User.objects.filter(date_joined__range=(start_date, end_date)).count()
        new_posts = Post.objects.filter(created_at__range=(start_date, end_date)).count()
        new_likes = Like.objects.filter(created_at__range=(start_date, end_date)).count()
        new_comments = Comment.objects.filter(created_at__range=(start_date, end_date)).count()
        
        weeks.append({
            'week_start': start_date.strftime('%Y-%m-%d'),
            'week_end': end_date.strftime('%Y-%m-%d'),
            'new_users': new_users,
            'new_posts': new_posts,
            'new_likes': new_likes,
            'new_comments': new_comments
        })
    
    # 获取最活跃的5个用户(发帖最多)
    most_active_users = User.objects.order_by('-posts_count')[:5].values('id', 'name', 'posts_count')
    
    # 获取最受欢迎的50个用户(获赞最多)
    popular_users = []
    for user in User.objects.all():
        total_likes_received = 0
        for post in Post.objects.filter(created_by=user):
            total_likes_received += post.likes_count
        
        popular_users.append({
            'id': str(user.id),
            'name': user.name,
            'likes_received': total_likes_received
        })
    
    # 排序并获取前50个最受欢迎的用户
    most_popular_users = sorted(popular_users, key=lambda x: x['likes_received'], reverse=True)[:50]
    # 为后台展示只取前5个
    popular_users_top5 = most_popular_users[:5]
    
    return Response({
        'summary': {
            'total_users': total_users,
            'new_users_30d': new_users_30d,
            'total_posts': total_posts,
            'new_posts_30d': new_posts_30d,
            'total_likes': total_likes,
            'new_likes_30d': new_likes_30d,
            'total_comments': total_comments,
            'new_comments_30d': new_comments_30d,
            'total_reports': total_reports,
            'new_reports_30d': new_reports_30d
        },
        'averages': {
            'avg_posts_per_user': round(avg_posts_per_user, 2),
            'avg_likes_per_post': round(avg_likes_per_post, 2),
            'avg_comments_per_post': round(avg_comments_per_post, 2),
            'user_activity_rate': round(user_activity_rate, 2)
        },
        'weekly_stats': weeks,
        'top_users': {
            'most_active': list(most_active_users),
            'most_popular': popular_users_top5,
            'most_popular_all': most_popular_users
        }
    }) 

@api_view(['GET'])
def get_popular_users(request):
    """获取点赞最多的用户列表，供前端推荐使用"""
    # 获取点赞最多的用户
    popular_users = []
    for user in User.objects.all():
        total_likes_received = 0
        for post in Post.objects.filter(created_by=user):
            total_likes_received += post.likes_count
        
        popular_users.append({
            'id': str(user.id),
            'name': user.name,
            'get_avatar': user.get_avatar(),
            'posts_count': user.posts_count,
            'likes_received': total_likes_received
        })
    
    # 排序并获取前50个
    most_popular_users = sorted(popular_users, key=lambda x: x['likes_received'], reverse=True)[:50]
    
    return Response(most_popular_users) 