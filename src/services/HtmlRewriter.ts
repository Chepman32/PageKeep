export class HtmlRewriter {
  rewrite(
    html: string,
    baseUrl: string,
    imageMap: Map<string, string>,
  ): string {
    // Start with the original HTML
    let processedHtml = html;

    // Remove scripts and extract noscript content
    processedHtml = processedHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi, '$1');

    // Convert lazy-loading attributes to standard ones
    processedHtml = this.convertLazyLoadAttributes(processedHtml);

    // Replace all image URLs with local paths
    imageMap.forEach((localPath, remoteUrl) => {
      // Escape special regex characters
      const escapedUrl = remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedUrl, 'g');
      processedHtml = processedHtml.replace(regex, localPath);

      // Also replace HTML-entity-encoded version (&amp; instead of &)
      const encodedUrl = remoteUrl.replace(/&/g, '&amp;');
      const escapedEncodedUrl = encodedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const encodedRegex = new RegExp(escapedEncodedUrl, 'g');
      processedHtml = processedHtml.replace(encodedRegex, localPath);
    });

    // Wrap in proper HTML structure with base styles and theme placeholder
    const readerCSS = this.getBaseReaderCSS();
    const bridgeScript = this.getBridgeScript();

    const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${baseUrl}">
  <style id="pn-base">${readerCSS}</style>
  <style id="pn-theme"></style>
</head>
<body class="pn-reader">
${processedHtml}
<script>${bridgeScript}</script>
</body>
</html>`;

    return finalHtml;
  }

  private convertLazyLoadAttributes(html: string): string {
    // Convert data-src to src for images
    html = html.replace(
      /<img([^>]+)data-src=["']([^"']+)["']/gi,
      (match, before, dataSrc) => {
        // If there's already a src, replace it, otherwise add it
        if (/src=["']/.test(before)) {
          return match.replace(/src=["'][^"']*["']/, `src="${dataSrc}"`);
        } else {
          return `<img${before}src="${dataSrc}"`;
        }
      }
    );

    // Convert data-srcset to srcset
    html = html.replace(
      /<img([^>]+)data-srcset=["']([^"']+)["']/gi,
      (match, before, dataSrcset) => {
        if (/srcset=["']/.test(before)) {
          return match.replace(/srcset=["'][^"']*["']/, `srcset="${dataSrcset}"`);
        } else {
          return `<img${before}srcset="${dataSrcset}"`;
        }
      }
    );

    return html;
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
