import { z } from "zod";

export const matchCompositionSchema = z
  .object({
    matchMode: z.enum(["ONE_V_ONE", "TWO_V_TWO"]),
    sideAPlayerIds: z.array(z.uuid()),
    sideBPlayerIds: z.array(z.uuid()),
  })
  .superRefine((value, context) => {
    const expectedPlayersPerSide = value.matchMode === "ONE_V_ONE" ? 1 : 2;

    if (value.sideAPlayerIds.length !== expectedPlayersPerSide) {
      context.addIssue({
        code: "custom",
        path: ["sideAPlayerIds"],
        message: `Side A phải có ${expectedPlayersPerSide} người.`,
      });
    }

    if (value.sideBPlayerIds.length !== expectedPlayersPerSide) {
      context.addIssue({
        code: "custom",
        path: ["sideBPlayerIds"],
        message: `Side B phải có ${expectedPlayersPerSide} người.`,
      });
    }

    const allPlayerIds = [...value.sideAPlayerIds, ...value.sideBPlayerIds];
    if (new Set(allPlayerIds).size !== allPlayerIds.length) {
      context.addIssue({
        code: "custom",
        path: ["sideAPlayerIds"],
        message: "Một người chơi không thể xuất hiện hai lần trong cùng trận.",
      });
    }
  });

export type MatchComposition = z.infer<typeof matchCompositionSchema>;

export function validateMatchComposition(input: MatchComposition) {
  return matchCompositionSchema.safeParse(input);
}
