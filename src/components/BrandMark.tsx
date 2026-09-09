export function BrandMark({
  className = "size-7",
}: {
  className?: string;
}) {
  return (
    <img
      src="/app-icon-512.png"
      alt="Nuvie"
      className={className}
    />
  );
}
