import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface LocationDoc extends BaseDoc {
  object: ObjectId;
  location: string;
}

export default class TravellingConcept {
  public readonly locations: DocCollection<LocationDoc>;

  constructor(collectionName: string) {
    this.locations = new DocCollection<LocationDoc>(collectionName);
  }

  async getLocation(object: ObjectId) {
    return await this.locations.readOne({ object });
  }

  async setLocation(object: ObjectId, location: string) {
    return await this.locations.createOne({ object, location });
  }

  async changeLocation(object: ObjectId, location: string) {
    return await this.locations.partialUpdateOne({ object }, { location });
  }
}
