from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import api
from . import admin_api

urlpatterns = [
    path('me/', api.me, name='me'),
    path('signup/', api.signup, name='signup'),
    path('send-email-code/', api.send_email_verification_code, name='send_email_verification_code'),
    path('verify-email-code/', api.verify_email_code, name='verify_email_code'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('editprofile/', api.editprofile, name='editprofile'),
    path('editpassword/', api.editpassword, name='editpassword'),
    path('friends/suggested/', api.my_friendship_suggestions, name='my_friendship_suggestions'),
    path('friends/<uuid:pk>/', api.friends, name='friends'),
    path('friends/<uuid:pk>/request/', api.send_friendship_request, name='send_friendship_request'),
    path('friends/<uuid:pk>/remove/', api.remove_friend, name='remove_friend'),
    path('friends/<uuid:pk>/<str:status>/', api.handle_request, name='handle_request'),
    
    # MIBT测试结果相关API
    path('mibt/save/', api.save_mibt_result, name='save_mibt_result'),
    path('mibt/result/', api.get_mibt_result, name='get_mibt_result'),
    path('mibt/result/<uuid:user_id>/', api.get_mibt_result, name='get_user_mibt_result'),
    path('mibt/statistics/', api.get_mbti_statistics, name='get_mbti_statistics'),
    path('change-password/', api.change_password, name='change_password'),
    
    # 管理员API
    path('admin/users/', admin_api.admin_users_list, name='admin_users_list'),
    path('admin/users/stats/', admin_api.admin_user_statistics, name='admin_user_statistics'),
    path('admin/users/create/', admin_api.admin_create_user, name='admin_create_user'),
    path('admin/users/<uuid:user_id>/', admin_api.admin_user_detail, name='admin_user_detail'),
    path('admin/users/<uuid:user_id>/update/', admin_api.admin_update_user, name='admin_update_user'),
    path('admin/users/<uuid:user_id>/delete/', admin_api.admin_delete_user, name='admin_delete_user'),
    path('admin/users/<uuid:user_id>/toggle-admin/', admin_api.admin_toggle_admin_status, name='admin_toggle_admin_status'),
    path('admin/users/<uuid:user_id>/reset-password/', admin_api.admin_reset_user_password, name='admin_reset_user_password'),
]