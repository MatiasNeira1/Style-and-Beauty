export function redirigirAWebpay(urlWebpay, token) {
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
