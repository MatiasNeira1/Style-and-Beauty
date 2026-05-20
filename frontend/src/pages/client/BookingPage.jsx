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
import { useBooking } from '../../store/BookingContext.jsx';

const fallbackServices = [{ id: 1, nombre: 'Corte y brushing', precio: 24990 }];
const staff = [{ id: 1, nombre: 'Equipo disponible' }, { id: 2, nombre: 'Especialista color' }];

export function BookingPage() {
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
