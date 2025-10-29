import { SimpleHTMLParser } from '../utils/htmlParser';

export interface ReadableContent {
  title: string;
  byline?: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName?: string;
}

export class ReadabilityService {
  async extract(html: string, url: string): Promise<ReadableContent> {
    try {
      // Extract metadata
      const title = SimpleHTMLParser.extractTitle(html);
      const byline = SimpleHTMLParser.extractByline(html);
      const siteName = SimpleHTMLParser.extractSiteName(html);

      // Clean HTML and extract main content
      const cleanedHtml = SimpleHTMLParser.removeUnwantedElements(html);
      const content = SimpleHTMLParser.extractMainContent(cleanedHtml);
      const textContent = SimpleHTMLParser.extractText(content);

      return {
        title,
        byline,
        content,
        textContent,
        length: textContent.length,
        excerpt: this.createExcerpt(textContent),
        siteName,
      };
    } catch (error) {
      console.error('Content extraction error:', error);
      throw error;
    }
  }

  extractPlainText(html: string): string {
    return SimpleHTMLParser.extractText(html);
  }

  private createExcerpt(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;

    // Find the last space before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  calculateReadingTime(
    wordCount: number,
    wordsPerMinute: number = 200,
  ): number {
    return Math.ceil(wordCount / wordsPerMinute);
  }

  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
}
