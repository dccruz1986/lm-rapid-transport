import { InfoContent } from "@/components/marketing";
export default function Page() {
  return <InfoContent kind="contact" phone={process.env.CONTACT_PHONE} email={process.env.CONTACT_EMAIL} />;
}
