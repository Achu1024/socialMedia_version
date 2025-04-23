# -*- coding: utf-8 -*-

import django
import os
import sys

from datetime import timedelta
from collections import Counter
from django.utils import timezone


sys.path.append(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wey_backend.settings")
django.setup()


from account.models import User
from post.models import Post, Like, Comment

users = User.objects.all()

for user in users:
    # Clear the suggestion list
    user.people_you_may_know.clear()
    
    print('寻找推荐好友:', user)
    
    # 基于共同好友的推荐
    friends_of_friends = Counter()
    
    for friend in user.friends.all():
        print('已经是好友:', friend)
        
        for friendsfriend in friend.friends.all():
            if friendsfriend not in user.friends.all() and friendsfriend != user:
                # 计数共同好友数量 - 共同好友越多权重越高
                friends_of_friends[friendsfriend] += 1
    
    # 基于互动的推荐 - 获取用户点赞过的帖子
    recent_posts = Post.objects.filter(created_at__gte=timezone.now() - timedelta(days=30))
    
    # 找出用户点赞过的帖子的作者
    # 查找包含了用户点赞的帖子
    liked_posts = Post.objects.filter(likes__created_by=user)
    for post in liked_posts:
        post_author = post.created_by
        if post_author not in user.friends.all() and post_author != user:
            friends_of_friends[post_author] += 2  # 点赞互动权重为2
    
    # 找出用户评论过的帖子的作者
    user_commented_posts = Comment.objects.filter(created_by=user)
    for comment in user_commented_posts:
        # 找到包含此评论的帖子
        commented_posts = Post.objects.filter(comments=comment)
        for post in commented_posts:
            post_author = post.created_by
            if post_author not in user.friends.all() and post_author != user:
                friends_of_friends[post_author] += 3  # 评论互动权重为3
    
    # 将推荐好友按权重排序并添加到推荐列表（最多10个）
    for suggested_friend, weight in friends_of_friends.most_common(10):
        user.people_you_may_know.add(suggested_friend)
        print(f'推荐好友: {suggested_friend}, 权重: {weight}')
    
    print('推荐好友完成')