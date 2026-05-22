import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookingSummary } from '../../components/booking/BookingSummary.jsx';
import { DateTimePicker } from '../../components/booking/DateTimePicker.jsx';
import { ServiceSelector } from '../../components/booking/ServiceSelector.jsx';
import { StaffSelector } from '../../components/booking/StaffSelector.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { catalogService } from '../../services/catalogService.js';
import { agendaService } from '../../services/agendaService.js';
import { useBooking } from '../../store/BookingContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { Lock } from 'lucide-react';

const fallbackServices = [
  { id: 1, nombre: 'Corte Signature', categoria: 'Peluquería', precio: 22990, descripcion: 'Corte personalizado con styling final.' },
  { id: 2, nombre: 'Ritual Facial', categoria: 'Estética', precio: 34990, descripcion: 'Limpieza profunda y luminosidad.' },
  { id: 3, nombre: 'Color Premium', categoria: 'Peluquería', precio: 45990, descripcion: 'Coloración y cuidado de fibra.' },
  { id: 4, nombre: 'Manicure Spa', categoria: 'Manicure', precio: 15990, descripcion: 'Esmaltado permanente.' }
];

const staff = [
  { id: 1, nombre: 'Ana López', rol: 'Estilista Senior', foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', bio: 'Especialista en colorimetría y cortes modernos.' },
  { id: 2, nombre: 'Carlos Ruiz', rol: 'Barbero', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Experto en perfilado y cortes clásicos.' },
  { id: 3, nombre: 'María Paz', rol: 'Cosmetóloga', foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80', bio: 'Especialista en cuidado facial y tratamientos.' }
];

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [member, setMember] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const { updateBooking } = useBooking();
  const { data } = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const services = Array.isArray(data) && data.length ? data : fallbackServices;
  const bookingMutation = useMutation({ mutationFn: agendaService.createBooking });

  const confirm = async () => {
    const payload = { servicioId: service?.id || service?.idServicio, staffId: member?.id, fecha: date, hora: time };
    updateBooking({ service, staff: member, date, time });
    await bookingMutation.mutateAsync(payload);
  };

  if (!isAuthenticated) {
    return (
      <section className="page-section" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <Card style={{ maxWidth: '480px', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(212, 122, 158, 0.1)', borderRadius: '50%', color: 'var(--color-primary-strong)', marginBottom: '1.5rem' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Inicia Sesión para Reservar</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
            Para poder gestionar tu cita y ofrecerte un mejor servicio, necesitamos que inicies sesión en tu cuenta.
          </p>
          <Button onClick={() => navigate('/login', { state: { from: location } })} style={{ width: '100%' }}>
            Ir a Iniciar Sesión
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-section two-column booking-shell">
      <div className="stack wizard-panel">
        <SectionTitle eyebrow="Agenda" title="Reserva guiada" />
        <div className="wizard-steps">
          {[1, 2, 3].map((item) => <Badge key={item} tone={step === item ? 'primary' : 'neutral'}>Paso {item}</Badge>)}
        </div>
        {step === 1 && <ServiceSelector services={services} selectedId={service?.id || service?.idServicio} onSelect={(value) => { setService(value); setStep(2); }} />}
        {step === 2 && <StaffSelector staff={staff} selectedId={member?.id} onSelect={(value) => { setMember(value); setStep(3); }} />}
        {step === 3 && <DateTimePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />}
        <div className="wizard-actions">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Volver</Button>
          {step < 3 && <Button onClick={() => setStep((current) => Math.min(3, current + 1))}>Continuar</Button>}
          {step === 3 && <Button onClick={confirm} disabled={!service || !member || !date || !time || bookingMutation.isPending}>{bookingMutation.isPending ? 'Confirmando...' : 'Confirmar reserva'}</Button>}
        </div>
      </div>
      <BookingSummary service={service} staff={member} date={date} time={time} />
    </section>
  );
}
