import { getDatabase } from '../database';
import { Collection } from '../../domain/Article';

export class CollectionRepository {
  private db = getDatabase();

  async create(collection: Omit<Collection, 'id'>): Promise<string> {
    const id = this.generateId();

    this.db.execute(
      'INSERT INTO collections (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
      [id, collection.name, collection.icon, collection.sortOrder],
    );

    return id;
  }

  async findAll(): Promise<Collection[]> {
    const result = this.db.execute(
      'SELECT * FROM collections ORDER BY sort_order, name',
    );

    const collections: Collection[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        collections.push(this.mapRowToCollection(result.rows.item(i)));
      }
    }

    return collections;
  }

  async findById(id: string): Promise<Collection | null> {
    const result = this.db.execute('SELECT * FROM collections WHERE id = ?', [
      id,
    ]);

    if (result.rows && result.rows.length > 0) {
      return this.mapRowToCollection(result.rows.item(0));
    }

    return null;
  }

  async findByArticleId(articleId: string): Promise<Collection[]> {
    const result = this.db.execute(
      `
      SELECT c.* FROM collections c
      INNER JOIN article_collections ac ON c.id = ac.collection_id
      WHERE ac.article_id = ?
      ORDER BY c.sort_order, c.name
    `,
      [articleId],
    );

    const collections: Collection[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        collections.push(this.mapRowToCollection(result.rows.item(i)));
      }
    }

    return collections;
  }

  async addArticle(
    articleId: string,
    collectionId: string,
    order?: number,
  ): Promise<void> {
    const orderValue =
      order ?? (await this.getNextOrderInCollection(collectionId));

    this.db.execute(
      'INSERT OR REPLACE INTO article_collections (article_id, collection_id, order_in_collection) VALUES (?, ?, ?)',
      [articleId, collectionId, orderValue],
    );
  }

  async removeArticle(articleId: string, collectionId: string): Promise<void> {
    this.db.execute(
      'DELETE FROM article_collections WHERE article_id = ? AND collection_id = ?',
      [articleId, collectionId],
    );
  }

  async reorderArticle(
    articleId: string,
    collectionId: string,
    newOrder: number,
  ): Promise<void> {
    this.db.execute(
      'UPDATE article_collections SET order_in_collection = ? WHERE article_id = ? AND collection_id = ?',
      [newOrder, articleId, collectionId],
    );
  }

  async delete(id: string): Promise<void> {
    this.db.execute('DELETE FROM collections WHERE id = ?', [id]);
  }

  async update(id: string, updates: Partial<Collection>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      params.push(updates.icon);
    }
    if (updates.sortOrder !== undefined) {
      fields.push('sort_order = ?');
      params.push(updates.sortOrder);
    }

    if (fields.length > 0) {
      params.push(id);
      this.db.execute(
        `UPDATE collections SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );
    }
  }

  private async getNextOrderInCollection(
    collectionId: string,
  ): Promise<number> {
    const result = this.db.execute(
      'SELECT MAX(order_in_collection) as max_order FROM article_collections WHERE collection_id = ?',
      [collectionId],
    );

    if (result.rows && result.rows.length > 0) {
      const maxOrder = result.rows.item(0).max_order;
      return (maxOrder ?? -1) + 1;
    }

    return 0;
  }

  private mapRowToCollection(row: any): Collection {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      sortOrder: row.sort_order,
    };
  }

  private generateId(): string {
    return `collection_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}
