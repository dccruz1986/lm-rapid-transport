import { intakeRoute, removeIntakeFile, uploadIntake } from "@lm/data/intake";
export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = intakeRoute(uploadIntake);
export const DELETE = intakeRoute(removeIntakeFile);
