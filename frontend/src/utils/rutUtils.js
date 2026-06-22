const RUT_ALLOWED_CHARS = /^[0-9kK.\-\s]+$/;

export function cleanRut(value) {
  return String(value || '')
    .replace(/[.\-\s]/g, '')
    .toUpperCase();
}

export function normalizeRut(value) {
  const clean = cleanRut(value).replace(/[^0-9K]/g, '').slice(0, 9);
  if (clean.length < 2) return '';
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

export function formatRut(value) {
  const clean = cleanRut(value).replace(/[^0-9K]/g, '').slice(0, 9);
  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const reversedGroups = [];

  for (let index = body.length; index > 0; index -= 3) {
    reversedGroups.unshift(body.slice(Math.max(0, index - 3), index));
  }

  return `${reversedGroups.join('.')}-${dv}`;
}

export function calculateRutDv(body) {
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expected = 11 - (sum % 11);
  if (expected === 11) return '0';
  if (expected === 10) return 'K';
  return String(expected);
}

export function validateRut(value) {
  const raw = String(value || '').trim();
  if (!raw || !RUT_ALLOWED_CHARS.test(raw)) return false;

  const clean = cleanRut(raw).replace(/[^0-9K]/g, '');
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return calculateRutDv(body) === dv;
}
