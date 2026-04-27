'use client';


import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/db/schema";
import AccessDeniedBlock from "./AcessDeniedBlock";


export default function ProtectedBlock({ allowedRoles = [], children } : { 
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}){
  const { user } = useAuth();
  if (allowedRoles.length === 0 || (user?.role && allowedRoles.includes(user?.role))) {
    return <>{children}</>;
  }
  return <AccessDeniedBlock/>;
}