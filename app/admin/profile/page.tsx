import AdminWorkspace from "@/components/admin/AdminWorkspace";
import SiteProfileManager from "@/components/admin/SiteProfileManager";

export default function AdminSiteProfilePage() {
  return (
    <AdminWorkspace
      eyebrow="前台外观"
      title="站点头像"
      description="分别更换首页头像和“关于我”照片。选择图片后会自动上传并保存到线上。"
    >
      <SiteProfileManager />
    </AdminWorkspace>
  );
}
