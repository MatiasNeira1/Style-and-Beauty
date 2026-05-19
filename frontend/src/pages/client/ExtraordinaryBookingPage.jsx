import { ExtraordinaryRequest } from '../../components/booking/ExtraordinaryRequest.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

export function ExtraordinaryBookingPage() {
  return (
    <section className="page-section">
      <SectionTitle title="Solicitud extraordinaria" />
      <ExtraordinaryRequest />
    </section>
  );
}
