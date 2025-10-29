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
      
      // For now, let's be very conservative with content extraction
      // Just remove scripts and keep most of the original structure
      let content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
      
      // Try to extract just the body content if it exists
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1];
      }
      
      const textContent = this.extractPlainText(content);
      
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
      
      // Fallback: return the original HTML with minimal processing
      return {
        title: this.extractTitle(html) || 'Article',
        content: html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ''),
        textContent: this.extractPlainText(html),
        length: html.length,
        excerpt: 'Article content',
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

  calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
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