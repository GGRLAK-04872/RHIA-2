import { z } from "zod";

export const appStatusSchema = z.object({
  version: z.string().min(1),
  stage: z.literal(0),
  mode: z.literal("local-only"),
  apiEnabled: z.literal(false),
  persistenceEnabled: z.literal(false),
});

export type AppStatus = z.infer<typeof appStatusSchema>;
