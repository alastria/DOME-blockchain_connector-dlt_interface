import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Subscription } from '../utils/types';

@Entity()
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;  // Auto-generated primary key

  @Column('json')
  subscription!: Subscription;  // Custom type stored as JSON

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;  // Timestamp for when the entity is created
}