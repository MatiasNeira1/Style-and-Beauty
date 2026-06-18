export const RESERVATION_DEPOSIT_CLP = 10000;

export function formatCLP(value = 0) {
  const number = Number(value);
  const amount = Number.isFinite(number) ? Math.round(number) : 0;
  return `$${new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    useGrouping: true,
  }).format(amount)}`;
}

export function isReservationCartItem(item) {
  return item?.type === 'reservation';
}

export function getCartItemServiceValue(item) {
  const value = [
    item?.serviceValue,
    item?.valorServicio,
    item?.price,
    item?.precio,
    item?.service?.precio_total,
    item?.service?.precio,
    item?.service?.price,
  ].find((candidate) => candidate !== undefined && candidate !== null && candidate !== '');

  return Number(value) || 0;
}

export function getReservationDeposit(item) {
  const value = item?.abono
    ?? item?.depositAmount
    ?? item?.reservationDeposit
    ?? item?.abonoReserva
    ?? RESERVATION_DEPOSIT_CLP;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : RESERVATION_DEPOSIT_CLP;
}

export function getCartItemUnitPayable(item) {
  return isReservationCartItem(item) ? getReservationDeposit(item) : getCartItemServiceValue(item);
}

export function getCartItemPayableTotal(item) {
  return getCartItemUnitPayable(item) * Number(item?.quantity || 1);
}

export function getCartPaymentTotal(items = []) {
  return items.reduce((sum, item) => sum + getCartItemPayableTotal(item), 0);
}

export function getReservationDepositTotal(items = []) {
  return items
    .filter(isReservationCartItem)
    .reduce((sum, item) => sum + getReservationDeposit(item), 0);
}
