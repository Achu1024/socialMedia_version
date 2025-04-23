from django.contrib import admin

from .models import Post, PostAttachment, PostReport


admin.site.register(Post)
admin.site.register(PostAttachment)
admin.site.register(PostReport)