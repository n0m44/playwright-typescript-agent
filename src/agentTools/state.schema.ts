import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "langchain";

export const AgentStateAnnotation = Annotation.Root({
  executorMessages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  reviewerMessages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  isApproved: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  reviewParseError: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  feedback: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  iteration: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
});