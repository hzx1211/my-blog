import BlogHeader from "@/components/blog/Header";
import BlogPosts from "@/components/blog/BlogPosts";
import Journey from "@/components/blog/Journey";
import AboutWithFooter from "@/components/blog/AboutWithFooter";
import { listPosts, toPublicPost } from "@/lib/server/posts";
import { readSiteProfile } from "@/lib/server/site-profile";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [postRecords, siteProfile] = await Promise.all([
    listPosts({ publishedOnly: true }),
    readSiteProfile(),
  ]);
  const posts = postRecords.map(toPublicPost);

  return (
    <main className="min-h-screen">
      <BlogHeader initialPostCount={posts.length} avatarUrl={siteProfile.homeAvatarUrl} />
      <BlogPosts initialPosts={posts} />
      <Journey />
      <AboutWithFooter avatarUrl={siteProfile.aboutAvatarUrl} />
    </main>
  );
}
