// app/admin/dashboard/layout.tsx
// Proteksi sudah dilakukan di middleware, layout ini hanya wrapper
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}