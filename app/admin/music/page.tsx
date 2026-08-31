import AdminWorkspace from "@/components/admin/AdminWorkspace";
import MusicManager from "@/components/admin/MusicManager";

export default function AdminMusicPage() {
  return (
    <AdminWorkspace
      eyebrow="全站音乐"
      title="音乐角"
      description="这里管理博客全站播放器的歌单。上传或移除音乐不会影响文章内容。"
    >
      <MusicManager />
    </AdminWorkspace>
  );
}
