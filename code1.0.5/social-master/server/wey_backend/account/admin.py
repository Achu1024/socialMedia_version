from django.contrib import admin
from .models import User, FriendshipRequest, MibtTestResult

class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_active', 'is_staff', 'is_superuser', 'is_admin', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'is_admin')
    search_fields = ('email', 'name')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('个人信息', {'fields': ('name', 'avatar', 'bio')}),
        ('社交数据', {'fields': ('friends', 'friends_count', 'posts_count')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_admin')}),
        ('重要日期', {'fields': ('date_joined', 'last_login')}),
    )
    readonly_fields = ('date_joined', 'last_login', 'friends_count', 'posts_count')

class FriendshipRequestAdmin(admin.ModelAdmin):
    list_display = ('created_by', 'created_for', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('created_by__email', 'created_for__email')
    ordering = ('-created_at',)

class MibtTestResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'personality_type', 'personality_category', 'created_at')
    list_filter = ('personality_category',)
    search_fields = ('user__email', 'personality_type')
    ordering = ('-created_at',)

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(FriendshipRequest, FriendshipRequestAdmin)
admin.site.register(MibtTestResult, MibtTestResultAdmin)
