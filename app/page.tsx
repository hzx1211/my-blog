"use client";

import BlogHeader from "@/components/blog/Header";
import BlogPosts from "@/components/blog/BlogPosts";
import Journey from "@/components/blog/Journey";
import AboutWithFooter from "@/components/blog/AboutWithFooter";

export default function Home() {
  return (
    <main className="min-h-screen">
      <BlogHeader />
      <BlogPosts />
      <Journey />
      <AboutWithFooter />
    </main>
  );
}
