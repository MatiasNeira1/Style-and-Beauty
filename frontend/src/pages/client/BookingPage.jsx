import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Settings2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { BookingSummary } from '../../components/booking/BookingSummary.jsx';
import { DateTimePicker } from '../../components/booking/DateTimePicker.jsx';
import { ServiceSelector } from '../../components/booking/ServiceSelector.jsx';
import { StaffSelector } from '../../components/booking/StaffSelector.jsx';
import { agendaService } from '../../services/agendaService.js';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { useBooking } from '../../store/BookingContext.jsx';
import { normalizeCategory } from '../../utils/categoryUtils.js';

const fallbackServices = [
  { id: 1, nombre: 'Corte Signature', categoria: 'Peluquería', precio: 22990, duracion: 45, descripcion: 'Corte personalizado con styling final.' },
  { id: 2, nombre: 'Ritual Facial', categoria: 'Estética', precio: 34990, duracion: 60, descripcion: 'Limpieza profunda y luminosidad.' },
  { id: 3, nombre: 'Color Premium', categoria: 'Peluquería', precio: 45990, duracion: 90, descripcion: 'Coloración profesional y cuidado de fibra.' },
];

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function staffId(member) {
  return member?.idPersona || member?.idStaff || member?.id;
}

function serviceDuration(service) {
  return Number(service?.duracion_minutos || service?.duracion || service?.duration || 45);
}

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateBooking } = useBooking();

  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [member, setMember] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bufferMinutes, setBufferMinutes] = useState(20);

  const { data: serviceData } = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const { data: staffData = [] } = useQuery({ queryKey: ['public-staff'], queryFn: profileService.listPublicStaff });
  const { data: myProfile } = useQuery({ queryKey: ['my-profile'], queryFn: profileService.getMyProfile, enabled: isAuthenticated });

  const services = Array.isArray(serviceData) && serviceData.length ? serviceData : fallbackServices;
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staffData)) return [];
    if (!service?.categoria) return staffData;
    return staffData.filter((item) => normalizeCategory(item.especialidad?.nombre) === normalizeCategory(service.categoria));
  }, [staffData, service]);

  const availabilityQuery = useQuery({
    queryKey: ['availability', staffId(member), date, serviceDuration(service), bufferMinutes],
    queryFn: () => agendaService.getAvailability({
      idStaff: staffId(member),
      fecha: date,
      duracionServicioMin: serviceDuration(service),
      holguraMin: Number(bufferMinutes),
    }),
    enabled: Boolean(member && date && service),
  });

  const bookingMutation = useMutation({ mutationFn: agendaService.createBooking });

  const confirm = async () => {
    const payload = {
      idCliente: myProfile?.idPersona,
      idStaff: staffId(member),
      idServicio: serviceId(service),
      fechaHoraInicio: time,
      duracionServicioMin: serviceDuration(service),
      holguraMin: Number(bufferMinutes),
    };
    updateBooking({ service, staff: member, date, time, holguraMin: Number(bufferMinutes) });
    await bookingMutation.mutateAsync(payload);
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <>
        <BookingHero />
        <section className="page-section client-auth-gate">
          <Card className="client-auth-card">
            <div className="client-auth-icon"><Lock size={32} /></div>
            <h2>Inicia sesión para reservar</h2>
            <p>Necesitamos asociar tu cita a tu perfil para confirmar horarios, notificaciones y pagos.</p>
            <Button onClick={() => navigate('/login', { state: { from: location } })}>Ir a iniciar sesión</Button>
          </Card>
        </section>
      </>
    );
  }

  return (
    <>
      <BookingHero />
      <section className="page-section two-column booking-shell client-view">
        <div className="stack wizard-panel">
          <SectionTitle eyebrow="Agenda inteligente" title="Reserva segun disponibilidad real">
            El sistema calcula horarios usando jornada del staff, citas existentes, bloqueos y holgura operativa.
          </SectionTitle>

        <div className="wizard-steps">
          {[['1', 'Servicio'], ['2', 'Staff'], ['3', 'Horario']].map(([value, label]) => (
            <Badge key={value} tone={step === Number(value) ? 'primary' : 'neutral'}>{label}</Badge>
          ))}
        </div>

        {step === 1 && (
          <ServiceSelector
            services={services}
            selectedId={serviceId(service)}
            onSelect={(value) => {
              setService(value);
              setMember(null);
              setDate('');
              setTime('');
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <StaffSelector
            staff={filteredStaff}
            selectedId={staffId(member)}
            onSelect={(value) => {
              setMember(value);
              setDate('');
              setTime('');
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <div className="stack">
            <Card className="booking-buffer-card">
              <div>
                <span className="card-kicker"><Settings2 size={14} /> Holgura entre atenciones</span>
                <p>Tiempo reservado después del servicio para limpieza, preparación y retrasos menores.</p>
              </div>
              <Input
                id="booking-buffer"
                as="select"
                label="Minutos de holgura"
                value={bufferMinutes}
                onChange={(event) => {
                  setBufferMinutes(Number(event.target.value));
                  setTime('');
                }}
              >
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
              </Input>
            </Card>
            <DateTimePicker
              date={date}
              time={time}
              slots={Array.isArray(availabilityQuery.data) ? availabilityQuery.data : []}
              isLoading={availabilityQuery.isLoading}
              onDateChange={(value) => { setDate(value); setTime(''); }}
              onTimeChange={setTime}
            />
          </div>
        )}

        <div className="wizard-actions">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Volver</Button>
          {step < 3 && <Button disabled={(step === 1 && !service) || (step === 2 && !member)} onClick={() => setStep((current) => Math.min(3, current + 1))}>Continuar</Button>}
          {step === 3 && (
            <Button
              onClick={confirm}
              disabled={!myProfile?.idPersona || !service || !member || !date || !time || bookingMutation.isPending}
            >
              {bookingMutation.isPending ? 'Confirmando...' : 'Confirmar reserva'}
            </Button>
          )}
        </div>

        {step === 3 && !myProfile?.idPersona && <p className="admin-alert">Tu perfil de cliente debe estar completo para confirmar la reserva.</p>}
        {bookingMutation.isError && <p className="admin-alert">{bookingMutation.error.message}</p>}
        </div>

        <BookingSummary service={service} staff={member} date={date} time={time} />
      </section>
    </>
  );
}

function BookingHero() {
  return (
    <section className="page-hero page-hero-booking">
      <div className="page-hero-media" />
      <div className="page-hero-overlay" />
      <div className="page-hero-content">
        <span className="card-kicker">Reserva online</span>
        <h1>Agenda tu momento con disponibilidad real</h1>
        <p>Elige servicio, profesional y horario disponible con tiempos de holgura pensados para una atención impecable.</p>
      </div>
    </section>
  );
}
