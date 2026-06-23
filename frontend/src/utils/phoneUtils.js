const CHILE_PHONE_PATTERN = /^56[2-9]\d{8}$/;

export function chilePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

export function isValidChilePhone(value) {
  return CHILE_PHONE_PATTERN.test(chilePhoneDigits(value));
}

export function normalizeChilePhone(value) {
  const digits = chilePhoneDigits(value);
  return CHILE_PHONE_PATTERN.test(digits) ? digits : '';
}

export function formatChilePhone(value) {
  const digits = chilePhoneDigits(value);
  if (digits.length <= 2) return digits ? `+${digits}` : '';
  if (digits.length <= 3) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}
