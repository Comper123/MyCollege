"use client";

import PublicHeader from "./PublicHeader";
import PrivateHeader from "./PrivateHeader";
import { useAuth } from "@/context/AuthContext";

export default function ConditionalHeader() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <PrivateHeader /> : <PublicHeader />;
}