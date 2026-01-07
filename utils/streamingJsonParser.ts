
export interface StreamStats {
  keyCount: number;
  maxDepth: number;
  typeDistribution: Record<string, number>;
  totalBytes: number;
  processedBytes: number;
}

export type ParserState = 
  | 'VALUE' 
  | 'STRING' 
  | 'STRING_ESCAPE' 
  | 'NUMBER' 
  | 'TRUE' 
  | 'FALSE' 
  | 'NULL' 
  | 'OBJECT_KEY_START' 
  | 'OBJECT_KEY' 
  | 'OBJECT_COLON' 
  | 'AFTER_VALUE';

/**
 * 一个极简的流式 JSON 解析状态机，用于统计大文件的元数据。
 * 它不构建完整的对象树，因此内存占用极低。
 */
export class StreamingJsonParser {
  private state: ParserState = 'VALUE';
  private depth = 0;
  private stack: ('OBJECT' | 'ARRAY')[] = [];
  
  public stats: StreamStats = {
    keyCount: 0,
    maxDepth: 0,
    typeDistribution: {},
    totalBytes: 0,
    processedBytes: 0
  };

  private incrementType(type: string) {
    this.stats.typeDistribution[type] = (this.stats.typeDistribution[type] || 0) + 1;
  }

  public parseChunk(chunk: string) {
    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.consume(char);
    }
  }

  private consume(char: string) {
    // 简单的状态机逻辑
    switch (this.state) {
      case 'VALUE':
        if (/\s/.test(char)) return;
        if (char === '{') {
          this.depth++;
          if (this.depth > this.stats.maxDepth) this.stats.maxDepth = this.depth;
          this.stack.push('OBJECT');
          this.state = 'OBJECT_KEY_START';
          this.incrementType('object');
        } else if (char === '[') {
          this.depth++;
          if (this.depth > this.stats.maxDepth) this.stats.maxDepth = this.depth;
          this.stack.push('ARRAY');
          this.state = 'VALUE';
          this.incrementType('array');
        } else if (char === '"') {
          this.state = 'STRING';
          this.incrementType('string');
        } else if (/[0-9-]/.test(char)) {
          this.state = 'NUMBER';
          this.incrementType('number');
        } else if (char === 't') {
          this.state = 'TRUE';
          this.incrementType('boolean');
        } else if (char === 'f') {
          this.state = 'FALSE';
          this.incrementType('boolean');
        } else if (char === 'n') {
          this.state = 'NULL';
          this.incrementType('null');
        } else if (char === ']' || char === '}') {
          this.handleClosing(char);
        }
        break;

      case 'OBJECT_KEY_START':
        if (/\s/.test(char)) return;
        if (char === '"') {
          this.state = 'OBJECT_KEY';
          this.stats.keyCount++;
        } else if (char === '}') {
          this.handleClosing('}');
        }
        break;

      case 'OBJECT_KEY':
        if (char === '"') {
          this.state = 'OBJECT_COLON';
        }
        break;

      case 'OBJECT_COLON':
        if (char === ':') {
          this.state = 'VALUE';
        }
        break;

      case 'STRING':
        if (char === '\\') {
          this.state = 'STRING_ESCAPE';
        } else if (char === '"') {
          this.state = 'AFTER_VALUE';
        }
        break;

      case 'STRING_ESCAPE':
        this.state = 'STRING';
        break;

      case 'NUMBER':
        if (/[^0-9.eE+-]/.test(char)) {
          this.state = 'AFTER_VALUE';
          this.consume(char); // Re-process
        }
        break;

      case 'TRUE':
      case 'FALSE':
      case 'NULL':
        if (/[^a-z]/.test(char)) {
          this.state = 'AFTER_VALUE';
          this.consume(char);
        }
        break;

      case 'AFTER_VALUE':
        if (/\s/.test(char)) return;
        if (char === ',') {
          const currentContainer = this.stack[this.stack.length - 1];
          if (currentContainer === 'OBJECT') {
            this.state = 'OBJECT_KEY_START';
          } else {
            this.state = 'VALUE';
          }
        } else if (char === '}' || char === ']') {
          this.handleClosing(char);
        }
        break;
    }
  }

  private handleClosing(char: string) {
    this.depth--;
    this.stack.pop();
    this.state = 'AFTER_VALUE';
  }
}
