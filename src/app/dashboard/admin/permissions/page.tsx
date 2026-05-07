"use client";

import RolePermissionsPanel from "@/components/pages/dashboard/admin/equipmentTypes/PermissionsPanel";


export default function PermissionsEditor() {
  return (
    <div className="mx-auto px-6 py-10 w-full">
      <h1 className="text-2xl font-bold mb-8">Управление доступом</h1>
      <RolePermissionsPanel
        onSave={async (perms) => {
          await fetch("/api/admin/permissions/roles", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(perms),
          });
        }}
      />
    </div>
  );
}