from rest_framework import serializers

from .models import User, FriendshipRequest, MibtTestResult


class MibtTestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MibtTestResult
        fields = (
            'id', 
            'personality_type', 
            'personality_category',
            'introversion_score',
            'extroversion_score',
            'intuition_score',
            'sensing_score',
            'thinking_score',
            'feeling_score',
            'judging_score',
            'perceiving_score',
            'created_at'
        )


class UserSerializer(serializers.ModelSerializer):
    mbti_result = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'friends_count', 'posts_count', 'get_avatar', 'bio', 'mbti_result', 'is_admin', 'is_active', 'date_joined')
    
    def get_mbti_result(self, obj):
        try:
            mibt_result = MibtTestResult.objects.get(user=obj)
            return MibtTestResultSerializer(mibt_result).data
        except MibtTestResult.DoesNotExist:
            return None


class FriendshipRequestSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = FriendshipRequest
        fields = ('id', 'created_by', 'created_at', 'status', 'message')