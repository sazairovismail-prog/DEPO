"use client";

import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("@/components/ClientLayout"), {
  ssr: false,
});

export default function DynamicHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
