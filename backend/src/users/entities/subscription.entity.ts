// import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

// @Entity('subscriptions')
export class Subscription {
  // @PrimaryGeneratedColumn()
  id: number;

  // @Column({ unique: true })
  userId: number;

  // @Column({
  //   type: 'varchar',
  //   default: PlanType.FREE,
  // })
  plan: PlanType;

  // @Column({ type: 'int', default: 0 })
  credits: number;

  // @Column({ type: process.env.DATABASE_URL ? 'timestamp' : 'datetime', nullable: true })
  expiresAt: Date;

  // @Column({ type: 'int', default: 0 })
  monthlyMessagesUsed: number;

  // @Column({ type: 'int', default: 0 })
  totalTokensUsed: number;

  // @Column({ type: process.env.DATABASE_URL ? 'timestamp' : 'datetime', nullable: true })
  lastResetAt: Date;

  // @CreateDateColumn()
  createdAt: Date;

  // @UpdateDateColumn()
  updatedAt: Date;
}

