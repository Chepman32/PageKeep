import { getDatabase } from '../database';
import {
  Article,
  ArticleFilters,
  SearchResult,
  IndexableContent,
} from '../../domain/Article';

export class SearchRepository {
  private db = getDatabase();

  async search(
    query: string,
    filters?: ArticleFilters,
  ): Promise<SearchResult[]> {
    console.log('SearchRepository: Searching with query:', query, 'filters:', filters);

    let ftsResult;

    try {
      // Try FTS5 search first - only search titles
      const ftsQuery = `
        SELECT
          fts.article_id,
          snippet(fts_articles, 0, '<mark>', '</mark>', '...', 30) as highlight,
          rank as score
        FROM fts_articles fts
        WHERE fts_articles MATCH ?
        ORDER BY rank
        LIMIT 100
      `;

      // Build query to only search title column (column 0)
      const searchQuery = `title:${this.buildFTS5Query(query)}`;
      console.log('SearchRepository: FTS5 query:', searchQuery);
      ftsResult = this.db.execute(ftsQuery, [searchQuery]);
      console.log('SearchRepository: FTS5 result rows:', ftsResult.rows?.length || 0);
    } catch (error) {
      console.warn('FTS5 search failed, using fallback:', error);
      // Fallback to LIKE search - only search titles
      const fallbackQuery = `
        SELECT
          fts.article_id,
          fts.title as highlight,
          10 as score
        FROM fts_articles fts
        WHERE fts.title LIKE ?
        ORDER BY score DESC
        LIMIT 100
      `;

      const likeQuery = `%${query}%`;
      ftsResult = this.db.execute(fallbackQuery, [likeQuery]);
    }

    if (!ftsResult.rows || ftsResult.rows.length === 0) {
      return [];
    }

    // Get article IDs
    const articleIds: string[] = [];
    const highlightMap = new Map<string, string[]>();
    const scoreMap = new Map<string, number>();

    for (let i = 0; i < ftsResult.rows.length; i++) {
      const row = ftsResult.rows.item(i);
      articleIds.push(row.article_id);

      const highlights = highlightMap.get(row.article_id) || [];
      highlights.push(row.highlight);
      highlightMap.set(row.article_id, highlights);

      scoreMap.set(row.article_id, row.score);
    }

    // Fetch full articles with filters
    let articlesQuery = `SELECT * FROM articles WHERE id IN (${articleIds
      .map(() => '?')
      .join(',')})`;
    const params: any[] = [...articleIds];

    if (filters) {
      const conditions: string[] = [];

      if (filters.archived !== undefined) {
        conditions.push('archived = ?');
        params.push(filters.archived ? 1 : 0);
      }

      if (filters.favorite !== undefined) {
        conditions.push('favorite = ?');
        params.push(filters.favorite ? 1 : 0);
      }

      if (conditions.length > 0) {
        articlesQuery += ' AND ' + conditions.join(' AND ');
      }
    }

    const articlesResult = this.db.execute(articlesQuery, params);
    console.log('SearchRepository: Articles result rows:', articlesResult.rows?.length || 0);

    const results: SearchResult[] = [];
    if (articlesResult.rows) {
      for (let i = 0; i < articlesResult.rows.length; i++) {
        const row = articlesResult.rows.item(i);
        const article = this.mapRowToArticle(row);

        results.push({
          article,
          highlights: highlightMap.get(article.id) || [],
          score: scoreMap.get(article.id) || 0,
        });
      }
    }

    console.log('SearchRepository: Returning', results.length, 'search results');
    return results.sort((a, b) => b.score - a.score);
  }

  async updateArticleIndex(
    articleId: string,
    content: IndexableContent,
  ): Promise<void> {
    try {
      // Delete existing entry
      this.db.execute('DELETE FROM fts_articles WHERE article_id = ?', [
        articleId,
      ]);

      // Insert new entry
      this.db.execute(
        `INSERT INTO fts_articles (article_id, title, plain_text, tags_cached, annotations_cached)
         VALUES (?, ?, ?, ?, ?)`,
        [
          articleId,
          content.title,
          content.plainText,
          content.tags.join(' '),
          content.annotations.join(' '),
        ],
      );
    } catch (error) {
      console.error('Error updating search index:', error);
      // Don't throw - search indexing is not critical
    }
  }

  async reindex(): Promise<void> {
    // Clear FTS table
    this.db.execute('DELETE FROM fts_articles');

    // Get all articles
    const articlesResult = this.db.execute('SELECT id FROM articles');

    if (!articlesResult.rows) {
      return;
    }

    // Reindex each article
    for (let i = 0; i < articlesResult.rows.length; i++) {
      const articleId = articlesResult.rows.item(i).id;

      // Get article data
      const articleResult = this.db.execute(
        'SELECT title FROM articles WHERE id = ?',
        [articleId],
      );
      const contentResult = this.db.execute(
        'SELECT html_path FROM article_content WHERE article_id = ?',
        [articleId],
      );

      // Get tags
      const tagsResult = this.db.execute(
        `
        SELECT t.name FROM tags t
        INNER JOIN article_tags at ON t.id = at.tag_id
        WHERE at.article_id = ?
      `,
        [articleId],
      );

      const tags: string[] = [];
      if (tagsResult.rows) {
        for (let j = 0; j < tagsResult.rows.length; j++) {
          tags.push(tagsResult.rows.item(j).name);
        }
      }

      // Get annotations
      const annotationsResult = this.db.execute(
        'SELECT text FROM annotations WHERE article_id = ? AND text IS NOT NULL',
        [articleId],
      );

      const annotations: string[] = [];
      if (annotationsResult.rows) {
        for (let j = 0; j < annotationsResult.rows.length; j++) {
          annotations.push(annotationsResult.rows.item(j).text);
        }
      }

      if (articleResult.rows && articleResult.rows.length > 0) {
        const title = articleResult.rows.item(0).title;

        // For now, use title as plain text (will be improved when we have HTML parsing)
        await this.updateArticleIndex(articleId, {
          title,
          plainText: title,
          tags,
          annotations,
        });
      }
    }
  }

  private buildFTS5Query(query: string): string {
    // Simple query builder - can be enhanced with more sophisticated parsing
    const terms = query.trim().split(/\s+/);
    return terms.map(term => `"${term}"*`).join(' OR ');
  }

  private mapRowToArticle(row: any): Article {
    return {
      id: row.id,
      title: row.title,
      url: row.url,
      domain: row.domain,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archived: row.archived === 1,
      favorite: row.favorite === 1,
      readProgress: row.read_progress,
      readingTime: row.reading_time,
      coverAssetId: row.cover_asset_id,
      lang: row.lang,
      wordCount: row.word_count,
      hasAssets: row.has_assets === 1,
    };
  }
}
