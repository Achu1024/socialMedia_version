import { Hono } from 'hono';
import type { Server as HTTPServer } from 'node:http';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { Server } from 'socket.io';

const app = new Hono().use(
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
  })
);

const httpServer = serve({
  fetch: app.fetch,
  port: 8100,
});

const io = new Server(httpServer as HTTPServer, {
  /* options */
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/socket.io/',
  transports: ['websocket'],
});

interface ChatMessage {
  sendId: string;
  converId: string;
  type: string;
  message: string;
  created_at?: string;
  conversationId?: string;
}

// 用于存储在线用户
const onlineUsers = new Map();

io.on('connection', (socket) => {
  // 连接聊天
  socket.on('connectChat', (userId: string) => {
    // 添加用户元数据
    onlineUsers.set(userId, socket.id);
    socket.join(userId);

    // 断开连接
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
    });
  });

  // 初始化聊天
  socket.on('initChat', (data: { userId: string }) => {
    // 加入用户的聊天室
    socket.join(data.userId);
  });

  // 发送消息
  socket.on('sendMessage', (data: ChatMessage) => {
    // 创建会话ID
    const { conversationId } = data;
    // 添加时间戳和会话ID
    const messageWithTimestamp = {
      ...data,
      created_at: new Date().toISOString(),
      conversationId: conversationId,
    };

    // 发送到特定会话频道
    io.emit(`chat:${conversationId}`, messageWithTimestamp);

    // 发送消息通知给所有连接的客户端
    // 这样当用户不在当前会话页面或会话不活跃时也能收到通知
    io.emit('messageNotification', {
      conversationId: conversationId,
      message: data.message,
      sendId: data.sendId,
    });
  });

  // 错误处理
  socket.on('error', () => {
    socket.emit('errorEvent', { message: '发生错误，请重试' });
  });

  // 意识感知（正在输入等状态）
  socket.on(
    'awareness',
    (data: { userId: string; targetId: string; status: string }) => {
      io.to(data.targetId).emit('awarenessUpdate', {
        userId: data.userId,
        status: data.status,
      });
    }
  );
});
