import { getDatabase } from '../database';
import { Asset } from '../../domain/Article';

export class AssetRepository {
  private db = getDatabase();

  async create(asset: Omit<Asset, 'id'>): Promise<string> {
    const id = this.generateId();

    this.db.execute(
      `INSERT INTO assets (
        id, article_id, type, src_url, local_path, byte_size, mime, status, hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        asset.articleId,
        asset.type,
        asset.srcUrl,
        asset.localPath,
        asset.byteSize,
        asset.mime,
        asset.status,
        asset.hash,
      ],
    );

    return id;
  }

  async findByArticleId(articleId: string): Promise<Asset[]> {
    const result = this.db.execute(
      'SELECT * FROM assets WHERE article_id = ?',
      [articleId],
    );

    const assets: Asset[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        assets.push(this.mapRowToAsset(result.rows.item(i)));
      }
    }

    return assets;
  }

  async updateStatus(id: string, status: Asset['status']): Promise<void> {
    this.db.execute('UPDATE assets SET status = ? WHERE id = ?', [status, id]);
  }

  async update(
    id: string,
    updates: Partial<Omit<Asset, 'id' | 'articleId' | 'hash'>>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.localPath !== undefined) {
      fields.push('local_path = ?');
      values.push(updates.localPath);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.mime !== undefined) {
      fields.push('mime = ?');
      values.push(updates.mime);
    }
    if (updates.byteSize !== undefined) {
      fields.push('byte_size = ?');
      values.push(updates.byteSize);
    }

    if (fields.length > 0) {
      values.push(id);
      this.db.execute(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    this.db.execute('DELETE FROM assets WHERE article_id = ?', [articleId]);
  }

  async findOrphanedAssets(): Promise<Asset[]> {
    const result = this.db.execute(`
      SELECT a.* FROM assets a
      LEFT JOIN articles ar ON a.article_id = ar.id
      WHERE ar.id IS NULL
    `);

    const assets: Asset[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        assets.push(this.mapRowToAsset(result.rows.item(i)));
      }
    }

    return assets;
  }

  async findFailedAssets(articleId?: string): Promise<Asset[]> {
    let query = "SELECT * FROM assets WHERE status = 'failed'";
    const params: any[] = [];

    if (articleId) {
      query += ' AND article_id = ?';
      params.push(articleId);
    }

    const result = this.db.execute(query, params);

    const assets: Asset[] = [];
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        assets.push(this.mapRowToAsset(result.rows.item(i)));
      }
    }

    return assets;
  }

  private mapRowToAsset(row: any): Asset {
    return {
      id: row.id,
      articleId: row.article_id,
      type: row.type,
      srcUrl: row.src_url,
      localPath: row.local_path,
      byteSize: row.byte_size,
      mime: row.mime,
      status: row.status,
      hash: row.hash,
    };
  }

  private generateId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
