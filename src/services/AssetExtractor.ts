export interface ExtractedAsset {
  type: 'image' | 'css' | 'font' | 'other';
  srcUrl: string;
}

export class AssetExtractor {
  extract(html: string, baseUrl: string): ExtractedAsset[] {
    const assets: ExtractedAsset[] = [];
    const seen = new Set<string>();

    // Extract images from img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const url = this.makeAbsoluteUrl(match[1], baseUrl);
      if (url && !seen.has(url)) {
        assets.push({ type: 'image', srcUrl: url });
        seen.add(url);
      }
    }

    // Extract images from srcset
    const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const urls = this.parseSrcset(match[1]);
      urls.forEach(url => {
        const absoluteUrl = this.makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl && !seen.has(absoluteUrl)) {
          assets.push({ type: 'image', srcUrl: absoluteUrl });
          seen.add(absoluteUrl);
        }
      });
    }

    // Extract CSS from link tags
    const cssRegex =
      /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
    while ((match = cssRegex.exec(html)) !== null) {
      const url = this.makeAbsoluteUrl(match[1], baseUrl);
      if (url && !seen.has(url)) {
        assets.push({ type: 'css', srcUrl: url });
        seen.add(url);
      }
    }

    // Extract background images from inline styles
    const bgRegex = /background(?:-image)?:\s*url\(['"]?([^'"()]+)['"]?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
      const url = this.makeAbsoluteUrl(match[1], baseUrl);
      if (url && !seen.has(url)) {
        assets.push({ type: 'image', srcUrl: url });
        seen.add(url);
      }
    }

    // Extract fonts from @font-face
    const fontRegex = /@font-face[^}]*url\(['"]?([^'"()]+)['"]?\)/gi;
    while ((match = fontRegex.exec(html)) !== null) {
      const url = this.makeAbsoluteUrl(match[1], baseUrl);
      if (url && !seen.has(url)) {
        assets.push({ type: 'font', srcUrl: url });
        seen.add(url);
      }
    }

    return assets;
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

  private parseSrcset(srcset: string): string[] {
    return srcset
      .split(',')
      .map(entry => entry.trim().split(/\s+/)[0])
      .filter(Boolean);
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
