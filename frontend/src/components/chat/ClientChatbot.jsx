import { useMemo, useState } from 'react';
import { Bot, CalendarDays, MessageCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const whatsappUrl = 'https://wa.me/56958612677';
const contactEmail = 'drhiaishna@styleandbeauty.com';

const QUICK_REPLIES = [
  'Quiero reservar',
  'Horarios disponibles',
  'Servicios y precios',
  'Hablar con contacto',
];

function answerFor(message) {
  const text = message.toLowerCase();
  if (text.includes('reserv') || text.includes('agenda')) {
    return 'Puedes reservar eligiendo servicio, profesional, fecha y horario disponible. La agenda respeta jornada del staff, bloqueos y holgura entre atenciones.';
  }
  if (text.includes('horario') || text.includes('dispon')) {
    return 'Los horarios se calculan segun el profesional seleccionado. Primero elige un servicio y staff; luego veras los slots reales disponibles.';
  }
  if (text.includes('precio') || text.includes('servicio')) {
    return 'Puedes revisar servicios, categorias, duracion y precios desde la seccion Servicios. Tambien puedes elegirlos directamente al reservar.';
  }
  if (text.includes('contact') || text.includes('whatsapp') || text.includes('ayuda')) {
    return `Puedes escribirnos por WhatsApp al +56 9 5861 2677 o al correo ${contactEmail}. Tambien puedes abrir Contacto para enviar tu mensaje.`;
  }
  return 'Puedo ayudarte con reservas, disponibilidad del staff, servicios, precios y contacto. Escribe tu duda o elige una opcion rapida.';
}

export function ClientChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hola, soy el asistente de Style & Beauty. Te ayudo a reservar, revisar horarios o resolver dudas.' },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const sendMessage = (value = input) => {
    const text = value.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { from: 'user', text },
      { from: 'bot', text: answerFor(text) },
    ]);
    setInput('');
    setOpen(true);
  };

  return (
    <div className="chatbot-widget">
      {open && (
        <section className="chatbot-panel" aria-label="Chat de ayuda">
          <header>
            <div>
              <span><Bot size={16} /> Asistente</span>
              <strong>Style & Beauty</strong>
            </div>
            <button type="button" className="icon-link" onClick={() => setOpen(false)} aria-label="Cerrar chat">
              <X size={18} />
            </button>
          </header>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`chat-message ${message.from}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="chatbot-quick">
            {QUICK_REPLIES.map((reply) => (
              <button key={reply} type="button" onClick={() => sendMessage(reply)}>{reply}</button>
            ))}
          </div>

          <form
            className="chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe tu consulta..." />
            <button type="submit" disabled={!canSend} aria-label="Enviar mensaje"><Send size={16} /></button>
          </form>

          <Link to="/reservar" className="chatbot-booking-link">
            <CalendarDays size={16} /> Ir a reservar
          </Link>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="chatbot-booking-link">
            <MessageCircle size={16} /> WhatsApp
          </a>
        </section>
      )}

      <button type="button" className="chatbot-toggle" onClick={() => setOpen((current) => !current)} aria-label="Abrir asistente">
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
