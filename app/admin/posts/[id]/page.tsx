import ArticleEditor from "@/components/admin/ArticleEditor";
import AdminWorkspace from "@/components/admin/AdminWorkspace";

export default function EditAdminPostPage({ params }: { params: { id: string } }) {
  return (
    <AdminWorkspace
      eyebrow="编辑内容"
      title="编辑文章"
      description="这篇文章独立打开；旅行记录、音乐管理和其他文章不会占用你的编辑空间。"
    >
      <ArticleEditor postId={params.id} />
    </AdminWorkspace>
  );
}
