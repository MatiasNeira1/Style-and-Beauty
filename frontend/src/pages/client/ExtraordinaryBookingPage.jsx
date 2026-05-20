import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExtraordinaryRequest } from '../../components/booking/ExtraordinaryRequest.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { extraService } from '../../services/extraService.js';

const schema = z.object({
  nombre: z.string().min(2, 'Ingresa tu nombre'),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  detalle: z.string().min(10, 'Describe la solicitud'),
});

export function ExtraordinaryBookingPage() {
  const form = useForm({ resolver: zodResolver(schema) });
  const mutation = useMutation({ mutationFn: extraService.createRequest });
  const submit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <section className="page-section">
      <SectionTitle eyebrow="Extraordinarias" title="Solicitud especial">Coordina horarios, servicios o condiciones fuera del flujo regular.</SectionTitle>
      <ExtraordinaryRequest register={form.register} errors={form.formState.errors} onSubmit={submit} isSubmitting={mutation.isPending} />
    </section>
  );
}
