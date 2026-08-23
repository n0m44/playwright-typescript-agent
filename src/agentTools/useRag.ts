import { tool } from 'langchain';
import z from 'zod';
import rag from '../RAG';

const useRag = tool(
  async (params: { query: string; withScore?: boolean }) => {
    let result;
    if (params.withScore) {
      result = await rag.similaritySearchWithScore(params.query);
    } else {
      result = await rag.similaritySearch(params.query);
    }

    return result;
  },
  {
    name: 'useRag',
    description: 'Use RAG to search things in automation framework repository',
    schema: z.object({
      query: z.string().describe('Query to find things'),
      withScore: z.boolean().optional().default(false).describe(''),
    }),
  }
);

export default useRag;
