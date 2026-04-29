'use client';


import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/db/schema";
import AccessDeniedBlock from "./AcessDeniedBlock";
import Skeleton from "../ui/Skeleton";


export default function ProtectedBlock({ allowedRoles = [], children, isHide = false } : { 
  allowedRoles?: UserRole[];
  children: React.ReactNode;
  isHide?: boolean;
}){
  const { user, isLoading } = useAuth();

  if (isLoading) return <Skeleton/>

  if (allowedRoles.length === 0 || (user?.role && allowedRoles.includes(user?.role))) {
    return <>{children}</>;
  }
  if (isHide) return null;
  
  return <AccessDeniedBlock/>;
}