"use client";

import { useState } from "react";
import { Block } from "@/components/blocks/Block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import EquipmentList from "@/components/pages/dashboard/equipment/EquipmentList";
import LotsList from "@/components/pages/dashboard/equipment/LotsList";

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<"equipment" | "lots">("equipment");

  return (
    <main className="w-full h-full">
      <Block>
        <h1 className="text-xl font-semibold">Управление оборудованием</h1>
        <p className="text-sm text-gray-400 mb-3">
          Учёт оборудования, партий и перемещений
        </p>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="equipment">Оборудование</TabsTrigger>
            <TabsTrigger value="lots">Партии</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment">
            <EquipmentList />
          </TabsContent>

          <TabsContent value="lots">
            <LotsList />
          </TabsContent>
        </Tabs>
      </Block>
    </main>
  );
}