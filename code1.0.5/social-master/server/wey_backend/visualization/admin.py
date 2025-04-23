from django.contrib import admin
from .models import VisualizationLog

@admin.register(VisualizationLog)
class VisualizationLogAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'accessed_at', 'ip_address']
    list_filter = ['endpoint', 'accessed_at']
    search_fields = ['endpoint', 'ip_address']
    readonly_fields = ['endpoint', 'accessed_at', 'ip_address', 'user_agent']
