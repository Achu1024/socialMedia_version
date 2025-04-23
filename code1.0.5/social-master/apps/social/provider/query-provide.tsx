'use client';

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// 创建查询客户端
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000 * 5,
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        refetchInterval: 60 * 1000 * 5,
        refetchIntervalInBackground: true,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * ### 获取查询客户端
 * @returns QueryClient
 */
function getQueryClient() {
  // 服务端：总是创建一个新的查询客户端
  if (isServer) return makeQueryClient();

  // 浏览器：如果还没有查询客户端，则创建一个新的查询客户端
  // 这是非常重要的，所以如果React在初始渲染期间暂停，我们不会重新创建一个新的客户端
  // 如果我们在创建查询客户端和可能暂停的代码之间有一个 suspense 边界，这可能不是必需的
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: 避免在初始化查询客户端时使用 useState，如果代码中没有 suspense 边界
  //       因为 React 会在初始渲染期间抛出客户端，如果它暂停并且没有边界
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
