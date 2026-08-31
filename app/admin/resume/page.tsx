import AdminWorkspace from "@/components/admin/AdminWorkspace";
import ResumeManager from "@/components/admin/ResumeManager";

export default function AdminResumePage() {
  return (
    <AdminWorkspace
      eyebrow="简历编辑室"
      title="个人简历"
      description="分区修改基本资料、技能、经历、教育、荣誉和项目。保存后会立即同步到前台交互简历页。"
    >
      <ResumeManager />
    </AdminWorkspace>
  );
}
