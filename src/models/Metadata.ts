import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Column } from 'typeorm';
import { Subscription } from './Subscription';

@Entity()
export class Metadata {
  @PrimaryGeneratedColumn()
  id!: number;  // Auto-generated primary key

  @Column({ type: 'varchar', length: 256 })
  metadata!: string;

  // Each metadata belongs to one subscription
  @ManyToOne(() => Subscription, (subscription) => subscription.metadata)
  subscription!: Subscription;
}