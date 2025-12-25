import { decode } from 'he';

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
      // Extract metadata first
      const title = this.extractTitle(html);
      const byline = this.extractByline(html);
      const siteName = this.extractSiteName(html);

      // Preserve the original page structure but strip unsafe elements
      const sanitizedHtml = this.sanitizeHtml(html);

      // Use body content for text statistics to avoid nav/footers as much as possible
      const bodyMatch = sanitizedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyHtml = bodyMatch ? bodyMatch[1] : sanitizedHtml;
      const textContent = this.extractPlainText(bodyHtml);

      return {
        title,
        byline,
        content: sanitizedHtml,
        textContent,
        length: textContent.length,
        excerpt: this.createExcerpt(textContent),
        siteName,
      };
    } catch (error) {
      console.error('Content extraction error:', error);

      const sanitized = this.sanitizeHtml(html);
      const fallbackText = this.extractPlainText(sanitized);

      // Fallback: return the original HTML with minimal processing
      return {
        title: this.extractTitle(html) || 'Article',
        byline: this.extractByline(html),
        content: sanitized,
        textContent: fallbackText,
        length: fallbackText.length,
        excerpt: this.createExcerpt(fallbackText),
        siteName: this.extractSiteName(html),
      };
    }
  }

  private extractTitle(html: string): string {
    // Try Open Graph title
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)/i,
    );
    if (ogMatch) return decode(ogMatch[1]);

    // Try title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) return decode(titleMatch[1].trim());

    // Try first h1
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) return decode(h1Match[1].trim());

    return 'Untitled';
  }

  private extractByline(html: string): string | undefined {
    const authorMatch = html.match(
      /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)/i,
    );
    if (authorMatch) return decode(authorMatch[1]);
    return undefined;
  }

  private extractSiteName(html: string): string | undefined {
    const siteMatch = html.match(
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)/i,
    );
    if (siteMatch) return decode(siteMatch[1]);
    return undefined;
  }

  extractPlainText(html: string): string {
    return decode(
      html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  private createExcerpt(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  calculateReadingTime(wordCount: number, wordsPerMinute: number = 300): number {
    return Math.ceil(wordCount / wordsPerMinute);
  }

  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      // Extract hostname from the URL string
      const match = urlObj.href.match(/^https?:\/\/([^\/]+)/);
      if (match) {
        return match[1].replace('www.', '');
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private sanitizeHtml(html: string): string {
    return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  }
}
