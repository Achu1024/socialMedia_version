from django.db.models import Q
from django.http import JsonResponse
from django.http.response import HttpResponseBadRequest

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status

from account.models import User, FriendshipRequest
from account.serializers import UserSerializer
from notification.utils import create_notification

from .forms import PostForm, AttachmentForm
from .models import Post, Like, Comment, Trend, PostReport
from .serializers import PostSerializer, PostDetailSerializer, CommentSerializer, TrendSerializer, PostReportSerializer


@api_view(['GET'])
def post_list(request):
    user_ids = [request.user.id]

    for user in request.user.friends.all():
        user_ids.append(user.id)

    # 修改查询逻辑：获取自己的所有帖子(包括私密)和好友的公开帖子
    posts = Post.objects.filter(
        Q(created_by=request.user) |  # 自己的所有帖子
        (Q(created_by_id__in=list(user_ids)) & Q(is_private=False))  # 好友的公开帖子
    )

    trend = request.GET.get('trend', '')

    if trend:
        posts = posts.filter(body__icontains='#' + trend).filter(is_private=False)

    serializer = PostSerializer(posts, many=True, context={'request': request})

    return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def post_detail(request, pk):
    user_ids = [request.user.id]

    for user in request.user.friends.all():
        user_ids.append(user.id)

    # 只能查看自己的私密帖子或任何人的公开帖子
    try:
        post = Post.objects.filter(
            Q(created_by=request.user) |  # 自己的所有帖子
            Q(is_private=False)  # 任何人的公开帖子
        ).get(pk=pk)
        
        return JsonResponse({
            'post': PostDetailSerializer(post, context={'request': request}).data
        })
    except Post.DoesNotExist:
        return JsonResponse({'error': '帖子不存在或您无权查看'}, status=404)


@api_view(['GET'])
def post_list_profile(request, id):   
    user = User.objects.get(pk=id)
    
    # 检查是否为本人
    is_self = request.user.id == user.id
    
    # 根据访问者身份过滤帖子
    if is_self:
        # 如果是本人，显示所有帖子
        posts = Post.objects.filter(created_by_id=id)
    else:
        # 如果是其他人（包括好友），只显示公开帖子
        posts = Post.objects.filter(created_by_id=id, is_private=False)

    posts_serializer = PostSerializer(posts, many=True, context={'request': request})
    user_serializer = UserSerializer(user)

    # 判断是否为好友
    is_friend = request.user in user.friends.all()
    can_send_friendship_request = True

    if is_friend:
        can_send_friendship_request = False
    
    check1 = FriendshipRequest.objects.filter(created_for=request.user).filter(created_by=user)
    check2 = FriendshipRequest.objects.filter(created_for=user).filter(created_by=request.user)

    if check1 or check2:
        can_send_friendship_request = False

    return JsonResponse({
        'posts': posts_serializer.data,
        'user': user_serializer.data,
        'can_send_friendship_request': can_send_friendship_request,
        'is_friend': is_friend
    }, safe=False)


@api_view(['GET'])
def post_list_liked(request, id):
    user = User.objects.get(pk=id)
    
    # 检查是否为本人
    is_self = request.user.id == user.id
    
    # 如果不是本人查看，且用户设置了不向其他人显示点赞内容，则返回空列表
    if not is_self and not user.show_likes_to_others:
        return JsonResponse([], safe=False)
    
    # 获取用户点赞的所有帖子
    likes = Like.objects.filter(created_by=user)
    post_ids = []
    
    # 遍历所有点赞
    for like in likes:
        if is_self:
            # 如果是查看自己的点赞，显示所有帖子
            posts = Post.objects.filter(likes=like)
        else:
            # 如果查看他人的点赞，只显示公开帖子，或自己发的私密帖子
            posts = Post.objects.filter(
                Q(likes=like) & 
                (Q(is_private=False) | Q(created_by=request.user))
            )
            
        for post in posts:
            post_ids.append(post.id)
    
    # 去重并获取帖子
    unique_post_ids = list(set(post_ids))
    liked_posts = Post.objects.filter(id__in=unique_post_ids)
    
    serializer = PostSerializer(liked_posts, many=True, context={'request': request})
    return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
def post_create(request):
    form = PostForm(request.POST)
    
    # 获取附件数量
    attachments_count = request.POST.get('attachments_count')
    
    if form.is_valid():
        post = form.save(commit=False)
        post.created_by = request.user
        post.save()
        
        # 处理多图片上传
        if attachments_count and int(attachments_count) > 0:
            try:
                # 如果有传递多个图片，使用getlist获取所有图片
                images = request.FILES.getlist('image')
                
                for image in images:
                    # 为每个图片创建一个附件对象
                    attachment_form = AttachmentForm({}, {'image': image})
                    
                    if attachment_form.is_valid():
                        attachment = attachment_form.save(commit=False)
                        attachment.created_by = request.user
                        attachment.save()
                        
                        # 添加到帖子的附件中
                        post.attachments.add(attachment)
                    else:
                        print(f"附件表单验证失败: {attachment_form.errors}")
            except Exception as e:
                print(f"处理附件时出错: {str(e)}")
                # 错误不会中断创建帖子过程，但会记录错误

        user = request.user
        user.posts_count = user.posts_count + 1
        user.save()

        serializer = PostSerializer(post, context={'request': request})

        return JsonResponse(serializer.data, safe=False)
    else:
        print(f"帖子表单验证失败: {form.errors}")
        return JsonResponse({'error': form.errors}, status=400)
    

@api_view(['POST'])
def post_like(request, pk):
    post = Post.objects.get(pk=pk)

    if not post.likes.filter(created_by=request.user):
        like = Like.objects.create(created_by=request.user)

        post = Post.objects.get(pk=pk)
        post.likes_count = post.likes_count + 1
        post.likes.add(like)
        post.save()

        notification = create_notification(request, 'post_like', post_id=post.id)

        serializer = PostSerializer(post, context={'request': request})
        return JsonResponse(serializer.data, safe=False)
    else:
        # 如果已经点赞，则取消点赞
        like = post.likes.filter(created_by=request.user).first()
        if like:
            post.likes.remove(like)
            post.likes_count = post.likes_count - 1
            post.save()
            like.delete()

        serializer = PostSerializer(post, context={'request': request})
        return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
def post_create_comment(request, pk):
    comment = Comment.objects.create(body=request.data.get('body'), created_by=request.user)

    post = Post.objects.get(pk=pk)
    post.comments.add(comment)
    post.comments_count = post.comments_count + 1
    post.save()

    notification = create_notification(request, 'post_comment', post_id=post.id)

    serializer = CommentSerializer(comment, context={'request': request})

    return JsonResponse(serializer.data, safe=False)


@api_view(['DELETE'])
def post_delete(request, pk):
    post = Post.objects.filter(created_by=request.user).get(pk=pk)
    post.delete()

    return JsonResponse({'message': 'post deleted'})


@api_view(['POST'])
def post_report(request, pk):
    try:
        post = Post.objects.get(pk=pk)
        
        # 验证请求数据
        if not request.data.get('reason'):
            return JsonResponse({'error': '请提供举报原因'}, status=400)
        
        # 检查用户是否已经举报过该帖子
        if post.reported_by_users.filter(id=request.user.id).exists():
            # 更新现有举报
            report = PostReport.objects.get(post=post, reported_by=request.user)
            report.reason = request.data.get('reason')
            report.save()
            message = '举报已更新'
        else:
            # 创建新举报记录
            report = PostReport.objects.create(
                post=post,
                reported_by=request.user,
                reason=request.data.get('reason')
            )
            # 添加到报告用户列表（保持向后兼容）
            post.reported_by_users.add(request.user)
            post.save()
            message = '举报已提交'
            
            # 可以在这里添加通知管理员的代码
        
        return JsonResponse({
            'message': message,
            'report': PostReportSerializer(report, context={'request': request}).data
        })
    except Post.DoesNotExist:
        return JsonResponse({'error': '帖子不存在'}, status=404)


@api_view(['GET'])
def get_trends(request):
    serializer = TrendSerializer(Trend.objects.order_by('-occurences')[:20], many=True)
    return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
def comment_like(request, pk, comment_id):
    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # 检查用户是否已对评论点赞
    like_exists = comment.likes.filter(created_by=request.user).exists()

    if not like_exists:
        # 创建点赞
        like = Like.objects.create(created_by=request.user)
        comment.likes.add(like)
        comment.likes_count += 1
        comment.save()
        
        # 可选：创建通知
        create_notification(request, 'comment_like', comment_id=comment.id)
    else:
        # 取消点赞
        like = comment.likes.filter(created_by=request.user).first()
        if like:
            comment.likes.remove(like)
            comment.likes_count -= 1
            comment.save()
            like.delete()

    serializer = CommentSerializer(comment, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT'])
def post_update(request, pk):
    try:
        # 确保只有帖子创建者可以更新自己的帖子
        post = Post.objects.filter(created_by=request.user).get(pk=pk)
        
        # 获取请求的is_private值
        is_private = request.data.get('is_private')
        
        # 更新帖子可见性
        if is_private is not None:
            post.is_private = is_private
            post.save()
        
        # 返回更新后的帖子数据
        serializer = PostSerializer(post, context={'request': request})
        return JsonResponse(serializer.data, safe=False)
        
    except Post.DoesNotExist:
        return JsonResponse({'error': '找不到帖子或您没有权限更新此帖子'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)