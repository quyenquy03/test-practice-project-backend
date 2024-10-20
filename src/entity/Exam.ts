import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { ExamQuestion } from "./ExamQuestion";
import { ExamSkillStatus } from "./ExamSkillStatus";

@Entity({ name: "Exams" })
export class Exam {
  @PrimaryColumn({ type: "varchar", length: 255, nullable: false })
  id!: string;

  @Column({ type: "varchar", length: 1000, nullable: false })
  userId!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  examCode!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  startTime?: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  endTime?: string;

  @Column({ type: "boolean", nullable: false, default: false })
  isDeleted!: boolean;

  @Column({ type: "boolean", nullable: false, default: true })
  isActive!: boolean;

  @Column({ type: "boolean", nullable: false, default: false })
  isDone!: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  updatedBy?: string;

  @OneToMany(() => ExamQuestion, (examQuestion) => examQuestion.exam)
  examQuestions!: ExamQuestion[];

  @OneToMany(() => ExamSkillStatus, (examSkillStatus) => examSkillStatus.exam)
  examSkillStatuses!: ExamSkillStatus[];
}
