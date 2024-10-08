import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Subscription } from './Subscription';

@Entity()
export class EventType {
  @PrimaryGeneratedColumn()
  id!: number;  // Auto-generated primary key

  @Column({ type: 'varchar', length: 256 })
  type!: string;

  // Each eventType belongs to one subscription
  @ManyToOne(() => Subscription, (subscription) => subscription.eventTypes)
  subscription!: Subscription;
}