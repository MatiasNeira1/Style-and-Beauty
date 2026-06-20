import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  CalendarDays,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { reservationService } from '../../services/reservationService.js';
import { sendChatbotMessage } from '../../services/chatbotService.js';
import { useAuth } from '../../store/AuthContext.jsx';

const whatsappUrl = 'https://wa.me/56958612677';

const QUICK_REPLIES = [
  'Horarios disponibles',
  'Servicios y precios',
  'Hablar con contacto',
];

function createMessage(from, text, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    from,
    text,
    ...extra,
  };
}

function cleanStorageValue(value) {
  if (!value) return '';

  return String(value)
    .trim()
    .replace(/^"|"$/g, '');
}

function getLocalStorageValue(keys) {
  for (const key of keys) {
    const value = cleanStorageValue(localStorage.getItem(key));

    if (value) {
      return value;
    }
  }

  return '';
}

function getFirebaseStoredUser() {
  const firebaseKey = Object.keys(localStorage).find((key) =>
    key.startsWith('firebase:authUser:')
  );

  if (!firebaseKey) {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(firebaseKey));
  } catch {
    return null;
  }
}

function getAuthToken() {
  const directToken = getLocalStorageValue([
    'style_beauty_token',
    'idToken',
    'firebaseIdToken',
    'accessToken',
    'authToken',
    'token',
  ]);

  if (directToken) {
    return directToken;
  }

  const firebaseUser = getFirebaseStoredUser();

  return (
    firebaseUser?.stsTokenManager?.accessToken ||
    firebaseUser?.idToken ||
    ''
  );
}

function getClientIdFromStorage() {
  const directClientId = getLocalStorageValue([
    'idCliente',
    'clienteId',
    'clientId',
  ]);

  if (directClientId) {
    return directClientId;
  }

  const possibleUserKeys = [
    'user',
    'usuario',
    'authUser',
    'profile',
  ];

  for (const key of possibleUserKeys) {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawValue);

      const id =
        parsed?.idCliente ||
        parsed?.clienteId ||
        parsed?.clientId ||
        parsed?.id ||
        '';

      if (id) {
        return id;
      }
    } catch {
      // Ignorar valores que no sean JSON.
    }
  }

  return '';
}

function getProfileData(response) {
  if (
    response?.data &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  return response || {};
}

function getClientIdFromProfile(profile) {
  return (
    profile?.idCliente ||
    profile?.clienteId ||
    profile?.clientId ||
    profile?.id ||
    profile?.idPersona ||
    ''
  );
}

function getFullName(professional) {
  return [professional?.nombre, professional?.apellidos]
    .filter(Boolean)
    .join(' ');
}

function redirectToPayment(url, token) {
  if (!url) {
    return;
  }

  if (!token) {
    window.location.assign(url);
    return;
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token_ws';
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export function ClientChatbot() {
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [appointmentContext, setAppointmentContext] = useState({});

  const [messages, setMessages] = useState(() => [
    createMessage(
      'bot',
      'Hola, soy el asistente de Style & Beauty. Te ayudo a reservar, revisar horarios o resolver dudas.'
    ),
  ]);

  const messagesEndRef = useRef(null);

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: reservationService.getMe,
    enabled: Boolean(isAuthenticated),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const profile = useMemo(() => {
    return getProfileData(profileQuery.data);
  }, [profileQuery.data]);

  const clientId = useMemo(() => {
    return getClientIdFromProfile(profile) || getClientIdFromStorage();
  }, [profile]);

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, open, isSending]);

  const addBotMessage = (message) => {
    setMessages((current) => [
      ...current,
      createMessage('bot', message.text, message),
    ]);
  };

  const resolveClientId = async () => {
    if (clientId) {
      return clientId;
    }

    if (!isAuthenticated) {
      return '';
    }

    try {
      const result = await profileQuery.refetch();
      const refreshedProfile = getProfileData(result.data);

      return getClientIdFromProfile(refreshedProfile);
    } catch (error) {
      console.error('No se pudo obtener el perfil del cliente:', error);
      return '';
    }
  };

  const sendMessage = async (value = input, extraPayload = {}) => {
    const text = typeof value === 'string' ? value.trim() : '';

    if (!text || isSending) {
      return;
    }

    setOpen(true);
    setInput('');
    setIsSending(true);

    setMessages((current) => [
      ...current,
      createMessage('user', text),
    ]);

    try {
      const token = getAuthToken();
      const resolvedClientId = await resolveClientId();

      if (!token || !resolvedClientId) {
        addBotMessage({
          text: 'Para reservar desde el asistente necesitas iniciar sesión con tu cuenta de cliente.',
          actionLabel: 'Iniciar sesión',
          actionTo: '/login',
        });

        return;
      }

      const sessionId = `cliente-${resolvedClientId}`;

      const payloadContext = {
        ...appointmentContext,
        ...extraPayload,
      };

      const response = await sendChatbotMessage({
        message: text,
        clientId: resolvedClientId,
        sessionId,
        token,
        extraPayload: payloadContext,
      });

      const newContext = {
        ...payloadContext,
        idCliente: response.idCliente || resolvedClientId,
        idServicio:
          response.idServicio ||
          payloadContext.idServicio ||
          '',
        idStaff:
          response.idStaff ||
          payloadContext.idStaff ||
          '',
        servicio:
          response.servicio ||
          payloadContext.servicio ||
          '',
        fecha:
          response.fecha ||
          payloadContext.fecha ||
          '',
        hora:
          response.hora ||
          payloadContext.hora ||
          '',
        sessionId,
      };

      setAppointmentContext(newContext);

      addBotMessage({
        text:
          response.respuesta ||
          'No recibí una respuesta válida del asistente.',
        professionals: response.profesionales || [],
        availableSlots: response.horariosDisponibles || [],
        paymentUrl: response.urlPago || response.linkPago || '',
        paymentToken: response.tokenPago || '',
        context: newContext,
      });
    } catch (error) {
      console.error('Error en chatbot:', error);

      addBotMessage({
        text:
          error instanceof Error
            ? error.message
            : 'No pude conectar con el asistente en este momento. Intenta nuevamente.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleProfessionalSelection = (message, professional) => {
    const fullName = getFullName(professional);

    sendMessage(`Quiero atenderme con ${fullName}`, {
      ...message.context,
      idStaff: professional.idStaff,
    });
  };

  const handleSlotSelection = (message, slot) => {
    const hora = typeof slot === 'string' ? slot : slot?.hora;

    if (!hora) {
      return;
    }

    sendMessage(`Quiero reservar a las ${hora}`, {
      ...message.context,
      hora,
    });
  };

  return (
    <div className="chatbot-widget">
      {open && (
        <section className="chatbot-panel" aria-label="Chat de ayuda">
          <header>
            <div>
              <span>
                <Bot size={16} /> Asistente
              </span>
              <strong>Style & Beauty</strong>
            </div>

            <button
              type="button"
              className="icon-link"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              <X size={18} />
            </button>
          </header>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.from}`}
              >
                <span>{message.text}</span>

                {message.professionals?.length > 0 && (
                  <div className="chatbot-slots">
                    {message.professionals.map((professional) => {
                      const fullName = getFullName(professional);

                      return (
                        <button
                          key={professional.idStaff}
                          type="button"
                          disabled={isSending}
                          onClick={() =>
                            handleProfessionalSelection(
                              message,
                              professional
                            )
                          }
                        >
                          {fullName || 'Seleccionar profesional'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {message.availableSlots?.length > 0 && (
                  <div className="chatbot-slots">
                    {message.availableSlots.map((slot, index) => {
                      const hora =
                        typeof slot === 'string'
                          ? slot
                          : slot?.hora;

                      if (!hora) {
                        return null;
                      }

                      return (
                        <button
                          key={`${hora}-${index}`}
                          type="button"
                          disabled={isSending}
                          onClick={() =>
                            handleSlotSelection(message, slot)
                          }
                        >
                          {hora}
                        </button>
                      );
                    })}
                  </div>
                )}

                {message.actionTo && (
                  <Link
                    to={message.actionTo}
                    className="chat-payment-link"
                  >
                    {message.actionLabel}
                  </Link>
                )}

                {message.paymentUrl && (
                  <button
                    type="button"
                    className="chat-payment-link"
                    onClick={() =>
                      redirectToPayment(
                        message.paymentUrl,
                        message.paymentToken
                      )
                    }
                  >
                    Pagar reserva
                  </button>
                )}
              </div>
            ))}

            {isSending && (
              <div className="chat-message bot">
                Consultando disponibilidad...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-quick">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                disabled={isSending}
                onClick={() => sendMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </div>

          <form
            className="chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu consulta..."
              disabled={isSending}
            />

            <button
              type="submit"
              disabled={!canSend}
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </form>

          <Link to="/reservar" className="chatbot-booking-link">
            <CalendarDays size={16} /> Ir a reservar
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="chatbot-booking-link"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </section>
      )}

      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}

