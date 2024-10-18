///TODO

import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface ForumDoc extends BaseDoc {
  forumName: string;
  forumContent: string[];
  forumFollowers: string[];
  admin: string;
}

export default class ForumConcept {
  public readonly forums: DocCollection<ForumDoc>;

  constructor(collectionName: string) {
    this.forums = new DocCollection<ForumDoc>(collectionName);
  }

  async createForum(forumName: string, user: ObjectId) {
    const forum = await this.forums.readOne({ forumName });
    if (forum) {
      throw new NotAllowedError("A forum with this name already exists.");
    }
    return await this.forums.createOne({ forumName, forumContent: [], forumFollowers: [user.toString()], admin: user.toString() });
  }
  async deleteForum(forumName: string, user: ObjectId) {
    const forum = await this.forums.readOne({ forumName });
    if (!forum) {
      return new NotAllowedError("This forum does not exist.");
    }
    if (forum.admin.toString() !== user.toString()) {
      return new NotAllowedError("This user does not have permissions to delete this forum.");
    }
    return await this.forums.deleteOne({ forumName });
  }

  async joinForum(user: ObjectId, forumName: string) {
    const forum = await this.forums.readOne({ forumName });
    if (!forum) {
      throw new NotAllowedError("This forum does not exist.");
    }
    if (forum.forumFollowers.includes(user.toString())) {
      throw new NotAllowedError("This user is already following this forum.");
    }
    const followers = forum.forumFollowers.concat([user.toString()]);
    return await this.forums.partialUpdateOne({ forumName }, { forumFollowers: followers });
  }

  async getForumNameById(id: ObjectId) {
    return (await this.forums.readOne({ _id: id }))?.forumName;
  }

  async leaveForum(user: ObjectId, forumName: string) {
    const forum = await this.forums.readOne({ forumName });
    if (!forum) {
      throw new NotAllowedError("This forum does not exist.");
    }
    if (!forum.forumFollowers.includes(user.toString())) {
      throw new NotAllowedError("This user is not following this forum.");
    }
    const followers = forum.forumFollowers;
    followers.splice(forum.forumFollowers.indexOf(user.toString()), 1);
    return await this.forums.partialUpdateOne({ forumName }, { forumFollowers: followers });
  }

  async getForumContent(user: ObjectId, forumName: string) {
    const forum = await this.forums.readOne({ forumName });
    if (!forum) {
      throw new NotAllowedError("This forum does not exist.");
    }
    if (!forum.forumFollowers.includes(user.toString())) {
      throw new NotAllowedError("This user is not following this forum.");
    }
    return forum.forumContent;
  }

  async getForums() {
    return await this.forums.readMany({});
  }

  async addToForum(user: ObjectId, content: string, forumName: string) {
    const forum = await this.forums.readOne({ forumName });
    if (!forum) {
      throw new NotAllowedError("This forum does not exist.");
    }
    if (!forum.forumFollowers.includes(user.toString())) {
      throw new NotAllowedError("This user is not following this forum.");
    }
    const forumContent = forum.forumContent.concat([content]);
    return await this.forums.partialUpdateOne({ forumName }, { forumContent });
  }

  async deleteFromForum(user: ObjectId, content: string, forumName: string) {
    const forum = await this.forums.readOne({ forumName });
    if (!forum) {
      throw new NotAllowedError("This forum does not exist.");
    }

    const forumContent = forum.forumContent;
    forumContent.splice(forumContent.indexOf(content), 1);
    return await this.forums.partialUpdateOne({ forumName }, { forumContent });
  }
}
