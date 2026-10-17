import { requireStaff } from "@lm/data/server";
import { PricingSettings } from "@/components/pricing-settings";
export default async function Page() {
  const { db } = await requireStaff("pricing.manage");
  const [settings, history] = await Promise.all([
    db.from("pricing_settings").select("*").single(),
    db
      .from("pricing_change_history")
      .select("*")
      .eq("entity_type", "pricing_settings")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (settings.error) throw settings.error;
  if (history.error) throw history.error;
  return <PricingSettings settings={settings.data} history={history.data} />;
}
