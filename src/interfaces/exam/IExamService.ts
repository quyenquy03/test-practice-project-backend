import { IResponseBase } from "../base/IResponseBase";
import { IQuestionDetail } from "../question/QuestionDTO";
import { ISubmitSkillRequest } from "./IExamDTO";

export default interface IExamService {
  getCurrentExam(userId: string): Promise<IResponseBase>;
  startNewExam(userId: string): Promise<IResponseBase>;
  participateExam(userId: string): Promise<IResponseBase>;
  continueExam(userId: string): Promise<IResponseBase>;
  submitSkill(userId: string, data: ISubmitSkillRequest): Promise<IResponseBase>;
  submitSpeakingSkill(userId: string, data: IQuestionDetail): Promise<IResponseBase>;
}
