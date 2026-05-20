import { useForm } from 'react-hook-form';
import { UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

export function ProfilePage() {
  const { user, setSession, logout } = useAuth();
  const { register, handleSubmit } = useForm({ defaultValues: user || { nombre: '', email: '' } });

  return (
    <section className="page-section two-column">
      <div>
        <SectionTitle eyebrow="Cliente" title="Perfil">Datos personales, historial y preferencias.</SectionTitle>
        <form className="stack" onSubmit={handleSubmit((values) => setSession({ user: values }))}>
          <Input id="profile-name" label="Nombre" {...register('nombre')} />
          <Input id="profile-email" label="Email" type="email" {...register('email')} />
          <Button>Guardar perfil</Button>
        </form>
      </div>
      <Card className="profile-card">
        <UserRound size={36} />
        <h3>{user?.nombre || 'Cliente invitado'}</h3>
        <p>{user?.email || 'Inicia sesion para sincronizar tu experiencia.'}</p>
        <Button variant="ghost" onClick={logout}>Cerrar sesion local</Button>
      </Card>
    </section>
  );
}
