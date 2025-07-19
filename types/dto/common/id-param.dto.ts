import { z } from "zod";

export const IdParamSchema = z.object({
  id: z.string().nonempty('id is required'),
});
export type IdParamDTO = z.infer<typeof IdParamSchema>; 