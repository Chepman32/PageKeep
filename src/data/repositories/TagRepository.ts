import { getDatabase } from '../database';
import { Tag } from '../../domain/Article';

export class TagRepository {
  private db = getDatabase();

  async create(tag: Omit<Tag, 'id'>): Promise<string> {
    const id = this.generateId();

    this.db.execute('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)', [
      id,
      tag.name,
      tag.color,
    ]);

    return id;
  }

  async findAll(): Promise<Tag[]> {
    const result = this.db.execute('SELECT * FROM tags ORDER BY name');

    const tags: Tag[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        tags.push(this.mapRowToTag(result.rows.item(i)));
      }
    }

    return tags;
  }

  async findById(id: string): Promise<Tag | null> {
    const result = this.db.execute('SELECT * FROM tags WHERE id = ?', [id]);

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToTag(result.rows.item(0));
    }

    return null;
  }

  async findByArticleId(articleId: string): Promise<Tag[]> {
    const result = this.db.execute(
      `
      SELECT t.* FROM tags t
      INNER JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
      ORDER BY t.name
    `,
      [articleId],
    );

    const tags: Tag[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        tags.push(this.mapRowToTag(result.rows.item(i)));
      }
    }

    return tags;
  }

  async addToArticle(articleId: string, tagId: string): Promise<void> {
    this.db.execute(
      'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
      [articleId, tagId],
    );
  }

  async removeFromArticle(articleId: string, tagId: string): Promise<void> {
    this.db.execute(
      'DELETE FROM article_tags WHERE article_id = ? AND tag_id = ?',
      [articleId, tagId],
    );
  }

  async delete(id: string): Promise<void> {
    this.db.execute('DELETE FROM tags WHERE id = ?', [id]);
  }

  async update(id: string, updates: Partial<Tag>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      params.push(updates.color);
    }

    if (fields.length > 0) {
      params.push(id);
      this.db.execute(
        `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );
    }
  }

  private mapRowToTag(row: any): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
    };
  }

  private generateId(): string {
    return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
