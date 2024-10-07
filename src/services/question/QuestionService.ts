import { ErrorMessages } from "@/constants/ErrorMessages";
import AppDataSource from "@/data-source";
import { Answer } from "@/entity/Answer";
import { Question } from "@/entity/Question";
import { SubQuestion } from "@/entity/SubQuestion";
import { IResponseBase } from "@/interfaces/base/IResponseBase";
import IQuestionService from "@/interfaces/question/IQuestionService";
import { IQuestionDetail } from "@/interfaces/question/QuestionDTO";
import { Repo } from "@/repository";
import { StatusCodes } from "http-status-codes";

export default class QuestionService implements IQuestionService {
  constructor() {
    // Constructor
  }
  private questionFields = [
    "question.id",
    "question.questionContent",
    "question.questionNote",
    "question.description",
    "question.attachedFile",
    "question.isActive",
    "question.isDeleted",
    "question.skillId",
    "question.levelId",
    "question.categoryId",
    "category.id",
    "category.name",
    "level.id",
    "level.displayName",
    "skill.id",
    "skill.displayName",
  ];
  private subQuestionFields = [
    "subQuestion.id",
    "subQuestion.questionId",
    "subQuestion.content",
    "subQuestion.correctAnswer",
    "subQuestion.order",
  ];
  private answerFields = ["answer.id", "answer.subQuestionId", "answer.answerContent", "answer.isCorrect", "answer.order"];

  async checkQuestionData(questionData: IQuestionDetail) {
    if (!questionData || !questionData.questionContent || !questionData.questionContent.trim()) {
      return {
        data: null,
        message: "Question content is required",
        success: false,
        error: {
          message: "Question content is required",
          errorDetail: "Question content is required",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    if (!questionData.skillId || !questionData.levelId || !questionData.categoryId) {
      return {
        data: null,
        message: ErrorMessages.INVALID_REQUEST_BODY,
        success: false,
        error: {
          message: ErrorMessages.INVALID_REQUEST_BODY,
          errorDetail: "SkillId, LevelId and CategoryId is required",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    const level = await Repo.LevelRepo.findOne({
      where: {
        id: questionData.levelId,
      },
    });
    if (!level) {
      return {
        data: null,
        message: "Level is not exist",
        success: false,
        error: {
          message: "Level is not exist",
          errorDetail: "Level is not exist",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    if (questionData.subQuestions?.length !== level.subQuestionNumber) {
      return {
        data: null,
        message: `SubQuestion number must be equal to ${level.subQuestionNumber}`,
        success: false,
        error: {
          message: `SubQuestion number must be equal to ${level.subQuestionNumber}`,
          errorDetail: `SubQuestion number must be equal to ${level.subQuestionNumber}`,
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    const checkSubQuestionContent = questionData.subQuestions?.some(
      (subQuestion) => !subQuestion.content || !subQuestion.content.trim()
    );
    if (checkSubQuestionContent) {
      return {
        data: null,
        message: "Please fill all sub question content",
        success: false,
        error: {
          message: "Please fill all sub question content",
          errorDetail: "Please fill all sub question content",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    const checkSubQuestionAnswerContent = questionData.subQuestions?.some(
      (subQuestion) =>
        !subQuestion.answers ||
        subQuestion.answers.length === 0 ||
        subQuestion.answers.some((answer) => !answer.answerContent || !answer.answerContent.trim())
    );
    if (checkSubQuestionAnswerContent) {
      return {
        data: null,
        message: "Please fill all sub question answer content",
        success: false,
        error: {
          message: "Please fill all sub question answer content",
          errorDetail: "Please fill all sub question answer content",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    const checkSubQuestionAnswerCorrect = questionData.subQuestions?.some(
      (subQuestion) => !subQuestion.correctAnswer || !subQuestion.correctAnswer.trim()
    );
    if (checkSubQuestionAnswerCorrect) {
      return {
        data: null,
        message: "Please fill all sub question correct answer",
        success: false,
        error: {
          message: "Please fill all sub question correct answer",
          errorDetail: "Please fill all sub question correct answer",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    if (questionData.skillId === "listening" && (!questionData.attachedFile || !questionData.attachedFile?.trim())) {
      return {
        data: null,
        message: "Please upload file audio for listening question",
        success: false,
        error: {
          message: "Please upload file audio for listening question",
          errorDetail: "Attached file is required",
        },
        status: StatusCodes.BAD_REQUEST,
      };
    }
    return {
      data: null,
      message: "Check question data successfully",
      success: true,
      error: null,
      status: StatusCodes.OK,
    };
  }

  async createNewQuestion(questionData: IQuestionDetail, userId: string): Promise<IResponseBase> {
    const checkQuestionData = await this.checkQuestionData(questionData);
    if (checkQuestionData.success === false) {
      return checkQuestionData;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const question = new Question();
      question.id = questionData.id; // Ensure questionData.id is provided
      question.skillId = questionData.skillId;
      question.levelId = questionData.levelId;
      question.categoryId = questionData.categoryId;
      question.questionContent = questionData.questionContent;
      question.questionNote = questionData.questionNote;
      question.description = questionData.description;
      question.attachedFile = questionData.attachedFile;
      question.isDeleted = false;
      question.isActive = true;
      question.createdBy = userId;
      question.updatedBy = userId;

      const savedQuestion = await queryRunner.manager.insert(Question, question);

      // Thay thế forEach bằng Promise.all
      await Promise.all(
        questionData.subQuestions?.map(async (subQuestion) => {
          const newSubQuestion = new SubQuestion();
          newSubQuestion.id = subQuestion.id; // Ensure subQuestion.id is provided
          newSubQuestion.content = subQuestion.content;
          // newSubQuestion.question = savedQuestion;
          newSubQuestion.questionId = savedQuestion.identifiers[0].id;
          newSubQuestion.order = subQuestion.order;
          newSubQuestion.createdBy = userId;
          newSubQuestion.updatedBy = userId;
          newSubQuestion.isDeleted = false;
          newSubQuestion.isActive = true;
          newSubQuestion.correctAnswer = subQuestion.correctAnswer;

          const savedSubQuestion = await queryRunner.manager.insert(SubQuestion, newSubQuestion);

          // Lưu các Answer
          await Promise.all(
            subQuestion.answers?.map(async (answer) => {
              const newAnswer = new Answer();
              newAnswer.id = answer.id; // Ensure answer.id is provided
              newAnswer.answerContent = answer.answerContent;
              // newAnswer.subQuestion = savedSubQuestion;
              newAnswer.subQuestionId = savedSubQuestion.identifiers[0].id;
              newAnswer.order = answer.order;
              newAnswer.createdBy = userId;
              newAnswer.updatedBy = userId;
              newAnswer.isCorrect = answer.isCorrect;

              await queryRunner.manager.save(Answer, newAnswer);
            })
          );
        })
      );

      // Commit transaction
      await queryRunner.commitTransaction();
      const questionCreated = await this.getQuestionById(savedQuestion.identifiers[0].id);
      if (!questionCreated || !questionCreated.success) {
        return questionCreated;
      }
      return {
        data: questionCreated.data,
        message: "Create new question successfully",
        success: true,
        error: null,
        status: StatusCodes.CREATED,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async updateQuestion(questionData: IQuestionDetail, userId: string): Promise<IResponseBase> {
    const checkQuestionData = await this.checkQuestionData(questionData);
    if (checkQuestionData.success === false) {
      return checkQuestionData;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const question = new Question();
      question.id = questionData.id; // Ensure questionData.id is provided
      question.skillId = questionData.skillId;
      question.levelId = questionData.levelId;
      question.categoryId = questionData.categoryId;
      question.questionContent = questionData.questionContent;
      question.questionNote = questionData.questionNote;
      question.description = questionData.description;
      question.attachedFile = questionData.attachedFile;
      question.updatedBy = userId;

      const savedQuestion = await queryRunner.manager.save(Question, question);

      // Thay thế forEach bằng Promise.all
      await Promise.all(
        questionData.subQuestions?.map(async (subQuestion) => {
          const newSubQuestion = new SubQuestion();
          newSubQuestion.id = subQuestion.id; // Ensure subQuestion.id is provided
          newSubQuestion.content = subQuestion.content;
          newSubQuestion.question = savedQuestion;
          newSubQuestion.order = subQuestion.order;
          newSubQuestion.updatedBy = userId;
          newSubQuestion.correctAnswer = subQuestion.correctAnswer;

          const savedSubQuestion = await queryRunner.manager.save(SubQuestion, newSubQuestion);

          // Lưu các Answer
          await Promise.all(
            subQuestion.answers?.map(async (answer) => {
              const newAnswer = new Answer();
              newAnswer.id = answer.id; // Ensure answer.id is provided
              newAnswer.answerContent = answer.answerContent;
              newAnswer.subQuestion = savedSubQuestion;
              newAnswer.order = answer.order;
              newAnswer.updatedBy = userId;
              newAnswer.isCorrect = answer.isCorrect;

              await queryRunner.manager.save(Answer, newAnswer);
            })
          );
        })
      );

      // Commit transaction
      await queryRunner.commitTransaction();
      const questionUpdated = await this.getQuestionById(savedQuestion.id);
      if (!questionUpdated || !questionUpdated.success) {
        return questionUpdated;
      }

      return {
        data: questionUpdated.data,
        message: "Update question successfully",
        success: true,
        error: null,
        status: StatusCodes.CREATED,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    } finally {
      await queryRunner.release();
    }
  }
  async getQuestionDetail(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide categoryId",
          success: false,
          error: {
            message: "Please provide categoryId",
            errorDetail: "CategoryId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const questions = await Repo.QuestionRepo.createQueryBuilder("question")
        .innerJoin("question.category", "category")
        .innerJoin("question.level", "level")
        .innerJoin("question.skill", "skill")
        .leftJoinAndSelect("question.subQuestions", "subQuestion")
        .leftJoinAndSelect("subQuestion.answers", "answer")
        .where("question.id = :questionId", { questionId })
        // .andWhere("question.isDeleted = :isDeleted", { isDeleted: false })
        // .andWhere("subQuestion.isDeleted = :isDeleted", { isDeleted: false })
        // .andWhere("subQuestion.isActive = :isActive", { isActive: true })
        .select([...this.questionFields, ...this.subQuestionFields, ...this.answerFields])
        .orderBy("subQuestion.order", "ASC")
        .addOrderBy("answer.order", "ASC")
        .getOne();
      if (!questions) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      return {
        data: questions,
        message: "Get all questions by categoryId successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async getQuestionById(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide categoryId",
          success: false,
          error: {
            message: "Please provide categoryId",
            errorDetail: "CategoryId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const questions = await Repo.QuestionRepo.createQueryBuilder("question")
        .innerJoin("question.category", "category")
        .innerJoin("question.level", "level")
        .innerJoin("question.skill", "skill")
        .where("question.id = :questionId", { questionId })
        .andWhere("question.isDeleted = :isDeleted", { isDeleted: false })
        .select([...this.questionFields])
        .getOne();
      if (!questions) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      return {
        data: questions,
        message: "Get all questions by categoryId successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async getAllQuestions(): Promise<IResponseBase> {
    throw new Error("Method not implemented.");
  }
  async getAllQuestionByCategoryId(categoryId: string, isActive?: boolean): Promise<IResponseBase> {
    try {
      if (!categoryId) {
        return {
          data: null,
          message: "Please provide categoryId",
          success: false,
          error: {
            message: "Please provide categoryId",
            errorDetail: "CategoryId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const questions = await Repo.QuestionRepo.createQueryBuilder("question")
        .innerJoin("question.category", "category")
        .innerJoin("question.level", "level")
        .innerJoin("question.skill", "skill")
        .where("category.id = :categoryId", { categoryId })
        .andWhere("question.isDeleted = :isDeleted", { isDeleted: false })
        .andWhere(isActive !== undefined && "question.isActive = :isActive", { isActive })
        .select([...this.questionFields])
        .orderBy("question.createdAt", "DESC")
        .getMany();
      return {
        data: questions,
        message: "Get all questions by categoryId successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async getAllQuestionBySkillId(skillId: string): Promise<IResponseBase> {
    throw new Error("Method not implemented.");
  }
  async getAllQuestionByLevelId(levelId: string): Promise<IResponseBase> {
    throw new Error("Method not implemented.");
  }
  async deleteQuestion(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide questionId",
          success: false,
          error: {
            message: "Please provide questionId",
            errorDetail: "QuestionId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const question = await Repo.QuestionRepo.findOne({
        where: {
          id: questionId,
        },
      });
      if (!question) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      question.isDeleted = true;
      await Repo.QuestionRepo.save(question);

      return {
        data: question,
        message: "Delete question successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async restoreQuestion(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide questionId",
          success: false,
          error: {
            message: "Please provide questionId",
            errorDetail: "QuestionId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const question = await Repo.QuestionRepo.findOne({
        where: {
          id: questionId,
        },
      });
      if (!question) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      question.isDeleted = false;
      await Repo.QuestionRepo.save(question);

      return {
        data: question,
        message: "Restore question successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async activeQuestion(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide questionId",
          success: false,
          error: {
            message: "Please provide questionId",
            errorDetail: "QuestionId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const question = await Repo.QuestionRepo.findOne({
        where: {
          id: questionId,
        },
      });
      if (!question) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      question.isActive = true;
      await Repo.QuestionRepo.save(question);

      return {
        data: question,
        message: "Active question successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async inactiveQuestion(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide questionId",
          success: false,
          error: {
            message: "Please provide questionId",
            errorDetail: "QuestionId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const question = await Repo.QuestionRepo.findOne({
        where: {
          id: questionId,
        },
      });
      if (!question) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      question.isActive = false;
      await Repo.QuestionRepo.save(question);

      return {
        data: question,
        message: "Active question successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
  async deleteQuestionPermanently(questionId: string): Promise<IResponseBase> {
    try {
      if (!questionId) {
        return {
          data: null,
          message: "Please provide questionId",
          success: false,
          error: {
            message: "Please provide questionId",
            errorDetail: "QuestionId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const question = await Repo.QuestionRepo.findOne({
        where: {
          id: questionId,
        },
      });
      if (!question) {
        return {
          data: null,
          message: "Question not found",
          success: false,
          error: {
            message: "Question not found",
            errorDetail: "Question not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      await Repo.QuestionRepo.remove(question);

      return {
        data: question,
        message: "Delete question successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error.message,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
}