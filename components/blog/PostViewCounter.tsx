"use client";

import { Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PostViewCounterProps = {
  slug: string;
  initialViews: number;
};

export default function PostViewCounter({ slug, initialViews }: PostViewCounterProps) {
  const [views, setViews] = useState(initialViews);
  const requestedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (requestedSlug.current === slug) return;
    requestedSlug.current = slug;

    const storageKey = `blog-post-viewed:${slug}`;

    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Counting still works when browser storage is disabled.
    }

    void fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("浏览量更新失败");
        return (await response.json()) as { views: number };
      })
      .then((data) => setViews(data.views))
      .catch(() => {
        requestedSlug.current = null;
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // The current count remains visible if storage or the API is unavailable.
        }
      });
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1.5">
      <Eye size={14} />
      {views} 次浏览
    </span>
  );
}
