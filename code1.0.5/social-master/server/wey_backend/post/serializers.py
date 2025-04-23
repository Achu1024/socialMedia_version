from rest_framework import serializers

from account.serializers import UserSerializer

from .models import Post, PostAttachment, Comment, Trend, PostReport


class PostAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostAttachment
        fields = ('id', 'get_image',)


class PostSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    attachments = PostAttachmentSerializer(read_only=True, many=True)
    islike = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'body', 'is_private', 'likes_count', 'comments_count', 'created_by', 'created_at', 'created_at_formatted', 'attachments', 'islike')
    
    def get_islike(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(created_by=request.user).exists()
        return False


class CommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    islike = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'body', 'created_by', 'created_at_formatted', 'likes_count', 'islike')
    
    def get_islike(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(created_by=request.user).exists()
        return False


class PostDetailSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    comments = CommentSerializer(read_only=True, many=True)
    attachments = PostAttachmentSerializer(read_only=True, many=True)
    islike = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'body', 'likes_count', 'comments_count', 'created_by', 'created_at', 'created_at_formatted', 'comments', 'attachments', 'islike')
    
    def get_islike(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(created_by=request.user).exists()
        return False


class TrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trend
        fields = ('id', 'hashtag', 'occurences',)


class PostReportSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)

    class Meta:
        model = PostReport
        fields = ('id', 'post', 'reported_by', 'reason', 'created_at', 'created_at_formatted')