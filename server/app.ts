import AuthenticatingConcept from "./concepts/authenticating";
import ForumConcept from "./concepts/foruming";
import FriendingConcept from "./concepts/friending";
import GroupingConcept from "./concepts/grouping";
import MessagingConcept from "./concepts/messaging";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import TravellingConcept from "./concepts/travelling";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Messaging = new MessagingConcept("messages");
export const TravellingUsers = new TravellingConcept("users");
export const Grouping = new GroupingConcept('groups');
export const Foruming = new ForumConcept("forums")
