import { AuthProvider } from '../store/AuthContext.jsx';
import { BookingProvider } from '../store/BookingContext.jsx';
import { CartProvider } from '../store/CartContext.jsx';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <BookingProvider>{children}</BookingProvider>
      </CartProvider>
    </AuthProvider>
  );
}
