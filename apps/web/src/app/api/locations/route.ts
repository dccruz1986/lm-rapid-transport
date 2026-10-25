import { intakeRoute } from "@lm/data/intake";
import { locationRequest } from "@lm/data/locations";
export const runtime = "nodejs";
export const POST = intakeRoute(locationRequest);
