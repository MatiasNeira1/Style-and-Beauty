const DEFAULT_WEBHOOK_URL =
  '/n8n/webhook/725d8654-8134-4b11-956d-17d1145a9602';
const DEFAULT_ASSISTANT_RESPONSE =
  'Hola, puedo ayudarte a agendar una cita. Indícame el servicio, fecha y hora que prefieres.';

export const CHATBOT_WEBHOOK_URL =
  import.meta.env.VITE_N8N_CHATBOT_WEBHOOK_URL?.trim() ||
  DEFAULT_WEBHOOK_URL;

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeSlots(value) {
  return normalizeArray(value)
    .map((slot) => {
      if (typeof slot === 'string') {
        return {
          hora: slot,
          inicio: '',
          finVisible: null,
        };
      }

      if (!slot || typeof slot !== 'object') {
        return null;
      }

      return {
        hora: slot.hora || '',
        inicio: slot.inicio || '',
        finVisible: slot.finVisible || null,
      };
    })
    .filter((slot) => slot && slot.hora);
}

function normalizeProfessionals(value) {
  return normalizeArray(value)
    .map((professional) => ({
      idStaff:
        professional.idStaff ||
        professional.id_staff ||
        professional.id ||
        '',
      nombre: professional.nombre || '',
      apellidos: professional.apellidos || '',
      activo: professional.activo !== false,
    }))
    .filter((professional) => professional.idStaff && professional.activo);
}

function unwrapResponse(data) {
  if (Array.isArray(data)) {
    return unwrapResponse(data[0] || {});
  }

  if (typeof data === 'string') {
    const text = data.trim();

    if (!text) {
      return {};
    }

    try {
      return unwrapResponse(JSON.parse(text));
    } catch {
      return { respuesta: text };
    }
  }

  if (!data || typeof data !== 'object') {
    return {};
  }

  if (data.json && typeof data.json === 'object' && !Array.isArray(data.json)) {
    return unwrapResponse(data.json);
  }

  if (data.body) {
    return unwrapResponse(data.body);
  }

  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return unwrapResponse(data.data);
  }

  if (data.result && typeof data.result === 'object' && !Array.isArray(data.result)) {
    return unwrapResponse(data.result);
  }

  if (data.output && typeof data.output === 'object' && !Array.isArray(data.output)) {
    return unwrapResponse(data.output);
  }

  return data;
}

function firstText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim();
}

async function readResponseBody(response) {
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return {
      respuesta: DEFAULT_ASSISTANT_RESPONSE,
    };
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {
      respuesta: rawBody,
    };
  }
}

function normalizeResponse(originalData) {
  const data = unwrapResponse(originalData);

  return {
    respuesta:
      firstText(
        data.respuesta,
        data.mensaje,
        data.message,
        data.text,
        data.output,
        data.reply,
        data.answer,
        data.response,
        data.result,
      ) ||
      DEFAULT_ASSISTANT_RESPONSE,

    requiereSeleccionStaff: data.requiereSeleccionStaff === true,
    profesionales: normalizeProfessionals(data.profesionales),

    disponible: data.disponible,
    horariosDisponibles: normalizeSlots(data.horariosDisponibles),

    idCliente: data.idCliente || '',
    idServicio: data.idServicio || '',
    idStaff: data.idStaff || '',
    servicio: data.servicio || '',
    fecha: data.fecha || '',
    hora: data.hora || '',
    sessionId: data.sessionId || '',

    idCita: data.idCita || '',
    idTransaccion: data.idTransaccion || '',
    estado: data.estado || '',

    urlPago:
      data.urlPago ||
      data.linkPago ||
      data.urlWebpay ||
      data.url ||
      '',

    tokenPago:
      data.tokenPago ||
      data.tokenWebpay ||
      data.token_ws ||
      data.token ||
      '',
  };
}

export async function sendChatbotMessage({
  message,
  clientId,
  sessionId,
  token,
  extraPayload = {},
}) {
  const mensaje = typeof message === 'string' ? message.trim() : '';

  if (!mensaje) {
    throw new Error('Debes escribir un mensaje.');
  }

  const payload = {
    ...extraPayload,
    mensaje,
    idCliente: extraPayload.idCliente || clientId,
    sessionId: sessionId || extraPayload.sessionId || `cliente-${clientId}`,
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = token.toLowerCase().startsWith('bearer ')
      ? token
      : `Bearer ${token}`;
  }

  const response = await fetch(CHATBOT_WEBHOOK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      data?.respuesta ||
        data?.mensaje ||
        data?.message ||
        'No fue posible contactar al asistente.'
    );
  }

  return normalizeResponse(data);
}

