import { createContext, useContext, useMemo, useState } from 'react';

const BookingContext = createContext(null);
const initialBooking = {
  service: null,
  staff: null,
  date: '',
  time: '',
  notes: '',
};

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(initialBooking);
  const updateBooking = (patch) => setBooking((current) => ({ ...current, ...patch }));
  const resetBooking = () => setBooking(initialBooking);
  const value = useMemo(() => ({ booking, updateBooking, resetBooking }), [booking]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  return useContext(BookingContext);
}
