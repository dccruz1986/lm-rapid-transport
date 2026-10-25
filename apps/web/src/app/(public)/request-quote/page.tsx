import { RequestForm } from "@/components/request-form";
export default function Page() {
  return <RequestForm phone={process.env.CONTACT_PHONE ?? ""} />;
}
