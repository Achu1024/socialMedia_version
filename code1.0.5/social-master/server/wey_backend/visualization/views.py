from django.shortcuts import render
from django.db.models import Count, Q
from django.db.models.functions import TruncDay, TruncMonth
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status

from post.models import Post, Comment, Like, Trend
from account.models import User, FriendshipRequest, MibtTestResult
from .models import VisualizationLog
from rest_framework.permissions import BasePermission
class IsAdminPermission(BasePermission):
    """
    自定义权限类，检查用户是否有is_admin权限
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


def log_visualization_access(endpoint, request):
    """记录可视化接口的访问"""
    VisualizationLog.objects.create(
        endpoint=endpoint,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def user_statistics(request):
    """用户统计数据可视化"""
    log_visualization_access('user_statistics', request)
    
    # 按日期统计用户注册数量
    users_by_date = User.objects.annotate(
        date=TruncDay('date_joined')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # 计算活跃用户和非活跃用户比例
    active_users = User.objects.filter(is_active=True).count()
    inactive_users = User.objects.filter(is_active=False).count()
    
    # MBTI人格类型分布
    personality_distribution = MibtTestResult.objects.values(
        'personality_category'
    ).annotate(
        count=Count('id')
    ).order_by('-count')
    
    return Response({
        'users_by_date': list(users_by_date),
        'active_vs_inactive': {
            'active': active_users,
            'inactive': inactive_users
        },
        'personality_distribution': list(personality_distribution),
        'total_users': User.objects.count()
    })

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def post_statistics(request):
    """帖子统计数据可视化"""
    log_visualization_access('post_statistics', request)
    
    # 按日期统计帖子发布数量
    posts_by_date = Post.objects.annotate(
        date=TruncDay('created_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # 获取点赞最多的10个帖子
    top_liked_posts = Post.objects.order_by('-likes_count')[:10].values('id', 'body', 'likes_count', 'created_by')
    
    # 获取评论最多的10个帖子
    top_commented_posts = Post.objects.order_by('-comments_count')[:10].values('id', 'body', 'comments_count', 'created_by')
    
    # 公开帖子和私密帖子的比例
    public_posts = Post.objects.filter(is_private=False).count()
    private_posts = Post.objects.filter(is_private=True).count()
    
    # 获取热门话题趋势
    trends = Trend.objects.order_by('-occurences')[:10].values('hashtag', 'occurences')
    
    return Response({
        'posts_by_date': list(posts_by_date),
        'top_liked_posts': list(top_liked_posts),
        'top_commented_posts': list(top_commented_posts),
        'public_vs_private': {
            'public': public_posts,
            'private': private_posts
        },
        'top_trends': list(trends),
        'total_posts': Post.objects.count()
    })

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def interaction_statistics(request):
    """用户互动统计数据可视化"""
    log_visualization_access('interaction_statistics', request)
    
    # 按月份统计点赞数量
    likes_by_month = Like.objects.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # 按月份统计评论数量
    comments_by_month = Comment.objects.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # 按月份统计好友请求数量
    friend_requests_by_month = FriendshipRequest.objects.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    # 好友请求状态分布
    friendship_status = FriendshipRequest.objects.values(
        'status'
    ).annotate(
        count=Count('id')
    )
    
    return Response({
        'likes_by_month': list(likes_by_month),
        'comments_by_month': list(comments_by_month),
        'friend_requests_by_month': list(friend_requests_by_month),
        'friendship_status': list(friendship_status),
        'total_likes': Like.objects.count(),
        'total_comments': Comment.objects.count()
    })

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def user_activity_summary(request):
    """普通用户的活动概览"""
    log_visualization_access('user_activity_summary', request)
    
    user = request.user
    
    # 用户发帖数量随时间变化
    user_posts_by_date = Post.objects.filter(created_by=user).annotate(
        date=TruncDay('created_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # 用户收到的点赞数量
    received_likes = 0
    for post in Post.objects.filter(created_by=user):
        received_likes += post.likes_count
    
    # 用户发出的评论数量
    comments_made = Comment.objects.filter(created_by=user).count()
    
    # 用户发出的点赞数量
    likes_given = Like.objects.filter(created_by=user).count()
    
    # 用户的好友数量
    friends_count = user.friends_count
    
    return Response({
        'posts_by_date': list(user_posts_by_date),
        'received_likes': received_likes,
        'comments_made': comments_made,
        'likes_given': likes_given,
        'friends_count': friends_count,
        'total_posts': Post.objects.filter(created_by=user).count()
    })

@api_view(['GET'])
@permission_classes([IsAdminPermission])
def user_network_visualization(request):
    """用户社交网络可视化"""
    log_visualization_access('user_network_visualization', request)
    
    user = request.user
    
    # 构建用户的社交网络图数据
    network_data = {
        'nodes': [],
        'links': []
    }
    
    # 添加当前用户为中心节点
    network_data['nodes'].append({
        'id': str(user.id),
        'name': user.name,
        'group': 1  # 中心用户组
    })
    
    # 添加直接好友
    for friend in user.friends.all():
        # 添加好友节点
        network_data['nodes'].append({
            'id': str(friend.id),
            'name': friend.name,
            'group': 2  # 直接好友组
        })
        
        # 添加连接
        network_data['links'].append({
            'source': str(user.id),
            'target': str(friend.id),
            'value': 1  # 直接连接强度
        })
        
        # 添加二级好友连接（好友的好友）
        for friend_of_friend in friend.friends.all():
            if friend_of_friend != user and friend_of_friend not in user.friends.all():
                # 检查节点是否已存在
                node_exists = False
                for node in network_data['nodes']:
                    if node['id'] == str(friend_of_friend.id):
                        node_exists = True
                        break
                
                if not node_exists:
                    network_data['nodes'].append({
                        'id': str(friend_of_friend.id),
                        'name': friend_of_friend.name,
                        'group': 3  # 二级好友组
                    })
                
                # 添加二级连接
                network_data['links'].append({
                    'source': str(friend.id),
                    'target': str(friend_of_friend.id),
                    'value': 0.5  # 二级连接强度
                })
    
    return Response(network_data)
