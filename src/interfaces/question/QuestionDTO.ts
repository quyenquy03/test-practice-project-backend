export interface ISubQuestion {
  id: string;
  questionId: string;
  content: string;
  order: number;
  correctAnswer?: string;
  answers: ISubQuestionAnswer[];
}
export interface ISubQuestionAnswer {
  id: string;
  subQuestionId: string;
  answerContent: string;
  order: number;
  isCorrect: boolean;
}
export interface IQuestion {
  id: string;
  categoryId: string;
  levelId: string;
  skillId: string;
  questionContent: string;
  description?: string;
  questionNote?: string;
  attachedFile?: string;
  isDeleted: boolean;
  isActive: boolean;
}

export interface IQuestionDetail extends IQuestion {
  subQuestions?: ISubQuestion[];
}