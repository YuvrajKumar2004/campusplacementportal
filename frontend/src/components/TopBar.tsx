interface Props {
  title: string;
  onLogout: () => void;
}

export default function TopBar({ title, onLogout }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <button className="btn-secondary" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}











