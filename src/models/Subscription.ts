import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { EventType } from './EventType';
import { Metadata } from './Metadata';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;  // Auto-generated primary key

  @Column({ type: 'varchar', length: 512 })
  notificationEndpoint?: string;

  @OneToMany(() => EventType, (eventType) => eventType.subscription)
  eventTypes!: EventType[];

  @OneToMany(() => Metadata, (metadata) => metadata.subscription)
  metadata!: Metadata[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;  // Timestamp for when the entity is created
}