"use client";

import { useAuth } from "@/context/AuthContext";
import PublicHeader from "./PublicHeader";
import PrivateHeader from "./PrivateHeader";

export default function ConditionalHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // или скелетон
  }

  return isAuthenticated ? <PrivateHeader /> : <PublicHeader />;
}