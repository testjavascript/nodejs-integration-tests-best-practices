import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";

let app: INestApplication;

export const initializeWebServer = async () => {
  app = await NestFactory.create(AppModule);

  // ➿ Port is required in Nest.js, we can send 0 to get a available dynamic port
  await app.listen(0);

  return app;
};

export const stopWebServer = async () => {
  return await app.close();
};