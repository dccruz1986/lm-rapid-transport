import { requireStaff } from "@lm/data/server";
import { NewRequestForm } from "@/components/new-request-form";

export default async function Page() {
  await requireStaff("requests.create");
  return <NewRequestForm />;
}
