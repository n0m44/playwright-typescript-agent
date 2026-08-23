import { configDotenv } from 'dotenv';

configDotenv();

const env = {
  API_KEY: process.env.API_KEY,
  MODEL: process.env.MODEL,
  BASE_URL: process.env.BASE_URL,
  SKILLS_RELATIVE: process.env.SKILLS_RELATIVE,
  PROMPT_INVOKE_RELATIVE: process.env.PROMPT_INVOKE_RELATIVE,
  PROMPT_SYSTEM_RELATIVE: process.env.PROMPT_SYSTEM_RELATIVE,
  TARGET_AQA_PATHS: JSON.parse(process.env.TARGET_AQA_PATHS || '') as string[],
  RAG_CHUNK_SIZE: parseInt(process.env.RAG_CHUNK_SIZE || '500'),
  RAG_CHUNK_OVERLAP: parseInt(process.env.RAG_CHUNK_OVERLAP || '50'),
  RAG_BUTCH_SIZE: parseInt(process.env.RAG_BUTCH_SIZE || '10'),
  RAG_OLLAMA_MODEL: process.env.RAG_OLLAMA_MODEL,
};

export default env;
