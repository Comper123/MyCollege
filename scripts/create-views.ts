import { createAllViews, dropAllViews } from "@/lib/db/views";

async function main() {
  const command = process.argv[2];

  if (command === "drop") {
    console.log("Dropping all views...");
    await dropAllViews();
    console.log("All views dropped successfully");
  } else {
    console.log("Creating all views...");
    await createAllViews();
    console.log("All views created successfully");
  }

  process.exit(0);
}

main().catch(console.error);