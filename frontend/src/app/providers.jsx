import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../store/AuthContext.jsx';
import { BookingProvider } from '../store/BookingContext.jsx';
import { CartProvider } from '../store/CartContext.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 20,
    },
  },
});

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BookingProvider>{children}</BookingProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
