import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../store/AuthContext.jsx';
import { BookingProvider } from '../store/BookingContext.jsx';
import { CartProvider } from '../store/CartContext.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2,
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
