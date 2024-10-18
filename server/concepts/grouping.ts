/// TODO

import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";

export interface GroupDoc extends BaseDoc {
  groupName: string;
  members: string[];
  boards: ObjectId[];
  admin: ObjectId;
}

export interface GroupInviteDoc extends BaseDoc {
    from: ObjectId;
    to: ObjectId;
    groupName: string;
    status: "pending" | "rejected" | "accepted";
  }

/// I have decided to make my groups run only on invites and not requests. I would like to keep this here for potential expansion on utility.
export interface GroupRequestDoc extends BaseDoc {
    requestee: ObjectId;
    groupName: string;
    status: "pending" | "rejected" | "accepted";
  }

export default class GroupingConcept {
    public readonly groups: DocCollection<GroupDoc>;
    public readonly invites: DocCollection<GroupInviteDoc>;
    public readonly requests: DocCollection<GroupRequestDoc>;

    constructor(collectionName: string) {
        this.groups = new DocCollection<GroupDoc>(collectionName)
        this.invites = new DocCollection<GroupInviteDoc>(collectionName + "_invites")
        this.requests = new DocCollection<GroupRequestDoc>(collectionName + "_GRequests")
    }

    async getGroupAdmin(object: ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        return group.admin
    }

    async createGroup(groupName: string, creator: ObjectId) {
        const isGroup = await this.groups.readOne( {groupName} )
        if (isGroup) {throw new NotAllowedError("This group name is already taken.")}
        return await this.groups.createOne({ groupName, members: [creator.toString()], boards: [], admin: creator })
    }

    async getGroups(user: ObjectId) {
        return await this.groups.readMany({members: user.toString()})
    }

    async disbandGroup(groupName: string, requestor: ObjectId) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (requestor.toString() !== group.admin.toString()) {
            throw new NotAllowedError("Requestor does not possess admin priveleges over this group.")
        }
        return await this.groups.deleteOne({ groupName });
    }

    async leaveGroup(groupName: string, user: ObjectId) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        await this.assertIsMember(user, groupName);

        const mems = group.members
        mems.splice(mems.indexOf(user.toString()), 1)
        return await this.groups.partialUpdateOne({groupName}, {members: mems})
    }

    async invite(from:ObjectId, to:ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (from.toString() !== group.admin.toString()) {
            throw new NotAllowedError("Requestor does not possess admin priveleges over this group.")
        }
        if (group.members.includes(to.toString())) {throw new NotAllowedError("The group already contains this member.")}
        return this.invites.createOne({from, to, groupName, status: "pending"})
    }

    async revokeInvite(from:ObjectId, to:ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (from.toString() !== group.admin.toString()) {
            throw new NotAllowedError("Requestor does not possess admin priveleges over this group.")
        }
        return this.invites.deleteOne({from, to, groupName, status: "pending"})
    }

    async acceptInvite(user:ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        const invite = await this.invites.readOne({to: user, groupName})
        if (!invite) { throw new NotAllowedError("You do not have an invite to this group.")}
        await this.invites.partialUpdateOne({to: user, groupName}, {status: "accepted"})
        const mem = group.members.concat([user.toString()]) 
        return await this.groups.partialUpdateOne({groupName}, {members: mem})
        
    }
    
    async rejectInvite(user:ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        const invite = await this.invites.readOne({to: user, groupName})
        if (!invite) { throw new NotAllowedError("You do not have an invite to this group.")}
        await this.invites.partialUpdateOne({to: user, groupName}, {status: "rejected"})
    }

    async getUserInvites(user: ObjectId) {
        return await this.invites.readMany({ to: user });
      }

    async getGroupInvites(user: ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (user.toString() !== group.admin.toString()) {
            throw new NotAllowedError("Requestor does not possess admin priveleges over this group.")
        }
        return await this.invites.readMany({ groupName });
      }

    async createGroupBoard(user: ObjectId, object: ObjectId, groupName: string) {
        /**
         * This is using an array so that funcitonality can be extended in the future.
         */
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (user.toString() !== group.admin.toString()) {
            throw new NotAllowedError("Requestor does not possess admin priveleges over this group.")
        }
        if (group.boards.length !== 0) {throw new NotAllowedError("Only one board allowed per group")}
        const boards = group.boards.concat([object])
        return await this.groups.partialUpdateOne({groupName}, {boards})
    }

    async deleteGroupBoard(user: ObjectId, object: ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (user.toString() !== group.admin.toString()) {
            throw new NotAllowedError("Requestor does not possess admin priveleges over this group.")
        }
        const boards = group.boards.splice(group.boards.lastIndexOf(object), 1)
        return await this.groups.partialUpdateOne({groupName}, {boards})
    }

    async getBoards(user: ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (!group.members.includes(user.toString())) {throw new NotAllowedError("This user is not a member of this group.")}
        return group.boards
    }
    

    async getMembers(groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        return group.members
    }

    async assertIsMember(user: ObjectId, groupName: string) {
        const group = await this.groups.readOne({ groupName });
        if (!group) { throw new BadValuesError("This group does not exist:", + groupName)}
        if (!group.members.includes(user.toString())) {throw new NotAllowedError("This user is not a member of this group.")}
    }


}


