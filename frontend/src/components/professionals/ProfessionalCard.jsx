import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { professionalTheme, statusTone } from '../../utils/professionalTheme.js';

export function ProfessionalCard({ professional, compact = false }) {
  const theme = professionalTheme(professional.especialidad);
  const tone = statusTone(professional.estado);
  const color = professional.colorEspecialidad || theme.color;

  return (
    <motion.article
      className={`professional-card ${compact ? 'compact' : ''}`}
      style={{ '--specialty-color': color, '--specialty-soft': theme.soft }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      layout
    >
      <div className="professional-card-glow" />
      <div className="professional-card-header">
        <div className="professional-card-media">
          {professional.fotoUrl ? (
            <img src={professional.fotoUrl} alt={professional.fullName} loading="lazy" />
          ) : (
            <UserRound size={42} />
          )}
        </div>
        <span className={`professional-status ${tone}`}>{professional.estado}</span>
      </div>

      <div className="professional-card-body">
        <div className="professional-main">
          <span className="professional-specialty">{professional.especialidad}</span>
          <h3>{professional.fullName}</h3>
          {!compact && <p>{professional.descripcion || professional.cargo}</p>}
        </div>

        <div className="professional-meta">
          <span><MapPin size={14} /> {professional.sucursal}</span>
          {!compact && <span><Clock size={14} /> {professional.modalidad}</span>}
        </div>

        <div className="professional-hours" aria-label="Próximas horas disponibles">
          <strong>Próxima hora</strong>
          <span className="next-hour-chip">{professional.proximaHora || professional.proximasHoras[0]}</span>
          {!compact && professional.proximasHoras.slice(0, 3).map((hour) => (
            <span key={hour}>{hour}</span>
          ))}
        </div>

        <div className="professional-actions">
          {!compact && <Link to={`/profesionales?id=${professional.id}`} className="text-link">Ver perfil</Link>}
          <Link to="/reservar" className="professional-booking-link">
            <CalendarDays size={15} /> Reservar hora
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
