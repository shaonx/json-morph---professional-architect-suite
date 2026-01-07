
import { StreamingJsonParser } from '../utils/streamingJsonParser';

self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data as { file: File };
  const parser = new StreamingJsonParser();
  const reader = file.stream().getReader();
  const totalSize = file.size;
  let processedSize = 0;

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      processedSize += value.length;
      const chunk = decoder.decode(value, { stream: true });
      parser.parseChunk(chunk);

      // 定期发送进度，避免通信过于频繁
      if (processedSize % (1024 * 1024) === 0 || processedSize === totalSize) {
        self.postMessage({
          type: 'PROGRESS',
          stats: parser.stats,
          progress: (processedSize / totalSize) * 100,
          processedBytes: processedSize,
          totalBytes: totalSize
        });
      }
    }

    self.postMessage({
      type: 'DONE',
      stats: parser.stats
    });
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};
