from django.urls import path
from . import views
from . import dashboard

urlpatterns = [
    # 管理员仪表盘
    path('admin/dashboard/', dashboard.admin_dashboard, name='admin_dashboard'),
    
    # 管理员可视化接口
    path('users/stats/', views.user_statistics, name='user_statistics'),
    path('posts/stats/', views.post_statistics, name='post_statistics'),
    path('interactions/stats/', views.interaction_statistics, name='interaction_statistics'),
    
    # 普通用户可视化接口
    path('user/activity/', views.user_activity_summary, name='user_activity_summary'),
    path('user/network/', views.user_network_visualization, name='user_network_visualization'),
    
    # 热门用户推荐接口
    path('popular-users/', dashboard.get_popular_users, name='popular_users'),
] 