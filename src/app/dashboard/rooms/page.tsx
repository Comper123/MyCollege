import ProtectedBlock from "@/components/blocks/ProtectedBlock";

export default function RoomsPage(){
  // const {isMy = }
  return (
    <main className="w-full h-full">
      <ProtectedBlock allowedRoles={["laborant"]}>
        <p></p>
      </ProtectedBlock>
    </main>
  )
}