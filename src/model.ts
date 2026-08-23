import { ChatOpenAI } from '@langchain/openai';
import env from './utils/env';

function getModel() {
  return new ChatOpenAI({
    apiKey: env.API_KEY,
    model: env.MODEL as string,
    configuration: {
      baseURL: env.BASE_URL,
    },
    temperature: 0.7,
  });
}

export default getModel;
