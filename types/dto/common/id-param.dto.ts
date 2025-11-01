import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().nonempty('id is required'),
});
export type IdParamDTO = z.infer<typeof IdParamSchema>;

export const UserIdParamSchema = z.object({
  userId: z.string().nonempty('userId is required'),
});
export type UserIdParamDTO = z.infer<typeof UserIdParamSchema>;
