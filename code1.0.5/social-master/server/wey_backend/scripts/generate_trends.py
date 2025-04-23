# -*- coding: utf-8 -*-

import django
import os
import sys

from datetime import timedelta
from collections import Counter, defaultdict
from django.utils import timezone
from bs4 import BeautifulSoup
import re


sys.path.append(os.path.join(os.path.abspath(os.path.dirname(__file__)), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wey_backend.settings")
django.setup()


from post.models import Post, Trend

def extract_hashtags(text, trends_dict):
    # 首先检查文本是否包含HTML标签
    if '<' in text and '>' in text:
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(text, 'html.parser')
        # 获取所有文本内容，忽略HTML标签
        text = soup.get_text(' ', strip=True)
    
    # 使用正则表达式匹配标签
    hashtag_pattern = r'#([\w\d\u4e00-\u9fa5]+)'
    matches = re.findall(hashtag_pattern, text)
    
    for match in matches:
        trends_dict[match]['count'] += 1
    
    return trends_dict

def calculate_trend_score(post, hashtag, time_diff, user_usage_count):
    # 基础热度计算
    base_score = 1 + post.likes_count + (post.comments_count * 2)
    
    # 时间衰减 - 使用小时作为单位
    hours_old = max(1, time_diff.total_seconds() / 3600)  # 转换为小时
    time_decay = 1 / (1 + hours_old/24)  # 转换为天数
    
    # 用户重复使用衰减
    usage_decay = 1 / user_usage_count
    
    # 最终得分
    final_score = base_score * time_decay * usage_decay
    
    return final_score

# 清除所有现有趋势
for trend in Trend.objects.all():
    trend.delete()

# 初始化趋势字典
trends_dict = defaultdict(lambda: {'count': 0, 'posts': [], 'user_usage': defaultdict(int)})
now = timezone.now()
one_week = now - timedelta(days=7)

# 获取一周内的所有帖子
posts = Post.objects.filter(created_at__gte=one_week)

# 收集所有标签和相关信息
for post in posts:
    # 提取标签
    extract_hashtags(post.body, trends_dict)
    
    # 记录使用该标签的帖子
    hashtag_pattern = r'#([\w\d\u4e00-\u9fa5]+)'
    matches = re.findall(hashtag_pattern, post.body)
    for hashtag in matches:
        trends_dict[hashtag]['posts'].append(post)
        trends_dict[hashtag]['user_usage'][post.created_by.id] += 1

# 计算每个标签的最终得分
trend_scores = {}
SCALE_FACTOR = 1000  # 缩放因子，用于将浮点数转换为合适的整数

for hashtag, data in trends_dict.items():
    if data['count'] > 0:  # 只处理实际使用的标签
        total_score = 0
        for post in data['posts']:
            time_diff = now - post.created_at
            user_usage_count = data['user_usage'][post.created_by.id]
            score = calculate_trend_score(post, hashtag, time_diff, user_usage_count)
            total_score += score
            
            # 打印调试信息
            print(f"tag: {hashtag}")
            print(f"postID: {post.id}")
            print(f"baseScore: {1 + post.likes_count + (post.comments_count*2)}")
            print(f"timeDiff(hours): {time_diff.total_seconds() / 3600}")
            print(f"useTimes: {user_usage_count}")
            print(f"individualScore: {score}")
            print("---")
        
        # 将总分转换为整数
        trend_scores[hashtag] = int(total_score * SCALE_FACTOR)

# 创建新的趋势记录
for hashtag, score in sorted(trend_scores.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"finalTag: {hashtag}, initScore: {score/SCALE_FACTOR}, creditedScore: {score}")
    Trend.objects.create(hashtag=hashtag, occurences=score)