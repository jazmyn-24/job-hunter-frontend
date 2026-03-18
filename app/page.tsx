"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "../lib/session";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(isOnboarded() ? "/dashboard" : "/auth");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
