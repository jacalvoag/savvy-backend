import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const latency = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${statusCode} ${latency}ms — ${ip}`);
    });

    next();
  }
}

