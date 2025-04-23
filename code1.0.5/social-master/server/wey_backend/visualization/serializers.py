from rest_framework import serializers
from .models import VisualizationLog
from post.models import Post, Comment, Like, Trend
from account.models import User, FriendshipRequest

class VisualizationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualizationLog
        fields = ['id', 'endpoint', 'accessed_at', 'ip_address']

class DateCountSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    count = serializers.IntegerField()

class MonthCountSerializer(serializers.Serializer):
    month = serializers.DateTimeField()
    count = serializers.IntegerField()

class CategoryCountSerializer(serializers.Serializer):
    category = serializers.CharField(source='personality_category')
    count = serializers.IntegerField()

class TopPostSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'body', 'likes_count', 'comments_count', 'created_by', 'created_by_name']
    
    def get_created_by_name(self, obj):
        return User.objects.get(id=obj['created_by']).name if 'created_by' in obj else None

class TrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trend
        fields = ['hashtag', 'occurences']

class NetworkNodeSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    group = serializers.IntegerField()

class NetworkLinkSerializer(serializers.Serializer):
    source = serializers.CharField()
    target = serializers.CharField()
    value = serializers.FloatField() 