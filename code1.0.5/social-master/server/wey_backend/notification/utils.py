from .models import Notification

from post.models import Post, Comment
from account.models import FriendshipRequest

# create_notification(request, 'post_like', 'lskjf-j12l3-jlas-jdfa', 'lskjf-j12l3-jlas-jdfa')


def create_notification(request, type_of_notification, post_id=None, friendrequest_id=None, comment_id=None):
    created_for = None

    if type_of_notification == 'post_like':
        body = f'{request.user.name} 赞了你的推文！'
        post = Post.objects.get(pk=post_id)
        created_for = post.created_by
    elif type_of_notification == 'post_comment':
        body = f'{request.user.name} 评论了你的帖子！'
        post = Post.objects.get(pk=post_id)
        created_for = post.created_by
    elif type_of_notification == 'comment_like':
        body = f'{request.user.name} 赞了你的评论！'
        comment = Comment.objects.get(pk=comment_id)
        created_for = comment.created_by
    elif type_of_notification == 'new_friendrequest':
        friendrequest = FriendshipRequest.objects.get(pk=friendrequest_id)
        created_for = friendrequest.created_for
        body = f'{request.user.name} 向你发送了好友请求！'
    elif type_of_notification == 'accepted_friendrequest':
        friendrequest = FriendshipRequest.objects.get(pk=friendrequest_id)
        created_for = friendrequest.created_by
        body = f'{request.user.name} 接受了你的好友请求！'
    elif type_of_notification == 'rejected_friendrequest':
        friendrequest = FriendshipRequest.objects.get(pk=friendrequest_id)
        created_for = friendrequest.created_by
        body = f'{request.user.name} 拒绝了你的好友请求！'

    notification = Notification.objects.create(
        body=body,
        type_of_notification=type_of_notification,
        created_by=request.user,
        post_id=post_id,
        created_for=created_for
    )

    return notification