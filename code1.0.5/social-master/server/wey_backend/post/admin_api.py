from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils.timesince import timesince
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from account.admin_api import IsAdminPermission
from account.models import User
from account.serializers import UserSerializer

from .models import Post, Comment, Like, PostAttachment, Trend, PostReport
from .serializers import PostSerializer, PostDetailSerializer, PostAttachmentSerializer, PostReportSerializer
from .forms import PostForm, AttachmentForm


class PostPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_posts_list(request):
    """获取所有帖子列表，包括筛选和排序功能，仅限管理员访问"""
    search = request.GET.get('search', '')
    user_id = request.GET.get('user_id', None)
    is_private = request.GET.get('is_private', None)
    has_reports = request.GET.get('has_reports', None)
    sort_by = request.GET.get('sort_by', '-created_at')  # 默认按创建时间降序排序
    
    posts = Post.objects.all()
    
    # 搜索功能
    if search:
        posts = posts.filter(
            Q(body__icontains=search) | 
            Q(created_by__name__icontains=search) |
            Q(created_by__email__icontains=search)
        )
    
    # 按用户筛选
    if user_id:
        posts = posts.filter(created_by_id=user_id)
    
    # 按是否私密筛选
    if is_private is not None:
        is_private = is_private.lower() == 'true'
        posts = posts.filter(is_private=is_private)
    
    # 按是否被举报筛选
    if has_reports is not None:
        has_reports = has_reports.lower() == 'true'
        if has_reports:
            posts = posts.annotate(report_count=Count('reported_by_users')).filter(report_count__gt=0)
        else:
            posts = posts.annotate(report_count=Count('reported_by_users')).filter(report_count=0)
    
    # 排序
    valid_sort_fields = [
        'created_at', '-created_at',
        'likes_count', '-likes_count',
        'comments_count', '-comments_count'
    ]
    if sort_by in valid_sort_fields:
        posts = posts.order_by(sort_by)
    else:
        posts = posts.order_by('-created_at')  # 默认排序
    
    # 分页
    paginator = PostPagination()
    result_page = paginator.paginate_queryset(posts, request)
    serializer = PostSerializer(result_page, many=True, context={'request': request})
    
    # 为每个帖子添加报告计数
    post_data = serializer.data
    for post in post_data:
        post_obj = Post.objects.get(id=post['id'])
        post['reports_count'] = post_obj.reported_by_users.count()
    
    return paginator.get_paginated_response({
        'posts': post_data
    })


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_post_detail(request, post_id):
    """获取特定帖子详情，仅限管理员访问"""
    post = get_object_or_404(Post, id=post_id)
    serializer = PostDetailSerializer(post, context={'request': request})
    
    # 获取举报该帖子的用户列表
    reported_by = post.reported_by_users.all()
    reported_by_serializer = UserSerializer(reported_by, many=True)
    
    data = serializer.data
    data['reports'] = {
        'count': reported_by.count(),
        'users': reported_by_serializer.data
    }
    
    return JsonResponse({
        'post': data
    })


@api_view(['POST'])
@permission_classes([IsAdminPermission])
def admin_create_post(request):
    """管理员创建帖子，可以指定发帖用户"""
    data = request.data
    
    # 获取创建用户
    user_id = data.get('user_id', None)
    if user_id:
        user = get_object_or_404(User, id=user_id)
    else:
        user = request.user
    
    # 创建帖子
    post = Post.objects.create(
        body=data.get('body', ''),
        is_private=data.get('is_private', False),
        created_by=user
    )
    
    # 处理附件
    attachments = data.get('attachments', [])
    for attachment_id in attachments:
        try:
            attachment = PostAttachment.objects.get(id=attachment_id)
            post.attachments.add(attachment)
        except PostAttachment.DoesNotExist:
            pass
    
    post.save()
    
    serializer = PostDetailSerializer(post, context={'request': request})
    
    return JsonResponse({
        'success': True,
        'post': serializer.data
    }, status=201)


@api_view(['PUT'])
@permission_classes([IsAdminPermission])
def admin_update_post(request, post_id):
    """管理员更新帖子内容"""
    post = get_object_or_404(Post, id=post_id)
    data = request.data
    
    # 更新帖子内容
    if 'body' in data:
        post.body = data['body']
    
    if 'is_private' in data:
        post.is_private = data['is_private']
    
    # 处理附件
    if 'attachments' in data:
        # 清除现有附件
        post.attachments.clear()
        
        # 添加新附件
        for attachment_id in data['attachments']:
            try:
                attachment = PostAttachment.objects.get(id=attachment_id)
                post.attachments.add(attachment)
            except PostAttachment.DoesNotExist:
                pass
    
    post.save()
    
    serializer = PostDetailSerializer(post, context={'request': request})
    
    return JsonResponse({
        'success': True,
        'post': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAdminPermission])
def admin_delete_post(request, post_id):
    """管理员删除帖子"""
    post = get_object_or_404(Post, id=post_id)
    
    # 删除帖子
    post.delete()
    
    return JsonResponse({
        'success': True,
        'message': '帖子已成功删除'
    })


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_post_reports(request):
    """获取所有被举报的帖子及详细举报信息"""
    # 查找有举报记录的帖子
    reported_posts = Post.objects.filter(reports__isnull=False).distinct()
    
    # 分页
    paginator = PostPagination()
    result_page = paginator.paginate_queryset(reported_posts, request)
    post_serializer = PostSerializer(result_page, many=True, context={'request': request})
    
    # 获取每个帖子的举报详情
    posts_data = []
    for post in post_serializer.data:
        post_obj = Post.objects.get(id=post['id'])
        reports = PostReport.objects.filter(post=post_obj)
        report_serializer = PostReportSerializer(reports, many=True, context={'request': request})
        
        post_with_reports = {
            'post': post,
            'reports_count': reports.count(),
            'reports': report_serializer.data
        }
        posts_data.append(post_with_reports)
    
    return paginator.get_paginated_response({
        'reported_posts': posts_data
    })


@api_view(['POST'])
@permission_classes([IsAdminPermission])
def admin_clear_post_reports(request, post_id):
    """管理员清除帖子的所有举报"""
    post = get_object_or_404(Post, id=post_id)
    
    # 清除所有举报记录
    reports_count = PostReport.objects.filter(post=post).count()
    PostReport.objects.filter(post=post).delete()
    
    # 清除reported_by_users列表
    user_reports_count = post.reported_by_users.count()
    post.reported_by_users.clear()
    
    return JsonResponse({
        'message': f'已清除该帖子的{reports_count}条举报',
        'user_reports_cleared': user_reports_count
    })


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def admin_post_statistics(request):
    """获取帖子统计信息，仅限管理员访问"""
    total_posts = Post.objects.count()
    private_posts = Post.objects.filter(is_private=True).count()
    public_posts = Post.objects.filter(is_private=False).count()
    reported_posts = Post.objects.annotate(report_count=Count('reported_by_users')).filter(report_count__gt=0).count()
    
    # 获取最近发布的帖子
    recent_posts = Post.objects.order_by('-created_at')[:5]
    recent_posts_serializer = PostSerializer(recent_posts, many=True, context={'request': request})
    
    # 获取最多评论的帖子
    most_commented = Post.objects.order_by('-comments_count')[:5]
    most_commented_serializer = PostSerializer(most_commented, many=True, context={'request': request})
    
    # 获取最多点赞的帖子
    most_liked = Post.objects.order_by('-likes_count')[:5]
    most_liked_serializer = PostSerializer(most_liked, many=True, context={'request': request})
    
    # 获取热门话题
    trends = Trend.objects.order_by('-occurences')[:50]
    trends_data = [{'hashtag': trend.hashtag, 'occurences': trend.occurences} for trend in trends]
    
    return JsonResponse({
        'total_posts': total_posts,
        'private_posts': private_posts,
        'public_posts': public_posts, 
        'reported_posts': reported_posts,
        'recent_posts': recent_posts_serializer.data,
        'most_commented': most_commented_serializer.data,
        'most_liked': most_liked_serializer.data,
        'trends': trends_data
    })


@api_view(['DELETE'])
@permission_classes([IsAdminPermission])
def admin_delete_trend(request, hashtag):
    """管理员删除热门话题"""
    try:
        trend = Trend.objects.get(hashtag=hashtag)
        trend.delete()
        return JsonResponse({
            'success': True,
            'message': f'热门话题 #{hashtag} 已成功删除'
        })
    except Trend.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': f'热门话题 #{hashtag} 不存在'
        }, status=404)


@api_view(['POST'])
@permission_classes([IsAdminPermission])
def admin_create_trend(request):
    """管理员创建或更新热门话题"""
    data = request.data
    hashtag = data.get('hashtag', '').strip()
    occurences = data.get('occurences', 1000)  # 默认热度值
    
    if not hashtag:
        return JsonResponse({
            'success': False,
            'message': '话题标签不能为空'
        }, status=400)
    
    # 删除井号前缀（如果有）
    if hashtag.startswith('#'):
        hashtag = hashtag[1:]
    
    # 创建或更新话题
    trend, created = Trend.objects.update_or_create(
        hashtag=hashtag,
        defaults={'occurences': occurences}
    )
    
    # 如果更新的是现有话题，将其热度设为最高
    if not created:
        highest_trend = Trend.objects.order_by('-occurences').first()
        if highest_trend and highest_trend.id != trend.id:
            trend.occurences = highest_trend.occurences + 10
            trend.save()
    
    action = '创建' if created else '更新'
    
    return JsonResponse({
        'success': True,
        'message': f'热门话题 #{hashtag} 已成功{action}',
        'trend': {
            'hashtag': trend.hashtag,
            'occurences': trend.occurences
        }
    }, status=201 if created else 200) 


@api_view(['DELETE'])
@permission_classes([IsAdminPermission])
def admin_delete_comment(request, post_id, comment_id):
    """管理员删除帖子的评论"""
    post = get_object_or_404(Post, id=post_id)
    comment = get_object_or_404(Comment, id=comment_id)
    
    # 确保要删除的评论属于指定的帖子
    if comment not in post.comments.all():
        return JsonResponse({
            'success': False,
            'message': '评论不属于指定帖子'
        }, status=400)
    
    # 从帖子的评论中移除该评论
    post.comments.remove(comment)
    
    # 更新帖子的评论计数
    post.comments_count = post.comments.count()
    post.save()
    
    # 删除评论
    comment.delete()
    
    return JsonResponse({
        'success': True,
        'message': '评论已成功删除'
    }) 