import { Document } from 'langchain';
import { DirectoryLoader } from '@langchain/classic/document_loaders/fs/directory';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { JSONLoader } from '@langchain/classic/document_loaders/fs/json';
import {
  RecursiveCharacterTextSplitter,
  RecursiveCharacterTextSplitterParams,
} from '@langchain/textsplitters';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';

import logger from '../utils/logger';
import env from '../utils/env';
import { OllamaEmbeddings } from '@langchain/ollama';
import { DocumentInterface } from '@langchain/core/documents';

class RAG {
  private static instance: RAG;

  private embeddings: OllamaEmbeddings;
  private vectorStore: MemoryVectorStore;
  private BATCH_SIZE = env.RAG_BUTCH_SIZE;

  constructor() {
    if (RAG.instance) {
      throw new Error('Instance of RAG already exist');
    }

    this.embeddings = new OllamaEmbeddings({
      model: env.RAG_OLLAMA_MODEL,
      baseUrl: env.RAG_OLLAMA_BASE_URL,
      maxConcurrency: this.BATCH_SIZE,
    });

    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  static getInstance() {
    if (!RAG.instance) {
      RAG.instance = new RAG();
    }

    return RAG.instance;
  }

  private async readDirToDocuments(dirPath: string): Promise<Document[]> {
    logger.info(`Сканируем каталог по пути: ${dirPath}`);
    const loader = new DirectoryLoader(
      dirPath,
      {
        '.ts': (path) => new TextLoader(path),
        '.tsx': (path) => new TextLoader(path),
        '.js': (path) => new TextLoader(path),
        '.py': (path) => new TextLoader(path),
        // '.json': (path) => new JSONLoader(path),
      },
      true
    );

    const documents = await loader.load();
    logger.info(`Загружено ${documents.length} файлов`);
    return documents;
  }

  private sortDocs(docs: Document[]): {
    pythonDocs: Document[];
    jsDocs: Document[];
    otherDocs: Document[];
  } {
    const sortedDocs = docs.reduce<ReturnType<typeof this.sortDocs>>(
      (acc, doc) => {
        const docPath = doc.metadata.source as string;
        if (docPath.endsWith('.py')) {
          acc.pythonDocs.push(doc);
        } else if (docPath.endsWith('.js') || docPath.endsWith('.ts')) {
          acc.jsDocs.push(doc);
        } else {
          acc.otherDocs.push(doc);
        }

        return acc;
      },
      { pythonDocs: [], jsDocs: [], otherDocs: [] }
    );
    logger.info(
      'Отсортированные файлы:' +
      `\n\tjs/ts=${sortedDocs.jsDocs.length}` +
      `\n\tpy=${sortedDocs.pythonDocs.length}` +
      `\n\tother=${sortedDocs.otherDocs.length}`
    );

    return sortedDocs;
  }

  private async splitDocuments(docs: Document[]): Promise<Document[]> {
    const settings: Partial<RecursiveCharacterTextSplitterParams> = {
      chunkSize: env.RAG_CHUNK_SIZE,
      chunkOverlap: env.RAG_CHUNK_OVERLAP,
    };

    const pythonSplitter = RecursiveCharacterTextSplitter.fromLanguage('python', settings);
    const jsSplitter = RecursiveCharacterTextSplitter.fromLanguage('js', settings);
    const otherSplitter = new RecursiveCharacterTextSplitter(settings);

    const sortedDocs = this.sortDocs(docs);
    const splittedDocs: Document[] = [];

    const chunks = splittedDocs.concat(
      await pythonSplitter.splitDocuments(sortedDocs.pythonDocs),
      await jsSplitter.splitDocuments(sortedDocs.jsDocs),
      await otherSplitter.splitDocuments(sortedDocs.otherDocs)
    );

    return chunks.filter((chunk) => chunk.pageContent && chunk.pageContent.trim().length > 0);
  }

  private async vectorize(chunks: Document[]) {
    logger.info(`Векторизуем ${chunks.length} чанков`);
    for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
      const batch = chunks.slice(i, i + this.BATCH_SIZE);
      logger.info(
        `Обработка пакета чанков: ${i} - ${Math.min(i + this.BATCH_SIZE, chunks.length)} из ${chunks.length
        }`
      );

      await this.vectorStore.addDocuments(batch);
      logger.info(`[OK] Чанки обработаны`);
    }

    logger.info(`Векторизация ${chunks.length} чанков прошла успешно`);
  }

  public async loadRepo(repoPaths: string | string[]) {
    const repos = Array.isArray(repoPaths) ? repoPaths : [repoPaths];
    for (const repo of repos) {
      const docs = await this.readDirToDocuments(repo);
      const chunks = await this.splitDocuments(docs);
      await this.vectorize(chunks);
    }
  }

  public async similaritySearch(query: string): Promise<DocumentInterface[]> {
    logger.info(`Поиск в RAG: ${query}`);
    const result = await this.vectorStore.similaritySearch(query);
    return result;
  }

  public async similaritySearchWithScore(query: string): Promise<[DocumentInterface, number][]> {
    logger.info(`Поиск в RAG: ${query}`);
    const result = await this.vectorStore.similaritySearchWithScore(query);
    return result;
  }
}

const rag = RAG.getInstance();

export default rag;
