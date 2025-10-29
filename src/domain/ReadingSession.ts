export interface ReadingSession {
  id: string;
  articleId: string;
  startedAt: number;
  lastPositionSelector?: string;
  lastScrollY: number;
}
