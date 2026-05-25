import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BookingSummary } from '../../components/booking/BookingSummary.jsx';
import { DateTimePicker } from '../../components/booking/DateTimePicker.jsx';
import { ServiceSelector } from '../../components/booking/ServiceSelector.jsx';
import { StaffSelector } from '../../components/booking/StaffSelector.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { catalogService } from '../../services/catalogService.js';
import { agendaService } from '../../services/agendaService.js';
import { profileService } from '../../services/profileService.js';
import { useBooking } from '../../store/BookingContext.jsx';
import { normalizeCategory } from '../../utils/categoryUtils.js';

const fallbackServices = [{ id: 1, nombre: 'Corte y brushing', precio: 24990 }];

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function staffId(member) {
  return member?.idPersona || member?.idStaff || member?.id;
}

function serviceDuration(service) {
  return service?.duracion_minutos || service?.duracion || 45;
}

export function BookingPage() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [member, setMember] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const { updateBooking } = useBooking();
  const { data } = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const { data: staffData = [] } = useQuery({ queryKey: ['public-staff'], queryFn: profileService.listPublicStaff });
  const { data: myProfile } = useQuery({ queryKey: ['my-profile'], queryFn: profileService.getMyProfile });
  const services = Array.isArray(data) && data.length ? data : fallbackServices;
  const staff = Array.isArray(staffData)
    ? staffData.filter((item) => !service?.categoria || normalizeCategory(item.especialidad?.nombre) === normalizeCategory(service.categoria))
    : [];
  const availabilityQuery = useQuery({
    queryKey: ['availability', staffId(member), date, serviceDuration(service)],
    queryFn: () => agendaService.getAvailability({
      idStaff: staffId(member),
      fecha: date,
      duracionServicioMin: serviceDuration(service),
      holguraMin: 20,
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
      holguraMin: 20,
    };
    updateBooking({ service, staff: member, date, time });
    await bookingMutation.mutateAsync(payload);
  };

  return (
    <section className="page-section two-column booking-shell">
      <div className="stack wizard-panel">
        <SectionTitle eyebrow="Agenda" title="Reserva guiada" />
        <div className="wizard-steps">
          {[1, 2, 3].map((item) => <Badge key={item} tone={step === item ? 'primary' : 'neutral'}>Paso {item}</Badge>)}
        </div>
        {step === 1 && <ServiceSelector services={services} selectedId={serviceId(service)} onSelect={(value) => { setService(value); setMember(null); setDate(''); setTime(''); setStep(2); }} />}
        {step === 2 && <StaffSelector staff={staff} selectedId={staffId(member)} onSelect={(value) => { setMember(value); setDate(''); setTime(''); setStep(3); }} />}
        {step === 3 && (
          <DateTimePicker
            date={date}
            time={time}
            slots={Array.isArray(availabilityQuery.data) ? availabilityQuery.data : []}
            isLoading={availabilityQuery.isLoading}
            onDateChange={(value) => { setDate(value); setTime(''); }}
            onTimeChange={setTime}
          />
        )}
        <div className="wizard-actions">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Volver</Button>
          {step < 3 && <Button onClick={() => setStep((current) => Math.min(3, current + 1))}>Continuar</Button>}
          {step === 3 && <Button onClick={confirm} disabled={!myProfile?.idPersona || !service || !member || !date || !time || bookingMutation.isPending}>{bookingMutation.isPending ? 'Confirmando...' : 'Confirmar reserva'}</Button>}
        </div>
        {step === 3 && !myProfile?.idPersona && <p className="admin-alert">Inicia sesion como cliente para confirmar la reserva.</p>}
      </div>
      <BookingSummary service={service} staff={member} date={date} time={time} />
    </section>
  );
}
