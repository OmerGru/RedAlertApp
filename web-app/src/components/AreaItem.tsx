import './AreaItem.css';

export interface AreaItemProps {
  area: string;
  variant?: 'badge' | 'list';
}

export default function AreaItem({ area, variant = 'badge' }: AreaItemProps) {
  if (variant === 'list') {
    return (
      <div className="area-list-item">
        <span className="area-list-text">{area}</span>
      </div>
    );
  }

  return (
    <div className="area-badge">
      <span className="area-badge-text">{area}</span>
    </div>
  );
}
