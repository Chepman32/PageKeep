import { Asset } from '../domain/Article';
import { FileSystem } from '../utils/fileSystem';

export class HtmlRewriter {
  async rewrite(
    html: string,
    articleId: string,
    assets: Asset[],
  ): Promise<string> {
    // Create asset URL map
    const assetMap = new Map<string, string>();
    assets.forEach(asset => {
      // Use the hash-based filename
      const extension = FileSystem.getExtensionFromUrl(asset.srcUrl) || 'bin';
      assetMap.set(asset.srcUrl, `./assets/${asset.hash}.${extension}`);
    });

    // Start with the original HTML
    let processedHtml = html;

    // Remove only the most problematic elements
    processedHtml = processedHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Replace asset URLs
    assetMap.forEach((newUrl, oldUrl) => {
      // Simple string replacement for now
      processedHtml = processedHtml.replace(
        new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newUrl,
      );
    });

    // Add our CSS and JavaScript
    const readerCSS = this.getBaseReaderCSS();
    const bridgeScript = this.getBridgeScript();

    // Ensure we have a proper HTML structure
    if (!processedHtml.includes('<!DOCTYPE html>')) {
      processedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style id="pn-base">${readerCSS}</style>
  <style id="pn-theme"></style>
</head>
<body>
${processedHtml}
<script>${bridgeScript}</script>
</body>
</html>`;
    } else {
      // Try to inject into existing structure
      if (processedHtml.includes('</head>')) {
        processedHtml = processedHtml.replace(
          '</head>',
          `<style id="pn-base">${readerCSS}</style><style id="pn-theme"></style></head>`,
        );
      }

      if (processedHtml.includes('</body>')) {
        processedHtml = processedHtml.replace(
          '</body>',
          `<script>${bridgeScript}</script></body>`,
        );
      }
    }

    return processedHtml;
  }

  injectTheme(html: string, themeCSS: string): string {
    return html.replace(
      /<style id="pn-theme">.*?<\/style>/s,
      `<style id="pn-theme">${themeCSS}</style>`,
    );
  }

  injectBridge(html: string): string {
    const bridgeScript = this.getBridgeScript();
    if (html.includes('</body>')) {
      return html.replace('</body>', `<script>${bridgeScript}</script></body>`);
    }
    return `${html}<script>${bridgeScript}</script>`;
  }

  private getBaseReaderCSS(): string {
    return `
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
        font-size: 17px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        max-width: 100%;
        overflow-x: hidden;
      }
      
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
      }
      
      p {
        margin: 0 0 1em 0;
      }
      
      h1, h2, h3, h4, h5, h6 {
        margin: 1.5em 0 0.5em 0;
        font-weight: 600;
        line-height: 1.3;
      }
      
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      
      a {
        color: #3A84F7;
        text-decoration: none;
      }
      
      a:active {
        opacity: 0.7;
      }
      
      blockquote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 3px solid #ddd;
        font-style: italic;
      }
      
      pre, code {
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
      }
      
      pre {
        padding: 1em;
        overflow-x: auto;
        background: #f5f5f5;
        border-radius: 4px;
      }
      
      ul, ol {
        margin: 1em 0;
        padding-left: 2em;
      }
      
      li {
        margin: 0.5em 0;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      
      th, td {
        padding: 0.5em;
        border: 1px solid #ddd;
        text-align: left;
      }
      
      th {
        font-weight: 600;
        background: #f5f5f5;
      }
      
      mark, .highlight {
        background-color: #FFF59D;
        padding: 0 2px;
      }
    `;
  }

  private getBridgeScript(): string {
    return `
      (function() {
        window.PageNestBridge = {
          reportScroll: function() {
            try {
              const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'scroll',
                progress: Math.max(0, Math.min(1, scrollPercent || 0)),
                scrollY: window.scrollY
              }));
            } catch (e) {
              console.error('Error reporting scroll:', e);
            }
          },
          
          setTheme: function(css) {
            try {
              const style = document.getElementById('pn-theme');
              if (style) {
                style.textContent = css;
              }
            } catch (e) {
              console.error('Error setting theme:', e);
            }
          }
        };
        
        function throttle(func, wait) {
          let timeout;
          return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
          };
        }
        
        // Auto-report scroll
        window.addEventListener('scroll', throttle(window.PageNestBridge.reportScroll, 100));
        
        // Report initial scroll position
        setTimeout(window.PageNestBridge.reportScroll, 100);
      })();
    `;
  }
}
