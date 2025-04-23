from django.db import models
from django.utils import timezone

class VisualizationLog(models.Model):
    """记录可视化接口的访问日志"""
    id = models.AutoField(primary_key=True)
    endpoint = models.CharField(max_length=255)
    accessed_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-accessed_at']
        
    def __str__(self):
        return f"{self.endpoint} - {self.accessed_at}"
