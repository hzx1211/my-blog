import ArticleList from "@/components/admin/ArticleList";
import AdminWorkspace from "@/components/admin/AdminWorkspace";

export default function AdminPostsPage() {
  return (
    <AdminWorkspace
      eyebrow="文章工作台"
      title="文章管理"
      description="每篇文章都有独立编辑页。点击一条文章即可打开；新建不会再挤在同一张长页面下方。"
    >
      <ArticleList />
    </AdminWorkspace>
  );
}
