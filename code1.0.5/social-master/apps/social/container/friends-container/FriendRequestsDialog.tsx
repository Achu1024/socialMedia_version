import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FriendshipRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from '@/http/useFriendship';
import { getInitials } from '@/lib/utils';
import { Bell, Check, X } from 'lucide-react';
import { useState } from 'react';

interface FriendRequestsDialogProps {
  requests: FriendshipRequest[];
  isLoading: boolean;
}

export const FriendRequestsDialog = ({
  requests,
  isLoading,
}: FriendRequestsDialogProps) => {
  const [open, setOpen] = useState(false);
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const handleAccept = (userId: string) => {
    acceptRequest.mutate(userId);
  };

  const handleReject = (userId: string) => {
    rejectRequest.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='relative'>
          <Bell className='h-5 w-5 mr-2' />
          好友申请
          {requests.length > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-2 -right-2 px-1.5 h-5 min-w-5 flex items-center justify-center'
            >
              {requests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>好友申请</DialogTitle>
          <DialogDescription>
            {requests.length > 0
              ? `你有 ${requests.length} 个待处理的好友申请`
              : '暂无待处理的好友申请'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='py-10 text-center text-muted-foreground'>
            加载中...
          </div>
        ) : requests.length === 0 ? (
          <div className='py-10 text-center text-muted-foreground'>
            暂无好友申请
          </div>
        ) : (
          <div className='max-h-[60vh] overflow-auto'>
            <div className='space-y-4'>
              {requests.map((request) => (
                <div
                  key={request.id}
                  className='flex items-center justify-between p-3 bg-background rounded-lg border'
                >
                  <div className='flex items-center space-x-3'>
                    <Avatar>
                      <AvatarImage
                        src={request.created_by.get_avatar}
                        alt={request.created_by.name}
                      />
                      <AvatarFallback>
                        {getInitials(request.created_by.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-semibold'>{request.created_by.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {request.created_by.email}
                      </p>
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-green-600'
                      onClick={() => handleAccept(request.created_by.id)}
                      disabled={acceptRequest.isPending}
                    >
                      <Check className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-red-600'
                      onClick={() => handleReject(request.created_by.id)}
                      disabled={rejectRequest.isPending}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant='secondary' onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
