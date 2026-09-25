import BlogHeader from "@/components/blog/Header";
import BlogPosts from "@/components/blog/BlogPosts";
import Journey from "@/components/blog/Journey";
import AboutWithFooter from "@/components/blog/AboutWithFooter";
import { listPosts, toPublicPost } from "@/lib/server/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = (await listPosts({ publishedOnly: true })).map(toPublicPost);

  return (
    <main className="min-h-screen">
      <BlogHeader initialPostCount={posts.length} />
      <BlogPosts initialPosts={posts} />
      <Journey />
      <AboutWithFooter />
    </main>
  );
}
