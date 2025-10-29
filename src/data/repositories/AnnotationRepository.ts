import { getDatabase } from '../database';
import { Annotation } from '../../domain/Article';

export class AnnotationRepository {
  private db = getDatabase();

  async create(annotation: Omit<Annotation, 'id'>): Promise<string> {
    const id = this.generateId();

    this.db.execute(
      'INSERT INTO annotations (id, article_id, range_json, text, created_at, color) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        annotation.articleId,
        JSON.stringify(annotation.range),
        annotation.text || null,
        annotation.createdAt,
        annotation.color,
      ],
    );

    return id;
  }

  async findByArticleId(articleId: string): Promise<Annotation[]> {
    const result = this.db.execute(
      'SELECT * FROM annotations WHERE article_id = ? ORDER BY created_at',
      [articleId],
    );

    const annotations: Annotation[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        annotations.push(this.mapRowToAnnotation(result.rows.item(i)));
      }
    }

    return annotations;
  }

  async update(id: string, updates: Partial<Annotation>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.text !== undefined) {
      fields.push('text = ?');
      params.push(updates.text);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      params.push(updates.color);
    }

    if (fields.length > 0) {
      params.push(id);
      this.db.execute(
        `UPDATE annotations SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );
    }
  }

  async delete(id: string): Promise<void> {
    this.db.execute('DELETE FROM annotations WHERE id = ?', [id]);
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    this.db.execute('DELETE FROM annotations WHERE article_id = ?', [
      articleId,
    ]);
  }

  private mapRowToAnnotation(row: any): Annotation {
    return {
      id: row.id,
      articleId: row.article_id,
      range: JSON.parse(row.range_json),
      text: row.text,
      createdAt: row.created_at,
      color: row.color,
    };
  }

  private generateId(): string {
    return `annotation_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}
