export interface Asset {
  id: string;
  articleId: string;
  type: 'image' | 'css' | 'font' | 'other';
  srcUrl: string;
  localPath: string;
  byteSize: number;
  mime: string;
  status: 'queued' | 'downloading' | 'done' | 'failed';
  hash: string;
}
