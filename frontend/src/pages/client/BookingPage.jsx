import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
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

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function staffId(member) {
  return member?.idPersona || member?.idStaff || member?.id;
}

export function BookingPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateBooking } = useBooking();

  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [member, setMember] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const { data: serviceData } = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const { data: staffData = [] } = useQuery({ queryKey: ['public-staff'], queryFn: profileService.listPublicStaff });
  const { data: myProfile } = useQuery({ queryKey: ['my-profile'], queryFn: profileService.getMyProfile, enabled: isAuthenticated });

  const services = Array.isArray(serviceData) ? serviceData : [];
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staffData)) return [];
    if (!service?.categoria) return staffData;
    return staffData.filter((item) => normalizeCategory(item.especialidad?.nombre) === normalizeCategory(service.categoria));
  }, [staffData, service]);

  const availabilityQuery = useQuery({
    queryKey: ['availability', staffId(member), serviceId(service), date],
    queryFn: () => agendaService.getAvailability({
      idStaff: staffId(member),
      idServicio: serviceId(service),
      fecha: date,
    }),
    enabled: Boolean(member && date && service),
  });

  const selectedSlot = useMemo(() => {
    const slots = Array.isArray(availabilityQuery.data) ? availabilityQuery.data : [];
    return slots.find((slot) => slot.inicio === time);
  }, [availabilityQuery.data, time]);

  const bookingMutation = useMutation({
    mutationFn: agendaService.createBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['availability', staffId(member), serviceId(service), date] });
      await queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  const confirm = async () => {
    setConfirmError('');
    const freshAvailability = await availabilityQuery.refetch();
    if (freshAvailability.isError) {
      setConfirmError(freshAvailability.error?.message || 'No fue posible validar disponibilidad. Intenta nuevamente.');
      return;
    }

    const freshSlots = Array.isArray(freshAvailability.data) ? freshAvailability.data : [];
    const stillAvailable = freshSlots.some((slot) => slot.inicio === time);

    if (!stillAvailable) {
      setTime('');
      setConfirmError('El horario seleccionado ya no esta disponible. Elige otra hora.');
      return;
    }

    const created = await bookingMutation.mutateAsync({
      idCliente: myProfile?.idPersona,
      idStaff: staffId(member),
      idServicio: serviceId(service),
      fechaHoraInicio: time,
    });

    updateBooking({
      service,
      staff: member,
      date,
      time,
      holguraMin: created?.holguraMin,
      duracionServicioMin: created?.duracionServicioMin,
    });
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <>
        <BookingHero />
        <section className="page-section client-auth-gate">
          <Card className="client-auth-card">
            <div className="client-auth-icon"><Lock size={32} /></div>
            <h2>Inicia sesion para reservar</h2>
            <p>Necesitamos asociar tu cita a tu perfil para confirmar horarios, notificaciones y pagos.</p>
            <Button onClick={() => navigate('/login', { state: { from: location } })}>Ir a iniciar sesion</Button>
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
                setConfirmError('');
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
                setConfirmError('');
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <div className="stack">
              <DateTimePicker
                date={date}
                time={time}
                slots={Array.isArray(availabilityQuery.data) ? availabilityQuery.data : []}
                isLoading={availabilityQuery.isLoading}
                error={availabilityQuery.error?.message}
                onDateChange={(value) => { setDate(value); setTime(''); setConfirmError(''); }}
                onTimeChange={(value) => { setTime(value); setConfirmError(''); }}
              />
            </div>
          )}

          <div className="wizard-actions">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Volver</Button>
            {step < 3 && <Button disabled={(step === 1 && !service) || (step === 2 && !member)} onClick={() => setStep((current) => Math.min(3, current + 1))}>Continuar</Button>}
            {step === 3 && (
              <Button
                onClick={confirm}
                disabled={!myProfile?.idPersona || !service || !member || !date || !time || !selectedSlot || bookingMutation.isPending || availabilityQuery.isFetching}
              >
                {bookingMutation.isPending || availabilityQuery.isFetching ? 'Confirmando...' : 'Confirmar reserva'}
              </Button>
            )}
          </div>

          {step === 3 && !myProfile?.idPersona && <p className="admin-alert">Tu perfil de cliente debe estar completo para confirmar la reserva.</p>}
          {confirmError && <p className="admin-alert">{confirmError}</p>}
          {bookingMutation.isError && <p className="admin-alert">{bookingMutation.error.message}</p>}
        </div>

        <BookingSummary service={service} staff={member} date={date} time={time} slot={selectedSlot} />
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
        <p>Elige servicio, profesional y horario disponible con tiempos de holgura pensados para una atencion impecable.</p>
      </div>
    </section>
  );
}
