import ArticleEditor from "@/components/admin/ArticleEditor";
import AdminWorkspace from "@/components/admin/AdminWorkspace";

export default function NewAdminPostPage() {
  return (
    <AdminWorkspace
      eyebrow="新建内容"
      title="新建文章"
      description="在一个专注的编辑页里完成内容、照片和 Vlog；保存后会自动转到这篇文章的独立编辑地址。"
    >
      <ArticleEditor />
    </AdminWorkspace>
  );
}
