import { tool } from 'langchain';
import z from 'zod';
import evalCliCommand from '../utils/evalCliCommand';

const useCli = tool(
  async (params: { operation: string; timeout: number }) => {
    const result = await evalCliCommand(params.operation, params.timeout);
    return result;
  },
  {
    name: 'useCli',
    description: 'Launch any cli commands like in console and return result',
    schema: z.object({
      operation: z.string().describe('Command to evaluate'),
      timeout: z
        .number()
        .default(30000)
        .describe('Timeout of executing operation. Default timeout=30_000 ms'),
    }),
  }
);

export default useCli;
