import { z } from "zod";

/** Production UUIDs and demo fixture ids (e.g. demo-call-001). */
export const socialCallIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[0-9a-f-]{36}$|^demo-call-\d{3}$/i, "invalid_call_id");
