import logoUrl from '../../assets/logo-tk.png';

interface LogoProps {
  className?: string;
}

// Logo resmi TK An Nuur Rumah Cahaya (menggantikan ikon toga di seluruh UI)
const Logo = ({ className = 'h-10 w-auto' }: LogoProps) => (
  <img src={logoUrl} alt="Logo TK An Nuur Rumah Cahaya" className={`object-contain ${className}`} draggable={false} />
);

export default Logo;
