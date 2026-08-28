import z from "zod";

export const PlannerResultSchema = z.object({
  promptPlan: z.string().nonempty().describe('Сгенерированный промпт план - работы, разбитый по ролям для всех')
})

export type PlannerResult = z.infer<typeof PlannerResultSchema>

export const UIWorkerResutlSchema = z.object({
  coderUIPath: z.string().nonempty().describe('UI путь из компонентов и их кодов, локаторов и прочего для написания тест-кейса')
})

export type UIWorkerResult = z.infer<typeof UIWorkerResutlSchema>

export const PlaneReviewerResultSchema = z.object({
  uiWorkerFeedback: z.string().describe('Замечания по UI пути на соответствите плану'),
  isApproved: z.boolean().describe('Утверждён ли путь')
});

export type PlaneReviewerResult = z.infer<typeof PlaneReviewerResultSchema>;