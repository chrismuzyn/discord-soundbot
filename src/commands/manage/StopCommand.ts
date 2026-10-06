import type { Message } from "discord.js";

import QueueCommand from "../base/QueueCommand";

export class StopCommand extends QueueCommand {
  public readonly triggers = ["leave", "stop"];

  public run(message: Message) {
    if (!message.guild) return;
    if (!message.guild.members.me) return;

    this.queue.clear();

    const { voice } = message.guild.members.me;
    if (!voice.channel) return;

    // Disconnecting while not connected to a voice channel is rejected by
    // the API (error 5006), which would crash the process as an unhandled
    // rejection if left uncaught.
    voice.disconnect().catch(() => undefined);
  }
}
