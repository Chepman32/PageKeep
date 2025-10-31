import { getDatabase } from '../database';
import { Article, ArticleContent, ArticleFilters } from '../../domain/Article';

export class ArticleRepository {
  private db = getDatabase();

  async create(article: Omit<Article, 'id'>): Promise<string> {
    const id = this.generateId();

    this.db.execute(
      `INSERT INTO articles (
        id, title, url, domain, created_at, updated_at, archived, favorite,
        read_progress, reading_time, cover_asset_id, lang, word_count, has_assets
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        article.title,
        article.url,
        article.domain,
        article.createdAt,
        article.updatedAt,
        article.archived ? 1 : 0,
        article.favorite ? 1 : 0,
        article.readProgress,
        article.readingTime,
        article.coverAssetId || null,
        article.lang || null,
        article.wordCount,
        article.hasAssets ? 1 : 0,
      ],
    );

    return id;
  }

  async findById(id: string): Promise<Article | null> {
    const result = this.db.execute('SELECT * FROM articles WHERE id = ?', [id]);

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToArticle(result.rows.item(0));
    }

    return null;
  }

  async findAll(filters?: ArticleFilters): Promise<Article[]> {
    let query = 'SELECT DISTINCT a.* FROM articles a';
    const params: any[] = [];
    const conditions: string[] = [];

    // Join with tags if filtering by tags
    if (filters?.tags && filters.tags.length > 0) {
      query += ' INNER JOIN article_tags at ON a.id = at.article_id';
      conditions.push(
        `at.tag_id IN (${filters.tags.map(() => '?').join(',')})`,
      );
      params.push(...filters.tags);
    }

    // Join with collections if filtering by collections
    if (filters?.collections && filters.collections.length > 0) {
      query += ' INNER JOIN article_collections ac ON a.id = ac.article_id';
      conditions.push(
        `ac.collection_id IN (${filters.collections.map(() => '?').join(',')})`,
      );
      params.push(...filters.collections);
    }

    // Add WHERE conditions
    if (filters?.archived !== undefined) {
      conditions.push('a.archived = ?');
      params.push(filters.archived ? 1 : 0);
    }

    if (filters?.favorite !== undefined) {
      conditions.push('a.favorite = ?');
      params.push(filters.favorite ? 1 : 0);
    }

    if (filters?.hasErrors) {
      query += ' INNER JOIN assets ast ON a.id = ast.article_id';
      conditions.push("ast.status = 'failed'");
    }

    if (filters?.minReadProgress !== undefined) {
      conditions.push('a.read_progress >= ?');
      params.push(filters.minReadProgress);
    }

    if (filters?.maxReadProgress !== undefined) {
      conditions.push('a.read_progress <= ?');
      params.push(filters.maxReadProgress);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC';

    const result = this.db.execute(query, params);
    const articles: Article[] = [];

    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        articles.push(this.mapRowToArticle(result.rows.item(i)));
      }
    }

    return articles;
  }

  async update(id: string, updates: Partial<Article>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }
    if (updates.archived !== undefined) {
      fields.push('archived = ?');
      params.push(updates.archived ? 1 : 0);
    }
    if (updates.favorite !== undefined) {
      fields.push('favorite = ?');
      params.push(updates.favorite ? 1 : 0);
    }
    if (updates.readProgress !== undefined) {
      fields.push('read_progress = ?');
      params.push(updates.readProgress);
    }
    if (updates.hasAssets !== undefined) {
      fields.push('has_assets = ?');
      params.push(updates.hasAssets ? 1 : 0);
    }

    fields.push('updated_at = ?');
    params.push(Date.now());

    params.push(id);

    this.db.execute(
      `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`,
      params,
    );
  }

  async delete(id: string): Promise<void> {
    this.db.execute('DELETE FROM articles WHERE id = ?', [id]);
  }

  async updateReadProgress(id: string, progress: number): Promise<void> {
    this.db.execute(
      'UPDATE articles SET read_progress = ?, updated_at = ? WHERE id = ?',
      [progress, Date.now(), id],
    );
  }

  async toggleFavorite(id: string): Promise<void> {
    this.db.execute(
      'UPDATE articles SET favorite = NOT favorite, updated_at = ? WHERE id = ?',
      [Date.now(), id],
    );
  }

  async toggleArchive(id: string): Promise<void> {
    this.db.execute(
      'UPDATE articles SET archived = NOT archived, updated_at = ? WHERE id = ?',
      [Date.now(), id],
    );
  }

  async createContent(content: ArticleContent): Promise<void> {
    this.db.execute(
      `INSERT INTO article_content (article_id, html_path, stylesheet_path, meta_json)
       VALUES (?, ?, ?, ?)`,
      [
        content.articleId,
        content.htmlPath,
        content.stylesheetPath || null,
        JSON.stringify(content.meta),
      ],
    );
  }

  async getContent(articleId: string): Promise<ArticleContent | null> {
    const result = this.db.execute(
      'SELECT * FROM article_content WHERE article_id = ?',
      [articleId],
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows.item(0);
      return {
        articleId: row.article_id,
        htmlPath: row.html_path,
        stylesheetPath: row.stylesheet_path,
        meta: JSON.parse(row.meta_json || '{}'),
      };
    }

    return null;
  }

  async findArticlesWithAssets(): Promise<Article[]> {
    const result = this.db.execute(
      'SELECT * FROM articles WHERE has_assets = 1 ORDER BY created_at DESC',
    );

    const articles: Article[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        articles.push(this.mapRowToArticle(result.rows.item(i)));
      }
    }

    return articles;
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

  private generateId(): string {
    return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
