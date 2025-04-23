from django.db.models import Q
from django.http import JsonResponse

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from account.models import User
from account.serializers import UserSerializer
from post.models import Post
from post.serializers import PostSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['POST'])
def search(request):
    data = request.data
    query = data['query']
    user_ids = [request.user.id]

    for user in request.user.friends.all():
        user_ids.append(user.id)

    users = User.objects.filter(name__icontains=query)
    users_serializer = UserSerializer(users, many=True)

    posts = Post.objects.filter(
        Q(body__icontains=query, is_private=False) | 
        Q(created_by_id__in=list(user_ids), body__icontains=query)
    )

    posts_serializer = PostSerializer(posts, many=True)

    return JsonResponse({
        'users': users_serializer.data,
        'posts': posts_serializer.data
    }, safe=False)

@api_view(['POST'])
def search_posts_paginated(request):
    data = request.data
    query = data.get('query', '')
    
    # 从请求体中获取分页参数
    page = data.get('page', 1)
    page_size = data.get('page_size', 10)
    
    # 确保 page 和 page_size 是整数类型
    try:
        page = int(page)
        page_size = int(page_size)
    except (ValueError, TypeError):
        page = 1
        page_size = 10
    
    # 仅使用当前用户ID，移除好友ID的收集
    user_id = request.user.id

    # 修改搜索逻辑：公开帖子或用户自己的私密帖子
    posts = Post.objects.filter(
        Q(body__icontains=query, is_private=False) | 
        Q(created_by_id=user_id, body__icontains=query)
    ).distinct().order_by('-created_at')  
    
    # 关键修复：只修改 request._request.GET，不尝试设置 query_params
    from django.http.request import QueryDict
    query_params = QueryDict('', mutable=True)
    query_params['page'] = str(page)
    query_params['page_size'] = str(page_size)
    
    # 只修改底层的 request.GET
    request._request.GET = query_params
    
    paginator = StandardResultsSetPagination()
    result_page = paginator.paginate_queryset(posts, request)
    
    # 额外调试，打印分页结果
        
    posts_serializer = PostSerializer(result_page, many=True, context={'request': request})
    
    response = paginator.get_paginated_response(posts_serializer.data)
    response.data['total_count'] = posts.count()
    response.data['current_page'] = page  # 添加当前页码信息便于调试
    return response