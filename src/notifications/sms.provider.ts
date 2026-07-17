import { Injectable } from "@nestjs/common";
import twilio from "twilio";

@Injectable()
export class SmsProvider {
  private client;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );
  }

  async sendSMS(to: string, message: string) {
    return this.client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to,
    });
  }
}
