"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FeedPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-white">Feed Page - Simplified Version</div>
    </div>
  );
}