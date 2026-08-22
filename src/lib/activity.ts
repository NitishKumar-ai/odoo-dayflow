import "server-only";
import { db, activityLog } from "@/db";

export async function logActivity(employeeId: string, kind: string, message: string) {
  await db.insert(activityLog).values({ employeeId, kind, message });
}
