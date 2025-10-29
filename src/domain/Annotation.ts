export interface Annotation {
  id: string;
  articleId: string;
  range: TextRange;
  text?: string;
  createdAt: number;
  color: string;
}

export interface TextRange {
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
}
