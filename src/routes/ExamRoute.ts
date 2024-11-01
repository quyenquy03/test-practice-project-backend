import { Response } from "express";
import { Request as ExpressRequest } from "express";
import { BaseRoute } from "./BaseRoute";
import { ExamController } from "@/controllers/ExamController";

class ExamRoute extends BaseRoute {
  private _examController: ExamController;
  constructor() {
    super();
    this._examController = new ExamController();
    this.init();
  }

  private init() {
    this.router.get("/current-exam", (req: ExpressRequest, res: Response) => {
      this._examController.getCurrentExam(req, res);
    });
    this.router.post("/start-new-exam", (req: ExpressRequest, res: Response) => {
      this._examController.startNewExam(req, res);
    });
    this.router.post("/participate-exam", (req: ExpressRequest, res: Response) => {
      this._examController.participateExam(req, res);
    });
    this.router.post("/continue-exam", (req: ExpressRequest, res: Response) => {
      this._examController.continueExam(req, res);
    });
    this.router.post("/submit-skill", (req: ExpressRequest, res: Response) => {
      this._examController.submitSkill(req, res);
    });
  }
}

export = new ExamRoute().router;
