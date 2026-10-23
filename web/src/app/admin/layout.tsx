import AdminSidebar from "@/components/admin/AdminSidebar";
import HeaderTitle from "@/components/admin/HeaderTitle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-black text-white font-sans antialiased overflow-hidden">
      {/* 1. Shared Admin Sidebar */}
      <AdminSidebar />

      {/* 2. Main Administration Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-black">
        {/* Shared Header with Dynamic Monospace Evangelion Breadcrumbs */}
        <HeaderTitle />

        {/* Dynamic Route Content */}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
