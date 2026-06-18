import { Award, BookOpen, Briefcase, Calendar, CalendarClock, FileText, Image, Mail, Phone, User } from 'lucide-react';

function displayValue(value) {
  return value || '-';
}

function ProfileFact({ icon: Icon, label, value }) {
  return (
    <div className="staff-profile-fact">
      <span>
        <Icon size={13} />
        {label}
      </span>
      <strong>{displayValue(value)}</strong>
    </div>
  );
}

function ShortcutCard({ icon: Icon, title, description, onClick }) {
  return (
    <button type="button" className="staff-shortcut-card" onClick={onClick}>
      <span className="staff-shortcut-icon">
        <Icon size={17} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

export function StaffPortalProfile({ currentStaff, fullName, initials, specialtyName, onNavigate, onEditProfile }) {
  return (
    <div className="staff-profile-layout">
      <section className="staff-profile-card">
        <div className="staff-profile-hero">
          <div className="staff-profile-identity">
            <div className="staff-profile-avatar">
              {initials}
            </div>
            <div>
              <span>Perfil propio</span>
              <h3>{fullName}</h3>
              <p>{specialtyName}</p>
            </div>
          </div>
          <button className="staff-profile-edit-button" type="button" onClick={onEditProfile}>
            <User size={15} />
            Editar perfil
          </button>
        </div>

        <div className="staff-profile-facts">
          <ProfileFact icon={Mail} label="Email" value={currentStaff.emailContacto} />
          <ProfileFact icon={Phone} label="Telefono" value={currentStaff.telefono} />
          <ProfileFact icon={FileText} label="RUT" value={currentStaff.rut} />
          <ProfileFact icon={Calendar} label="Nacimiento" value={currentStaff.fechaNacimiento} />
          <ProfileFact icon={Briefcase} label="Experiencia" value={currentStaff.experienciaAnios ? `${currentStaff.experienciaAnios} anos` : ''} />
          <ProfileFact icon={User} label="Genero" value={currentStaff.genero} />
        </div>
      </section>

      <section className="staff-profile-card">
        <div className="staff-resource-heading">
          <Award size={18} />
          <div>
            <span>Recursos del profesional</span>
            <h3>Gestiona tu presencia publica</h3>
            <p>Estos accesos abren los editores conectados a tu perfil, agenda y portfolio.</p>
          </div>
        </div>

        <div className="staff-shortcut-list">
          <ShortcutCard
            icon={BookOpen}
            title="Biografia Profesional"
            description="Edita tu perfil curricular desde Mi Portfolio Digital."
            onClick={() => onNavigate?.('portfolio')}
          />
          <ShortcutCard
            icon={CalendarClock}
            title="Jornada Laboral Fija"
            description="Configura dias y horas disponibles para reservas."
            onClick={() => onNavigate?.('schedule')}
          />
          <ShortcutCard
            icon={Image}
            title="Mi Portfolio Digital"
            description="Sube, revisa y elimina fotos de trabajos realizados."
            onClick={() => onNavigate?.('portfolio')}
          />
        </div>
      </section>
    </div>
  );
}
