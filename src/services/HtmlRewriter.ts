import { Asset } from '../domain/Article';
import { FileSystem } from '../utils/fileSystem';
import { SimpleHTMLParser } from '../utils/htmlParser';

export class HtmlRewriter {
  async rewrite(
    html: string,
    articleId: string,
    assets: Asset[],
  ): Promise<string> {
    // Create asset URL map
    const assetMap = new Map<string, string>();
    assets.forEach(asset => {
      assetMap.set(
        asset.srcUrl,
        `./assets/${FileSystem.generateAssetFilename(asset.srcUrl)}`,
      );
    });

    // Clean HTML
    let cleanedHtml = SimpleHTMLParser.removeUnwantedElements(html);

    // Replace asset URLs
    cleanedHtml = SimpleHTMLParser.replaceUrls(cleanedHtml, assetMap);

    // Add base reader CSS and theme placeholder
    const readerCSS = this.getBaseReaderCSS();
    const bridgeScript = this.getBridgeScript();

    // Insert CSS and script
    if (cleanedHtml.includes('</head>')) {
      cleanedHtml = cleanedHtml.replace(
        '</head>',
        `<style id="pn-base">${readerCSS}</style><style id="pn-theme"></style></head>`,
      );
    } else {
      cleanedHtml = `<head><style id="pn-base">${readerCSS}</style><style id="pn-theme"></style></head>${cleanedHtml}`;
    }

    if (cleanedHtml.includes('</body>')) {
      cleanedHtml = cleanedHtml.replace(
        '</body>',
        `<script>${bridgeScript}</script></body>`,
      );
    } else {
      cleanedHtml = `${cleanedHtml}<script>${bridgeScript}</script>`;
    }

    return cleanedHtml;
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
        let scrollTimeout;
        
        window.PageNestBridge = {
          reportScroll: function() {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'scroll',
              progress: Math.max(0, Math.min(1, scrollPercent)),
              scrollY: window.scrollY
            }));
          },
          
          reportSelection: function() {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'selection',
                text: selection.toString(),
                range: {
                  startContainer: getNodePath(range.startContainer),
                  startOffset: range.startOffset,
                  endContainer: getNodePath(range.endContainer),
                  endOffset: range.endOffset
                }
              }));
            }
          },
          
          setTheme: function(css) {
            const style = document.getElementById('pn-theme');
            if (style) {
              style.textContent = css;
            }
          },
          
          scrollToAnnotation: function(rangeJson) {
            try {
              const range = restoreRange(rangeJson);
              if (range && range.startContainer && range.startContainer.parentElement) {
                range.startContainer.parentElement.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            } catch (e) {
              console.error('Error scrolling to annotation:', e);
            }
          }
        };
        
        function getNodePath(node) {
          const path = [];
          while (node && node !== document.body) {
            const parent = node.parentNode;
            if (parent) {
              const index = Array.from(parent.childNodes).indexOf(node);
              path.unshift(index);
            }
            node = parent;
          }
          return path.join(',');
        }
        
        function restoreRange(rangeJson) {
          try {
            const range = document.createRange();
            const startPath = rangeJson.startContainer.split(',').map(Number);
            const endPath = rangeJson.endContainer.split(',').map(Number);
            
            let startNode = document.body;
            for (const index of startPath) {
              startNode = startNode.childNodes[index];
            }
            
            let endNode = document.body;
            for (const index of endPath) {
              endNode = endNode.childNodes[index];
            }
            
            range.setStart(startNode, rangeJson.startOffset);
            range.setEnd(endNode, rangeJson.endOffset);
            
            return range;
          } catch (e) {
            console.error('Error restoring range:', e);
            return null;
          }
        }
        
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
        
        // Report selection on mouseup
        document.addEventListener('mouseup', function() {
          setTimeout(window.PageNestBridge.reportSelection, 10);
        });
        
        // Report initial scroll position
        setTimeout(window.PageNestBridge.reportScroll, 100);
      })();
    `;
  }
}
