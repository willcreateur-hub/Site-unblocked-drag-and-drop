export type SupportedEngine = 'html' | 'js' | 'python' | 'lua' | 'csharp' | 'cpp' | 'wasm';

export type AssetCategory = 'image' | '3d' | 'audio' | 'code' | 'data' | 'other';

export interface VirtualFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  category: AssetCategory;
  blobUrl: string;
  text?: string;
  rawBytes?: Uint8Array;
}

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  author?: string;
  version?: string;
  engine: SupportedEngine;
  entryFile: string;
  coverImage?: string;
  tags: string[];
  filesCount: number;
  totalSize: number;
  uploadedAt: number;
  isSample?: boolean;
}

export interface LoadedGame {
  metadata: GameMetadata;
  files: Map<string, VirtualFile>;
  fileList: VirtualFile[];
}

export interface LogMessage {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}
