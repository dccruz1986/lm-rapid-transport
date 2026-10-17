import { finalizeIntake, intakeRoute } from "@lm/data/intake";
export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = intakeRoute(finalizeIntake);
