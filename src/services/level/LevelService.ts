import { ErrorMessages } from "@/constants/ErrorMessages";
import { IResponseBase } from "@/interfaces/base/IResponseBase";
import { ILevelDataUpdate } from "@/interfaces/level/ILevelDTO";
import ILevelService from "@/interfaces/level/ILevelService";
import { Repo } from "@/repository";
import { StatusCodes } from "http-status-codes";

export default class LevelService implements ILevelService {
  constructor() {
    // Constructor
  }

  async getAllLevels(): Promise<IResponseBase> {
    try {
      const levels = await Repo.LevelRepo.find({
        order: {
          id: "ASC",
        },
      });
      return {
        data: levels,
        message: "",
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
  async getLevelById(levelId: string): Promise<IResponseBase> {
    try {
      if (!levelId) {
        return {
          data: null,
          message: ErrorMessages.INVALID_REQUEST_BODY,
          success: false,
          error: {
            message: ErrorMessages.INVALID_REQUEST_BODY,
            errorDetail: "levelId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const level = await Repo.LevelRepo.findOne({
        where: {
          id: levelId,
        },
      });
      if (!level) {
        return {
          data: null,
          message: ErrorMessages.NOT_FOUND,
          success: false,
          error: {
            message: ErrorMessages.NOT_FOUND,
            errorDetail: "Level not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      return {
        data: level,
        message: "",
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
  async getListLevelOfSkillId(skillId: string): Promise<IResponseBase> {
    try {
      if (!skillId) {
        return {
          data: null,
          message: ErrorMessages.INVALID_REQUEST_BODY,
          success: false,
          error: {
            message: ErrorMessages.INVALID_REQUEST_BODY,
            errorDetail: "skillId is required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const levels = await Repo.LevelRepo.find({
        where: {
          skillId,
        },
        order: {
          id: "ASC",
        },
      });
      return {
        data: levels,
        message: "Get list level of skill successfully",
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
  async updateLevel(levelId: string, levelData: ILevelDataUpdate): Promise<IResponseBase> {
    try {
      if (!levelId || !levelData) {
        return {
          data: null,
          message: ErrorMessages.INVALID_REQUEST_BODY,
          success: false,
          error: {
            message: ErrorMessages.INVALID_REQUEST_BODY,
            errorDetail: "levelId and levelData are required",
          },
          status: StatusCodes.BAD_REQUEST,
        };
      }
      const level = await Repo.LevelRepo.findOne({
        where: {
          id: levelId,
        },
      });
      if (!level) {
        return {
          data: null,
          message: ErrorMessages.NOT_FOUND,
          success: false,
          error: {
            message: ErrorMessages.NOT_FOUND,
            errorDetail: "Level not found",
          },
          status: StatusCodes.NOT_FOUND,
        };
      }
      level.description = levelData.description;
      level.image = levelData.image;
      level.subQuestionNumber = levelData.subQuestionNumber;
      await Repo.LevelRepo.save(level);
      return {
        data: level,
        message: "Update level successfully",
        success: true,
        error: null,
        status: StatusCodes.OK,
      };
    } catch (error: any) {
      return {
        data: null,
        message: ErrorMessages.INTERNAL_SERVER_ERROR,
        success: false,
        error: {
          message: error,
          errorDetail: error.message,
        },
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
