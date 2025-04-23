from django.urls import path

from . import api
from . import admin_api


urlpatterns = [
    path('', api.post_list, name='post_list'),
    path('<uuid:pk>/', api.post_detail, name='post_detail'),
    path('<uuid:pk>/like/', api.post_like, name='post_like'),
    path('<uuid:pk>/comment/', api.post_create_comment, name='post_create_comment'),
    path('<uuid:pk>/comments/<uuid:comment_id>/like/', api.comment_like, name='comment_like'),
    path('<uuid:pk>/delete/', api.post_delete, name='post_delete'),
    path('<uuid:pk>/report/', api.post_report, name='post_report'),
    path('<uuid:pk>/update/', api.post_update, name='post_update'),
    path('profile/<uuid:id>/', api.post_list_profile, name='post_list_profile'),
    path('profile/<uuid:id>/likes/', api.post_list_liked, name='post_list_liked'),
    path('create/', api.post_create, name='post_create'),
    path('trends/', api.get_trends, name='get_trends'),
    
    # 管理员API
    path('admin/posts/', admin_api.admin_posts_list, name='admin_posts_list'),
    path('admin/posts/stats/', admin_api.admin_post_statistics, name='admin_post_statistics'),
    path('admin/posts/create/', admin_api.admin_create_post, name='admin_create_post'),
    path('admin/posts/reports/', admin_api.admin_post_reports, name='admin_post_reports'),
    path('admin/posts/<uuid:post_id>/', admin_api.admin_post_detail, name='admin_post_detail'),
    path('admin/posts/<uuid:post_id>/update/', admin_api.admin_update_post, name='admin_update_post'),
    path('admin/posts/<uuid:post_id>/delete/', admin_api.admin_delete_post, name='admin_delete_post'),
    path('admin/posts/<uuid:post_id>/clear-reports/', admin_api.admin_clear_post_reports, name='admin_clear_post_reports'),
    path('admin/trends/<str:hashtag>/delete/', admin_api.admin_delete_trend, name='admin_delete_trend'),
    path('admin/trends/create/', admin_api.admin_create_trend, name='admin_create_trend'),
]