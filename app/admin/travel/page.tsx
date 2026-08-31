import AdminWorkspace from "@/components/admin/AdminWorkspace";
import HomeLocationManager from "@/components/blog/HomeLocationManager";
import JourneyManager from "@/components/blog/JourneyManager";

export default function AdminTravelPage() {
  return (
    <AdminWorkspace
      eyebrow="旅行记忆"
      title="旅行地图"
      description="在这里单独维护真实旅行足迹与家的特殊标点；不会再干扰文章编辑。"
    >
      <div className="space-y-5">
        <HomeLocationManager />
        <JourneyManager />
      </div>
    </AdminWorkspace>
  );
}
