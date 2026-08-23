import { tool } from 'langchain';
import z from 'zod';
import logger from '../utils/logger';
import { UseLogMessageTypes } from './types';

const useLog = tool(
  (params: { msg: string; type: UseLogMessageTypes }) => {
    switch (params.type) {
      case UseLogMessageTypes.INFO:
        logger.info(`AI: ${params.msg}`);
        break;
      case UseLogMessageTypes.ERROR:
        logger.error(`AI: ${params.msg}`);
        break;
      case UseLogMessageTypes.WARN:
        logger.warn(`AI: ${params.msg}`);
        break;
    }
  },
  {
    name: 'useLog',
    description: 'Log and output any info',
    schema: z.object({
      msg: z.string().describe('Any msg to log'),
      type: z.enum(UseLogMessageTypes).describe('Message types, select one of this'),
    }),
  }
);

export default useLog;
