import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface MessageDoc extends BaseDoc {
  to: ObjectId;
  from: ObjectId;
  content: string;
}

/**
 * concept: Messaging [User]
 */
export default class MessagingConcept {
  public readonly messages: DocCollection<MessageDoc>;

  constructor(collectionName: string) {
    this.messages = new DocCollection<MessageDoc>(collectionName);
  }

  async sendMessage(from: ObjectId, to: ObjectId, content: string) {
    const _id = await this.messages.createOne({ to, from, content });
    return { msg: "Message Sent Successfully", message: await this.messages.readOne({ _id }) };
  }

  async getMessages(from: ObjectId, to: ObjectId) {
    const filter = {
      $or: [
        { from, to },
        { to: from, from: to },
      ],
    };

    return await this.messages.readMany(filter);
  }
}
