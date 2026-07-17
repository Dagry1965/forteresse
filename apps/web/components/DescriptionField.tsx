export default function DescriptionField({ value, onChange }) {
  return (
    <textarea
      className="border p-2 rounded w-full mb-4"
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Décrivez le problème..."
    />
  );
}
