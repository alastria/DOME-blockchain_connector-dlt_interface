import { DataSource } from 'typeorm';
import { Subscription, EventType, Metadata } from '../models';

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

class Database {
  private static instance: DataSource | null = null;

  private constructor() {}

  public static getInstance(): DataSource {
    if (!Database.instance) {
      // Create the DataSource instance
      Database.instance = new DataSource({
        type: 'mariadb',
        host: dbHost,
        port: Number(dbPort),
        username: dbUser,  // Replace with your MariaDB username
        password: dbPass,  // Replace with your MariaDB password
        database: dbName,  // Replace with your MariaDB database name
        entities: [Subscription, EventType, Metadata],
        synchronize: true,  // Automatically sync schema with database
      });

      // Initialize the DataSource (connection)
      try {
        Database.instance.initialize();
        console.log('Database connection initialized');
      } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;  // Re-throw the error if the connection fails
      }
    }

    return Database.instance;
  }
}

export default Database;