import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminWorkspace from "@/components/admin/AdminWorkspace";

export default function AdminPage() {
  return (
    <AdminWorkspace
      eyebrow="工作台概览"
      title="后台概览"
      description="把写作、旅行、音乐和简历分开管理。从这里选择要进入的独立页面。"
    >
      <AdminDashboard />
    </AdminWorkspace>
  );
}
