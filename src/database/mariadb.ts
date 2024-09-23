import mariadb from 'mariadb';
import { Subscription } from '../utils/types';

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const dbPort = process.env.DB_PORT;
const db = process.env.DB_NAME;

class Database {
  private static instance: Database;
  private pool: mariadb.Pool;

  private constructor() {
    // Create a connection pool
    this.pool = mariadb.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: db,
      port: Number(dbPort),
      connectionLimit: 5,
    });
  }

  // Get the singleton instance
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
      this.instance.createTable();
      console.log('Creating new Database instance')
    }
    return Database.instance;
  }

  // Get a connection from the pool
  public async getConnection(): Promise<mariadb.Connection> {
    try {
      const connection = await this.pool.getConnection();
      return connection;
    } catch (err) {
      throw new Error(`Error getting database connection: ${err}`);
    }
  }

  // Close the pool
  public async closePool(): Promise<void> {
    try {
      await this.pool.end();
    } catch (err) {
      throw new Error(`Error closing database pool: ${err}`);
    }
  }

  // Method to create a table
  public async createTable(): Promise<void> {
    let connection: mariadb.Connection | undefined;
    try {
      connection = await this.getConnection();

      // SQL query to create a table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          subscription JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await connection.query(createTableQuery);
      console.log('Table "subscriptions" created or already exists.');
    } catch (err) {
      console.error('Error creating table:', err);
    } finally {
      if (connection) await connection.end(); // Close the connection
    }
  }

  // Delete a table
  public async deleteTable(tableName: string): Promise<void> {
    let connection: mariadb.Connection | undefined;
    try {
      connection = await this.getConnection();
      await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
      console.log(`Table ${tableName} deleted`);
    } catch (err) {
      console.error('Error deleting table:', err);
    } finally {
      if (connection) await connection.end(); // Close the connection
    }
  }

   // Insert a new item into a table
   public async addSubscription(subscription: Subscription): Promise<void> {
    let connection: mariadb.Connection | undefined;
    try {
      connection = await this.getConnection();
      const jsonData = JSON.stringify(subscription);
      await connection.query('INSERT INTO subscriptions (subscription) VALUES (?)', [jsonData]);
      console.log(`Subscription inserted successfully`);
    } catch (err) {
      console.error('Error inserting item:', err);
    } finally {
      if (connection) connection.end(); // Release the connection
    }
  }

  // Get all items from the table
  public async getSubscriptions(): Promise<any[]> {
    let connection: mariadb.Connection | undefined;
    try {
      connection = await this.getConnection();
      const rows = await connection.query('SELECT * FROM subscriptions');
      return rows;
    } catch (err) {
      console.error('Error fetching items:', err);
      return [];
    } finally {
      if (connection) connection.end();
    }
  }

  // Test
  public test(): void {
    console.log('The request has been received to add a new element to the db')
  }
}

export default Database;
