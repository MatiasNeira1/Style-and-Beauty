import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { BookingSummary } from '../../components/booking/BookingSummary.jsx';
import { DateTimePicker } from '../../components/booking/DateTimePicker.jsx';
import { ServiceSelector } from '../../components/booking/ServiceSelector.jsx';
import { StaffSelector } from '../../components/booking/StaffSelector.jsx';
import { reservationService } from '../../services/reservationService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { serviceCatalogService } from '../../services/serviceCatalogService.js';
import { HOME_HERO_IMAGE_URL } from '../../services/apiClient.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { useBooking } from '../../store/BookingContext.jsx';
import { useCart } from '../../store/CartContext.jsx';

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function staffId(member) {
  return member?.idPersona || member?.idStaff || member?.id;
}

function profileErrorMessage(error) {
  if (isProfileNotFoundError(error)) return 'Completa tu perfil de cliente antes de confirmar la reserva.';
  if (error?.status === 503) return 'La autenticacion del servidor no esta configurada. Intenta mas tarde.';
  return error?.message || 'No fue posible cargar tu perfil de cliente.';
}

function bookingErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();

  if (error?.status === 401) return 'Tu sesion expiro. Inicia sesion nuevamente para reservar.';
  if (error?.status === 403) return 'Tu cuenta no tiene permisos para crear reservas.';
  if (error?.status === 404 || isProfileNotFoundError(error)) return 'Completa tu perfil de cliente antes de confirmar la reserva.';
  if (error?.status === 503) return 'El servicio de autenticacion de reservas no esta configurado. Intenta mas tarde.';
  if (message.includes('firebaseapp') || message.includes('firebase admin')) {
    return 'El servicio de autenticacion de reservas no esta disponible. Intenta mas tarde.';
  }

  return error?.message || 'No se pudo agregar la reserva al carrito. Intenta nuevamente.';
}

export function BookingPage() {
  const { isAuthenticated, setSession } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateBooking } = useBooking();
  const { addReservationItem, hasReservationForService, setIsCartOpen, setLastCartError } = useCart();

  const initialService = location.state?.service || null;
  const initialProfessional = location.state?.professional || null;
  const initialHour = location.state?.selectedHour || '';
  const initialDate = location.state?.selectedDate || '';

  const [service, setService] = useState(initialService);
  const [member, setMember] = useState(initialProfessional);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialHour);
  const [step, setStep] = useState(() => {
    if (initialService && initialProfessional) return 3;
    if (initialService) return 2;
    return 1;
  });
  const [confirmError, setConfirmError] = useState('');
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);

  const selectedServiceId = serviceId(service);
  const selectedStaffId = staffId(member);
  const hasValidServiceId = serviceCatalogService.isValidUuid(selectedServiceId);
  const hasValidStaffId = reservationService.isValidUuid(selectedStaffId);
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: serviceCatalogService.listServices });
  const serviceStaffQuery = useQuery({
    queryKey: ['service-staff', selectedServiceId],
    queryFn: () => serviceCatalogService.listProfessionalsByService(selectedServiceId),
    enabled: hasValidServiceId,
  });
  const { data: myProfile, isError: isProfileError, error: profileError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: reservationService.getMe,
    enabled: isAuthenticated,
    retry: false,
  });

  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const serviceStaff = useMemo(() => (Array.isArray(serviceStaffQuery.data) ? serviceStaffQuery.data : []), [serviceStaffQuery.data]);

  const availabilityQuery = useQuery({
    queryKey: ['availability', selectedStaffId, selectedServiceId, date],
    queryFn: () => reservationService.getAvailability({
      idServicio: selectedServiceId,
      idStaff: selectedStaffId,
      fecha: date,
    }),
    enabled: Boolean(hasValidStaffId && hasValidServiceId && date),
  });

  const selectedSlot = useMemo(() => {
    const slots = Array.isArray(availabilityQuery.data) ? availabilityQuery.data : [];
    return slots.find((slot) => slot.inicio === time);
  }, [availabilityQuery.data, time]);

  const bookingMutation = useMutation({
    mutationFn: reservationService.createReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['availability', staffId(member), selectedServiceId, date] });
      await queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  const confirm = async () => {
    setConfirmError('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!service || !member || !date || !time) {
      setConfirmError('Selecciona servicio, profesional, fecha y horario para continuar.');
      return;
    }
    if (!hasValidServiceId || !hasValidStaffId) {
      setConfirmError('Selecciona servicio y profesional validos para continuar.');
      return;
    }
    if (isProfileError) {
      setConfirmError(profileErrorMessage(profileError));
      return;
    }
    if (!myProfile?.idPersona) {
      setConfirmError('Tu perfil de cliente debe estar completo para confirmar la reserva.');
      return;
    }
    if (hasReservationForService(selectedServiceId)) {
      const message = 'Ya tienes una reserva temporal para este servicio en el carrito.';
      setConfirmError(message);
      setLastCartError(message);
      setIsCartOpen(true);
      return;
    }

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

    let created = null;
    setAgregandoCarrito(true);
    try {
      const refreshedSession = await firebaseAuthService.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
      }

      created = await bookingMutation.mutateAsync({
        clientId: myProfile?.idPersona,
        professionalId: selectedStaffId,
        serviceId: selectedServiceId,
        startsAt: time,
      });

      updateBooking({
        service,
        staff: member,
        date,
        time,
        holguraMin: created?.holguraMin,
        duracionServicioMin: created?.duracionServicioMin,
      });
      const addResult = addReservationItem({
        id: `reservation:${created.idCita}`,
        reservationId: created.idCita,
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        name: service?.nombre || service?.name || 'Reserva',
        price: service?.precio_total ?? service?.precio ?? service?.price ?? 0,
        startsAt: created.fechaHoraInicio || time,
        endsAt: created.fechaHoraFin,
        expiresAt: created.expiracionReserva,
        duracionServicioMin: created?.duracionServicioMin,
        holguraMin: created?.holguraMin,
        service,
        staff: member,
        date,
        time,
      });

      if (!addResult.ok) {
        await reservationService.cancelReservation(created.idCita);
        setConfirmError(addResult.error);
        return;
      }

      setConfirmError('Reserva agregada al carrito. Tienes 5 minutos para confirmarla antes de que el horario se libere.');
    } catch (error) {
      setConfirmError(bookingErrorMessage(error));
      return;
    } finally {
      setAgregandoCarrito(false);
    }
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
      <section className={`page-section booking-shell client-view${step === 3 ? ' booking-shell--with-summary' : ''}`}>
        <div className="stack wizard-panel">
          <SectionTitle eyebrow="Agenda inteligente" title="Reserva segun disponibilidad real">
            El sistema calcula horarios usando jornada del staff, citas existentes y bloqueos.
          </SectionTitle>

          <div className="wizard-steps">
            {[['1', 'Servicio'], ['2', 'Staff'], ['3', 'Horario']].map(([value, label]) => (
              <Badge key={value} tone={step >= Number(value) ? 'primary' : 'neutral'}>{label}</Badge>
            ))}
          </div>

          {step === 1 && (
            servicesQuery.isLoading ? (
              <Loader />
            ) : servicesQuery.isError ? (
              <p className="admin-alert">Servicio temporalmente no disponible.</p>
            ) : services.length === 0 ? (
              <p className="admin-alert">No hay servicios disponibles para reservar.</p>
            ) : (
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
            )
          )}

          {step === 2 && (
            !service ? (
              <p className="admin-alert">Selecciona primero un servicio.</p>
            ) : serviceStaffQuery.isLoading ? (
              <Loader />
            ) : serviceStaffQuery.isError ? (
              <p className="admin-alert">No fue posible cargar profesionales.</p>
            ) : serviceStaff.length === 0 ? (
              <p className="admin-alert">No hay profesionales asociados a este servicio por el momento.</p>
            ) : (
              <StaffSelector
                staff={serviceStaff}
                selectedId={staffId(member)}
                onSelect={(value) => {
                  setMember(value);
                  setDate('');
                  setTime('');
                  setConfirmError('');
                  setStep(3);
                }}
              />
            )
          )}

          {step === 3 && (
            <div className="stack">
              <DateTimePicker
                date={date}
                time={time}
                slots={Array.isArray(availabilityQuery.data) ? availabilityQuery.data : []}
                isLoading={availabilityQuery.isLoading}
                error={availabilityQuery.error ? availabilityQuery.error.message || 'No fue posible cargar horarios.' : ''}
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
                disabled={!myProfile?.idPersona || isProfileError || !service || !member || !date || !time || !selectedSlot || bookingMutation.isPending || availabilityQuery.isFetching || agregandoCarrito}
              >
                {bookingMutation.isPending || availabilityQuery.isFetching || agregandoCarrito ? 'Agregando...' : 'Agregar al carrito'}
              </Button>
            )}
          </div>

          {step === 3 && !myProfile?.idPersona && (
            <p className="admin-alert">
              {isProfileError ? profileErrorMessage(profileError) : 'Tu perfil de cliente debe estar completo para confirmar la reserva.'}
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/perfil')}>Ir a mi perfil</Button>
            </p>
          )}
          {confirmError && <p className="admin-alert">{confirmError}</p>}
          {bookingMutation.isError && <p className="admin-alert">{bookingMutation.error.message}</p>}
        </div>

        {step === 3 && (
          <aside className="booking-summary-panel">
            <BookingSummary service={service} staff={member} date={date} time={time} slot={selectedSlot} />
          </aside>
        )}
      </section>
    </>
  );
}

function BookingHero() {
  return (
    <section
      className="page-hero page-hero-booking"
      style={{ '--page-hero-image': `url("${HOME_HERO_IMAGE_URL}")` }}
    >
      <div className="page-hero-media" />
      <div className="page-hero-overlay" />
      <div className="page-hero-content">
        <span className="card-kicker">Reserva online</span>
        <h1>Agenda tu momento con disponibilidad real</h1>
        <p>Elige servicio, profesional y horario disponible para coordinar tu atencion.</p>
      </div>
    </section>
  );
}
