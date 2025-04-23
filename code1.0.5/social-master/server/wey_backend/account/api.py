from django.conf import settings
from django.contrib.auth.forms import PasswordChangeForm
from django.core.mail import send_mail
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.db.models import Count

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

from notification.utils import create_notification

from .forms import SignupForm, ProfileForm
from .models import User, FriendshipRequest, MibtTestResult
from .serializers import UserSerializer, FriendshipRequestSerializer, MibtTestResultSerializer


@api_view(['GET'])
def me(request):
    user = request.user
    
    # 尝试获取MBTI测试结果
    try:
        mibt_result = MibtTestResult.objects.get(user=user)
        mibt_serializer = MibtTestResultSerializer(mibt_result)
        mibt_data = mibt_serializer.data
    except MibtTestResult.DoesNotExist:
        mibt_data = None
    
    print(user.is_admin)
    return JsonResponse({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'avatar': user.get_avatar(),
        'bio': user.bio,
        'mbti_result': mibt_data,
        'is_admin': user.is_admin,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def signup(request):
    data = request.data

    form = SignupForm({
        'email': data.get('email'),
        'name': data.get('name'),
        'password1': data.get('password1'),
        'password2': data.get('password2'),
    })

    if form.is_valid():
        user = form.save()
        # 直接设置用户为激活状态
        user.is_active = True
        user.save()
        
        # 生成JWT令牌
        refresh = RefreshToken.for_user(user)
        
        return JsonResponse({
            'message': 'success',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
            },
            'token': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        })
    else:
        return JsonResponse({'message': form.errors.as_json()}, safe=False)


@api_view(['GET'])
def friends(request, pk):
    user = User.objects.get(pk=pk)
    requests = []

    if user == request.user:
        requests = FriendshipRequest.objects.filter(created_for=request.user, status=FriendshipRequest.SENT)
        requests = FriendshipRequestSerializer(requests, many=True)
        requests = requests.data

    friends = user.friends.all()

    return JsonResponse({
        'user': UserSerializer(user).data,
        'friends': UserSerializer(friends, many=True).data,
        'requests': requests
    }, safe=False)


@api_view(['GET'])
def my_friendship_suggestions(request):
    serializer = UserSerializer(request.user.people_you_may_know.all(), many=True)

    return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
def editprofile(request):
    user = request.user
    name = request.data.get('name')
    bio = request.data.get('bio')
    avatar = request.FILES.get('avatar')  # 从请求文件中获取头像

    if not name:
        return JsonResponse({'message': '用户名不能为空'})

    # 更新用户信息
    user.name = name
    if bio is not None:  # 允许清空bio
        user.bio = bio
    if avatar:
        user.avatar = avatar

    user.save()
    
    return JsonResponse({
        'message': '个人资料更新成功',
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'avatar': user.get_avatar(),
            'bio': user.bio,
        }
    })


@api_view(['POST'])
def editpassword(request):
    user = request.user
    
    form = PasswordChangeForm(data=request.POST, user=user)

    if form.is_valid():
        form.save()

        return JsonResponse({'message': 'success'})
    else:
        return JsonResponse({'message': form.errors.as_json()}, safe=False)

@api_view(['POST'])
def send_friendship_request(request, pk):
    user = User.objects.get(pk=pk)

    # 检查是否已经是好友
    if request.user.friends.filter(id=user.id).exists():
        return JsonResponse({'message': 'already friends'})

    # 检查是否有未处理的好友请求
    check1 = FriendshipRequest.objects.filter(created_for=request.user, created_by=user, status=FriendshipRequest.SENT)
    check2 = FriendshipRequest.objects.filter(created_for=user, created_by=request.user, status=FriendshipRequest.SENT)

    if not check1.exists() and not check2.exists():
        friendrequest = FriendshipRequest.objects.create(created_for=user, created_by=request.user)
        notification = create_notification(request, 'new_friendrequest', friendrequest_id=friendrequest.id)
        return JsonResponse({'message': 'friendship request created'})
    else:
        return JsonResponse({'message': 'request already sent'})


@api_view(['POST'])
def handle_request(request, pk, status):
    user = User.objects.get(pk=pk)
    friendship_request = FriendshipRequest.objects.filter(created_for=request.user).get(created_by=user)
    
    if status == FriendshipRequest.ACCEPTED:
        friendship_request.status = status
        friendship_request.save()
        
        user.friends.add(request.user)
        user.friends_count = user.friends_count + 1
        user.save()

        request_user = request.user
        request_user.friends_count = request_user.friends_count + 1
        request_user.save()

        notification = create_notification(request, 'accepted_friendrequest', friendrequest_id=friendship_request.id)
        
        # 当好友请求被接受时，自动创建会话
        from chat.models import Conversation
        
        # 检查是否已存在会话
        existing_conversations = Conversation.objects.filter(users__in=list([request.user])).filter(users__in=list([user]))
        
        # 如果不存在会话则创建新会话
        if not existing_conversations.exists():
            conversation = Conversation.objects.create()
            conversation.users.add(user, request.user)
            conversation.save()
    else:
        # 如果拒绝请求，发送拒绝通知并删除原有通知和请求
        from notification.models import Notification
        
        # 删除原有的好友请求通知
        Notification.objects.filter(
            created_by=user,
            created_for=request.user,
            type_of_notification=Notification.NEWFRIENDREQUEST
        ).delete()
        
        # 发送拒绝通知
        notification = create_notification(request, 'rejected_friendrequest', friendrequest_id=friendship_request.id)
        
        # 删除好友请求记录
        friendship_request.delete()

    return JsonResponse({'message': 'friendship request updated'})

@api_view(['POST'])
def save_mibt_result(request):
    """
    保存用户的MIBT测试结果
    """
    data = request.data
    
    # 创建或更新MIBT测试结果
    mibt_result, created = MibtTestResult.objects.update_or_create(
        user=request.user,
        defaults={
            'personality_type': data.get('personality_type'),
            'personality_category': data.get('personality_category'),
            'introversion_score': data.get('introversion_score', 0),
            'extroversion_score': data.get('extroversion_score', 0),
            'intuition_score': data.get('intuition_score', 0),
            'sensing_score': data.get('sensing_score', 0),
            'thinking_score': data.get('thinking_score', 0),
            'feeling_score': data.get('feeling_score', 0),
            'judging_score': data.get('judging_score', 0),
            'perceiving_score': data.get('perceiving_score', 0),
        }
    )
    
    serializer = MibtTestResultSerializer(mibt_result)
    
    return JsonResponse({
        'message': '保存MIBT测试结果成功',
        'result': serializer.data
    })


@api_view(['GET'])
def get_mibt_result(request, user_id=None):
    """
    获取用户的MIBT测试结果
    如果未提供user_id参数，则返回当前登录用户的结果
    """
    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': '用户不存在'}, status=404)
    else:
        user = request.user
    
    try:
        mibt_result = MibtTestResult.objects.get(user=user)
        serializer = MibtTestResultSerializer(mibt_result)
        return JsonResponse(serializer.data)
    except MibtTestResult.DoesNotExist:
        return JsonResponse({'error': '该用户尚未完成MIBT测试'}, status=404)

@api_view(['GET'])
def get_mbti_statistics(request):
    """
    获取所有用户的MBTI类型分布统计
    """
    # 使用annotate和values来统计每种类型的数量
    statistics = MibtTestResult.objects.values('personality_type').annotate(
        count=Count('id')
    ).order_by('personality_type')
    
    # 转换数据格式为前端需要的格式
    result = [
        {
            'type': stat['personality_type'],
            'count': stat['count']
        }
        for stat in statistics
    ]
    
    return JsonResponse(result, safe=False)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """修改用户密码"""
    data = request.data
    
    # 验证必填字段
    if not all(key in data for key in ['old_password', 'new_password', 'confirm_password']):
        return JsonResponse({
            'success': False,
            'message': '请提供所有必需的字段'
        }, status=400)
    
    # 验证新密码和确认密码是否匹配
    if data['new_password'] != data['confirm_password']:
        return JsonResponse({
            'success': False,
            'message': '新密码和确认密码不匹配'
        }, status=400)
    
    # 验证旧密码是否正确
    if not request.user.check_password(data['old_password']):
        return JsonResponse({
            'success': False,
            'message': '旧密码不正确'
        }, status=400)
    
    # 更新密码
    request.user.set_password(data['new_password'])
    request.user.save()
    
    return JsonResponse({
        'success': True,
        'message': '密码修改成功'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request, pk):
    """删除好友关系并删除相关对话"""
    try:
        friend = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': '用户不存在'}, status=404)
    
    user = request.user
    
    # 检查是否是好友
    if not user.friends.filter(id=friend.id).exists():
        return JsonResponse({'success': False, 'message': '该用户不是你的好友'}, status=400)
    
    # 移除好友关系（双向）
    user.friends.remove(friend)
    friend.friends.remove(user)
    
    # 从"可能认识的人"中移除（双向）
    user.people_you_may_know.remove(friend)
    friend.people_you_may_know.remove(user)
    
    # 更新好友数量
    user.friends_count = max(0, user.friends_count - 1)  # 确保不会小于0
    friend.friends_count = max(0, friend.friends_count - 1)  # 确保不会小于0
    
    user.save()
    friend.save()
    
    # 删除FriendshipRequest记录（如果存在）
    try:
        # 尝试删除双向的好友请求记录
        FriendshipRequest.objects.filter(
            created_for=user, 
            created_by=friend
        ).delete()
        
        FriendshipRequest.objects.filter(
            created_for=friend, 
            created_by=user
        ).delete()
    except Exception as e:
        print(f"删除好友请求记录时出错: {str(e)}")
    
    # 删除相关的对话
    try:
        from chat.models import Conversation
        
        # 查找包含双方的对话
        conversations = Conversation.objects.filter(users=user).filter(users=friend)
        
        # 删除相关对话
        if conversations.exists():
            for conversation in conversations:
                conversation.delete()
    except Exception as e:
        # 记录错误但不阻止好友关系的删除
        print(f"删除对话时出错: {str(e)}")
    
    return JsonResponse({
        'success': True, 
        'message': '已成功删除好友关系'
    })