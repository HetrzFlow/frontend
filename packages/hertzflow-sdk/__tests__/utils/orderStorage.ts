import * as fs from 'fs';
import * as path from 'path';

export interface StoredOrderInfo {
  orderId: string;
  indexCoin: string;
  isLong: boolean;
  txDigest: string;
  timestamp: number;
  amount: string;
  triggerPrice: string;
}

export class OrderStorage {
  private static readonly STORAGE_FILE = path.join(
    __dirname,
    '../data/lastOrder.json',
  );

  private static ensureStorageDir(): void {
    const dir = path.dirname(this.STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static saveOrder(orderInfo: StoredOrderInfo): void {
    try {
      this.ensureStorageDir();
      const data = JSON.stringify(orderInfo, null, 2);
      fs.writeFileSync(this.STORAGE_FILE, data, 'utf8');
    } catch (error) {
      console.error('❌ :', error);
    }
  }

  public static getLastOrder(): StoredOrderInfo | null {
    try {
      if (!fs.existsSync(this.STORAGE_FILE)) {
        return null;
      }

      const data = fs.readFileSync(this.STORAGE_FILE, 'utf8');
      const orderInfo = JSON.parse(data) as StoredOrderInfo;

      return orderInfo;
    } catch (error) {
      console.error('❌ :', error);
      return null;
    }
  }

  public static clearOrder(): void {
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        fs.unlinkSync(this.STORAGE_FILE);
      }
    } catch (error) {
      console.error('❌ :', error);
    }
  }

  public static hasLastOrder(): boolean {
    return fs.existsSync(this.STORAGE_FILE);
  }
}
