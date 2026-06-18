export function redirigirAWebpay(urlWebpay, token) {
  if (String(urlWebpay || '').toLowerCase().includes('.internal.')) {
    throw new Error('La URL de WebPay apunta a un dominio interno no permitido.');
  }

  if (String(urlWebpay || '').includes('/api/pagos/webpay/simulado/')) {
    const simulatedUrl = new URL(urlWebpay, window.location.origin);
    if (token) {
      simulatedUrl.searchParams.set('token_ws', token);
    }
    window.location.href = simulatedUrl.toString();
    return;
  }

  const form = document.createElement('form');

  form.method = 'POST';
  form.action = urlWebpay;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token_ws';
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);

  form.submit();
}
