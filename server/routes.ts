import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Foruming, Friending, Grouping, Messaging, Posting, Sessioning, TravellingUsers } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  @Router.get("/messages")
  async getMessagesFromUser(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toId = (await Authing.getUserByUsername(to))._id;
    return await Messaging.getMessages(user, toId);
  }

  @Router.post("/messages")
  async sendMessageTo(session: SessionDoc, to: string, content: string) {
    const user = Sessioning.getUser(session);
    const toId = (await Authing.getUserByUsername(to))._id;
    return await Messaging.sendMessage(user, toId, content);
  }

  @Router.post("/location")
  async setUserLocation(session: SessionDoc, location: string) {
    const user = Sessioning.getUser(session);
    return await TravellingUsers.setLocation(user, location);
  }

  @Router.get("/location")
  async getUserLocation(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await TravellingUsers.getLocation(user);
  }

  @Router.patch("/location")
  async changeUserLocation(session: SessionDoc, location: string) {
    const user = Sessioning.getUser(session);
    return await TravellingUsers.changeLocation(user, location);
  }

  @Router.post("/group/:groupName")
  async createGroup(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.createGroup(groupName, user);
  }

  @Router.delete("/group/:groupName")
  async deleteGroup(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.disbandGroup(groupName, user);
  }

  @Router.get("/group")
  async getUserGroups(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Grouping.getGroups(user);
  }

  @Router.get("/group/:groupName")
  async getGroupMembers(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    await Grouping.assertIsMember(user, groupName);
    return await Grouping.getMembers(groupName);
  }

  @Router.put("/group/invite/:groupName")
  async inviteToGroup(session: SessionDoc, groupName: string, to: string) {
    const user = Sessioning.getUser(session);
    const toId = (await Authing.getUserByUsername(to))._id;
    return await Grouping.invite(user, toId, groupName);
  }

  @Router.patch("/group/join/:groupName")
  async acceptInvite(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.acceptInvite(user, groupName);
  }

  @Router.patch("/group/reject/:groupName") 
  async rejectInvite(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.acceptInvite(user, groupName);
  }

  @Router.delete("group/leave/:groupName")
  async leaveGroup(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.leaveGroup(groupName, user);
  }

  @Router.get("/group/boards/:groupName")
  async getGroupBoard(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    return await Grouping.getBoards(user, groupName);
  }

  @Router.put('/group/boards/:groupName')
  async makeGroupForum(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    const forum = await Foruming.createForum(groupName + "_forum", user)
    return await Grouping.createGroupBoard(user, forum, groupName);
  }

  @Router.delete('/group/boards/:groupName')
  async deleteGroupForum(session: SessionDoc, groupName: string) {
    const user = Sessioning.getUser(session);
    const forum = (await Grouping.getBoards(user, groupName))[0];
    return await Grouping.deleteGroupBoard(user, forum, groupName);
  }

  @Router.get("/forums")
  async getForums(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Foruming.getForums()
  }

  @Router.put("/forums/:forumName")
  async joinForum(session: SessionDoc, forumName: string) {
    const user = Sessioning.getUser(session);
    return await Foruming.joinForum(user, forumName);
  }

  @Router.put('/forums')
  async createForum(session: SessionDoc, forumName: string) {
    const user = Sessioning.getUser(session);
    return await Foruming.createForum(forumName, user);
  }

  @Router.delete('/forums')
  async deleteForum(session: SessionDoc, forumName: string) {
    const user = Sessioning.getUser(session);
    return await Foruming.deleteForum(forumName, user);
  }

  @Router.delete("/forums/:forumName")
  async leaveForum(session: SessionDoc, forumName: string) {
    const user = Sessioning.getUser(session);
    return await Foruming.leaveForum(user, forumName);
  }

  @Router.get("/forums/:forumName")
  async viewForum(session: SessionDoc, forumName: string) {
    const user = Sessioning.getUser(session);
    return await Foruming.getForumContent(user, forumName);
  }

  @Router.post("/forums/:forumName")
  async postToForum(session: SessionDoc, content: string, forumName: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = (await Posting.create(user, content, options));

    return await Foruming.addToForum(user, created.post?.content?? "", forumName)
  }

  @Router.post('/group/boards/:groupName')
  async postToGroup(session: SessionDoc, content: string, groupName: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    const board = (await Grouping.getBoards(user, groupName)).at(0)?? new ObjectId()
    const forumName = await Foruming.getForumNameById(board) ?? "Error404";
    

    return await Foruming.addToForum(user, created.post?.content??"", forumName);
  }
}



/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
