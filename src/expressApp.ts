import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import MessageBrokerService from "./utils/message_broker/message_broker";

export default async (app: Express, messageBroker: MessageBrokerService) => {

  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      credentials: true,
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
  );
  
};
