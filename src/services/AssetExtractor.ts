import { Asset } from '../domain/Article';
import { SimpleHTMLParser } from '../utils/htmlParser';

export interface ExtractedAsset {
  type: 'image' | 'css' | 'font' | 'other';
  srcUrl: string;
}

export class AssetExtractor {
  extract(html: string, baseUrl: string): ExtractedAsset[] {
    const assets: ExtractedAsset[] = [];
    const seen = new Set<string>();

    // Extract images
    const images = SimpleHTMLParser.extractImages(html);
    images.forEach(src => {
      const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
      if (absoluteUrl && !seen.has(absoluteUrl)) {
        assets.push({ type: 'image', srcUrl: absoluteUrl });
        seen.add(absoluteUrl);
      }
    });

    // Extract CSS links
    const cssLinks = SimpleHTMLParser.extractLinks(html, 'stylesheet');
    cssLinks.forEach(href => {
      const absoluteUrl = this.makeAbsoluteUrl(href, baseUrl);
      if (absoluteUrl && !seen.has(absoluteUrl)) {
        assets.push({ type: 'css', srcUrl: absoluteUrl });
        seen.add(absoluteUrl);
      }
    });

    // Extract background images from inline styles
    const bgImages = this.extractBackgroundImages(html);
    bgImages.forEach(url => {
      const absoluteUrl = this.makeAbsoluteUrl(url, baseUrl);
      if (absoluteUrl && !seen.has(absoluteUrl)) {
        assets.push({ type: 'image', srcUrl: absoluteUrl });
        seen.add(absoluteUrl);
      }
    });

    return assets;
  }

  private extractBackgroundImages(html: string): string[] {
    const urls: string[] = [];
    const styleRegex = /style=["'][^"']*background[^"']*:([^"']*)/gi;
    let match;

    while ((match = styleRegex.exec(html)) !== null) {
      const urlMatch = match[1].match(/url\(['"]?([^'"()]+)['"]?\)/);
      if (urlMatch) {
        urls.push(urlMatch[1]);
      }
    }

    return urls;
  }

  private makeAbsoluteUrl(url: string, baseUrl: string): string | null {
    try {
      // Skip data URLs
      if (url.startsWith('data:')) {
        return null;
      }

      // Skip blob URLs
      if (url.startsWith('blob:')) {
        return null;
      }

      // If already absolute, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // Make absolute
      const base = new URL(baseUrl);
      const absolute = new URL(url, base);
      return absolute.href;
    } catch {
      return null;
    }
  }

  filterAssetsByType(
    assets: ExtractedAsset[],
    options: {
      images?: boolean;
      styles?: boolean;
      fonts?: boolean;
    },
  ): ExtractedAsset[] {
    return assets.filter(asset => {
      if (asset.type === 'image' && options.images === false) return false;
      if (asset.type === 'css' && options.styles === false) return false;
      if (asset.type === 'font' && options.fonts === false) return false;
      return true;
    });
  }
}
