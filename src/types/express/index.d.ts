import { ParsedQs } from "qs";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
