import { ChannelType, Message, type PartialGroupDMChannel } from "discord.js";

type SendableChannel = Exclude<Message["channel"], PartialGroupDMChannel>;

declare module "discord.js" {
  // NOTE: Monkeypatching
  // eslint-disable-next-line no-shadow
  interface Message {
    hasPrefix(prefix: string): boolean;
    isDirectMessage(): boolean;
    readonly sendableChannel: SendableChannel;
  }
}

Message.prototype.hasPrefix = function hasPrefix(prefix) {
  return this.content.startsWith(prefix);
};

Message.prototype.isDirectMessage = function isDirectMessage() {
  return this.channel.type === ChannelType.DM;
};

Object.defineProperty(Message.prototype, "sendableChannel", {
  get(this: Message) {
    return this.channel as SendableChannel;
  },
});
