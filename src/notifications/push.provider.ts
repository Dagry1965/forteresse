import { Injectable } from "@nestjs/common";
import fetch from "node-fetch";

@Injectable()
export class PushProvider {
  async sendPush(expoToken: string, title: string, body: string) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: expoToken,
        title,
        body,
        sound: "default",
      }),
    });
  }
}
