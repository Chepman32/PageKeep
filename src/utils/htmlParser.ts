// Simple HTML parser for React Native
export class SimpleHTMLParser {
  static extractText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static extractTitle(html: string): string {
    // Try Open Graph title
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)/i,
    );
    if (ogMatch) return ogMatch[1];

    // Try Twitter title
    const twitterMatch = html.match(
      /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)/i,
    );
    if (twitterMatch) return twitterMatch[1];

    // Try title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) return titleMatch[1].trim();

    // Try first h1
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();

    return 'Untitled';
  }

  static extractByline(html: string): string | undefined {
    // Try meta author
    const authorMatch = html.match(
      /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)/i,
    );
    if (authorMatch) return authorMatch[1];

    return undefined;
  }

  static extractSiteName(html: string): string | undefined {
    const siteMatch = html.match(
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)/i,
    );
    if (siteMatch) return siteMatch[1];

    return undefined;
  }

  static extractMainContent(html: string): string {
    // Try to find article content
    let content = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (content) return content[1];

    // Try main tag
    content = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (content) return content[1];

    // Try content classes
    content = html.match(
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    if (content) return content[1];

    // Fallback to body
    content = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (content) return content[1];

    return html;
  }

  static removeUnwantedElements(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  }

  static extractImages(html: string): string[] {
    const images: string[] = [];
    const imgRegex = /<img[^>]*src=["']([^"']*)/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  static extractLinks(
    html: string,
    type: 'stylesheet' | 'all' = 'all',
  ): string[] {
    const links: string[] = [];
    let linkRegex: RegExp;

    if (type === 'stylesheet') {
      linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*)/gi;
    } else {
      linkRegex = /<link[^>]*href=["']([^"']*)/gi;
    }

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  static replaceUrls(html: string, urlMap: Map<string, string>): string {
    let result = html;

    urlMap.forEach((newUrl, oldUrl) => {
      const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOldUrl, 'g');
      result = result.replace(regex, newUrl);
    });

    return result;
  }
}
