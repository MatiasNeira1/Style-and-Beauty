import { useState } from 'react';
import { BookingSummary } from '../../components/booking/BookingSummary.jsx';
import { DateTimePicker } from '../../components/booking/DateTimePicker.jsx';
import { ServiceSelector } from '../../components/booking/ServiceSelector.jsx';
import { StaffSelector } from '../../components/booking/StaffSelector.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

const services = [{ id: 1, name: 'Corte y brushing', duration: 60 }];
const staff = [{ id: 1, name: 'Equipo disponible' }];

export function BookingPage() {
  const [service, setService] = useState(null);
  const [member, setMember] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  return (
    <section className="page-section two-column">
      <div className="stack">
        <SectionTitle title="Reservar hora" />
        <ServiceSelector services={services} selectedId={service?.id} onSelect={setService} />
        <StaffSelector staff={staff} selectedId={member?.id} onSelect={setMember} />
        <DateTimePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />
        <Button>Confirmar reserva</Button>
      </div>
      <BookingSummary service={service} staff={member} date={date} time={time} />
    </section>
  );
}
