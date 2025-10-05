import type { z } from "zod";
import { AssignmentCreateSchema, AssignmentUpdateSchema } from "./schema";

export type AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;
export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;
