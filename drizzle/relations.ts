import { relations } from "drizzle-orm/relations";
import { albumImages, albumImageLikes, users, albums, albumJoinRequests, albumShares, communities, communityMembers, albumImageComments, followers, groups, groupMembers, groupStories, groupStoryViews, posts, inviteRequests, postInvites, messages, notifications, postComments, postInviteParticipants, locationRequests, postLikes, postLocations, stories, storyViews, postShares, profileVisitors, thoughts, albumContributors, groupMessages, userSettings, userTags, tags, events, eventParticipants, eventThemes } from "./schema";

export const albumImageLikesRelations = relations(albumImageLikes, ({one}) => ({
	albumImage: one(albumImages, {
		fields: [albumImageLikes.imageId],
		references: [albumImages.id]
	}),
	user: one(users, {
		fields: [albumImageLikes.userId],
		references: [users.id]
	}),
}));

export const albumImagesRelations = relations(albumImages, ({one, many}) => ({
	albumImageLikes: many(albumImageLikes),
	album: one(albums, {
		fields: [albumImages.albumId],
		references: [albums.id]
	}),
	user: one(users, {
		fields: [albumImages.contributorId],
		references: [users.id]
	}),
	albumImageComments: many(albumImageComments),
}));

export const usersRelations = relations(users, ({many}) => ({
	albumImageLikes: many(albumImageLikes),
	albumJoinRequests_userId: many(albumJoinRequests, {
		relationName: "albumJoinRequests_userId_users_id"
	}),
	albumJoinRequests_respondedBy: many(albumJoinRequests, {
		relationName: "albumJoinRequests_respondedBy_users_id"
	}),
	albumShares_sharedBy: many(albumShares, {
		relationName: "albumShares_sharedBy_users_id"
	}),
	albumShares_sharedWith: many(albumShares, {
		relationName: "albumShares_sharedWith_users_id"
	}),
	albumImages: many(albumImages),
	communityMembers: many(communityMembers),
	albumImageComments: many(albumImageComments),
	communities: many(communities),
	followers_followerId: many(followers, {
		relationName: "followers_followerId_users_id"
	}),
	followers_followingId: many(followers, {
		relationName: "followers_followingId_users_id"
	}),
	groupMembers: many(groupMembers),
	groupStories: many(groupStories),
	groupStoryViews: many(groupStoryViews),
	inviteRequests: many(inviteRequests),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	notifications_userId: many(notifications, {
		relationName: "notifications_userId_users_id"
	}),
	notifications_fromUserId: many(notifications, {
		relationName: "notifications_fromUserId_users_id"
	}),
	postComments: many(postComments),
	postInviteParticipants: many(postInviteParticipants),
	locationRequests_requesterId: many(locationRequests, {
		relationName: "locationRequests_requesterId_users_id"
	}),
	locationRequests_postOwnerId: many(locationRequests, {
		relationName: "locationRequests_postOwnerId_users_id"
	}),
	postLikes: many(postLikes),
	storyViews: many(storyViews),
	posts: many(posts),
	postShares: many(postShares),
	profileVisitors_profileId: many(profileVisitors, {
		relationName: "profileVisitors_profileId_users_id"
	}),
	profileVisitors_visitorId: many(profileVisitors, {
		relationName: "profileVisitors_visitorId_users_id"
	}),
	stories: many(stories),
	thoughts: many(thoughts),
	groups: many(groups),
	albums: many(albums),
	albumContributors: many(albumContributors),
	groupMessages: many(groupMessages),
	userSettings: many(userSettings),
	userTags: many(userTags),
	eventParticipants: many(eventParticipants),
	events: many(events),
}));

export const albumJoinRequestsRelations = relations(albumJoinRequests, ({one}) => ({
	album: one(albums, {
		fields: [albumJoinRequests.albumId],
		references: [albums.id]
	}),
	user_userId: one(users, {
		fields: [albumJoinRequests.userId],
		references: [users.id],
		relationName: "albumJoinRequests_userId_users_id"
	}),
	user_respondedBy: one(users, {
		fields: [albumJoinRequests.respondedBy],
		references: [users.id],
		relationName: "albumJoinRequests_respondedBy_users_id"
	}),
}));

export const albumsRelations = relations(albums, ({one, many}) => ({
	albumJoinRequests: many(albumJoinRequests),
	albumShares: many(albumShares),
	albumImages: many(albumImages),
	user: one(users, {
		fields: [albums.creatorId],
		references: [users.id]
	}),
	albumContributors: many(albumContributors),
}));

export const albumSharesRelations = relations(albumShares, ({one}) => ({
	album: one(albums, {
		fields: [albumShares.albumId],
		references: [albums.id]
	}),
	user_sharedBy: one(users, {
		fields: [albumShares.sharedBy],
		references: [users.id],
		relationName: "albumShares_sharedBy_users_id"
	}),
	user_sharedWith: one(users, {
		fields: [albumShares.sharedWith],
		references: [users.id],
		relationName: "albumShares_sharedWith_users_id"
	}),
}));

export const communityMembersRelations = relations(communityMembers, ({one}) => ({
	community: one(communities, {
		fields: [communityMembers.communityId],
		references: [communities.id]
	}),
	user: one(users, {
		fields: [communityMembers.userId],
		references: [users.id]
	}),
}));

export const communitiesRelations = relations(communities, ({one, many}) => ({
	communityMembers: many(communityMembers),
	user: one(users, {
		fields: [communities.createdBy],
		references: [users.id]
	}),
	stories: many(stories),
}));

export const albumImageCommentsRelations = relations(albumImageComments, ({one}) => ({
	albumImage: one(albumImages, {
		fields: [albumImageComments.imageId],
		references: [albumImages.id]
	}),
	user: one(users, {
		fields: [albumImageComments.userId],
		references: [users.id]
	}),
}));

export const followersRelations = relations(followers, ({one}) => ({
	user_followerId: one(users, {
		fields: [followers.followerId],
		references: [users.id],
		relationName: "followers_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [followers.followingId],
		references: [users.id],
		relationName: "followers_followingId_users_id"
	}),
}));

export const groupMembersRelations = relations(groupMembers, ({one}) => ({
	group: one(groups, {
		fields: [groupMembers.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupMembers.userId],
		references: [users.id]
	}),
}));

export const groupsRelations = relations(groups, ({one, many}) => ({
	groupMembers: many(groupMembers),
	groupStories: many(groupStories),
	user: one(users, {
		fields: [groups.createdBy],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [groups.postId],
		references: [posts.id]
	}),
	groupMessages: many(groupMessages),
}));

export const groupStoriesRelations = relations(groupStories, ({one, many}) => ({
	group: one(groups, {
		fields: [groupStories.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupStories.userId],
		references: [users.id]
	}),
	groupStoryViews: many(groupStoryViews),
}));

export const groupStoryViewsRelations = relations(groupStoryViews, ({one}) => ({
	groupStory: one(groupStories, {
		fields: [groupStoryViews.storyId],
		references: [groupStories.id]
	}),
	user: one(users, {
		fields: [groupStoryViews.userId],
		references: [users.id]
	}),
}));

export const inviteRequestsRelations = relations(inviteRequests, ({one}) => ({
	post: one(posts, {
		fields: [inviteRequests.postId],
		references: [posts.id]
	}),
	postInvite: one(postInvites, {
		fields: [inviteRequests.inviteId],
		references: [postInvites.id]
	}),
	user: one(users, {
		fields: [inviteRequests.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	inviteRequests: many(inviteRequests),
	postComments: many(postComments),
	locationRequests: many(locationRequests),
	postInvites: many(postInvites),
	postLikes: many(postLikes),
	postLocations: many(postLocations),
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	postShares: many(postShares),
	groups: many(groups),
}));

export const postInvitesRelations = relations(postInvites, ({one, many}) => ({
	inviteRequests: many(inviteRequests),
	postInviteParticipants: many(postInviteParticipants),
	post: one(posts, {
		fields: [postInvites.postId],
		references: [posts.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user_userId: one(users, {
		fields: [notifications.userId],
		references: [users.id],
		relationName: "notifications_userId_users_id"
	}),
	user_fromUserId: one(users, {
		fields: [notifications.fromUserId],
		references: [users.id],
		relationName: "notifications_fromUserId_users_id"
	}),
}));

export const postCommentsRelations = relations(postComments, ({one}) => ({
	post: one(posts, {
		fields: [postComments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postComments.userId],
		references: [users.id]
	}),
}));

export const postInviteParticipantsRelations = relations(postInviteParticipants, ({one}) => ({
	postInvite: one(postInvites, {
		fields: [postInviteParticipants.inviteId],
		references: [postInvites.id]
	}),
	user: one(users, {
		fields: [postInviteParticipants.userId],
		references: [users.id]
	}),
}));

export const locationRequestsRelations = relations(locationRequests, ({one}) => ({
	post: one(posts, {
		fields: [locationRequests.postId],
		references: [posts.id]
	}),
	user_requesterId: one(users, {
		fields: [locationRequests.requesterId],
		references: [users.id],
		relationName: "locationRequests_requesterId_users_id"
	}),
	user_postOwnerId: one(users, {
		fields: [locationRequests.postOwnerId],
		references: [users.id],
		relationName: "locationRequests_postOwnerId_users_id"
	}),
}));

export const postLikesRelations = relations(postLikes, ({one}) => ({
	post: one(posts, {
		fields: [postLikes.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postLikes.userId],
		references: [users.id]
	}),
}));

export const postLocationsRelations = relations(postLocations, ({one}) => ({
	post: one(posts, {
		fields: [postLocations.postId],
		references: [posts.id]
	}),
}));

export const storyViewsRelations = relations(storyViews, ({one}) => ({
	story: one(stories, {
		fields: [storyViews.storyId],
		references: [stories.id]
	}),
	user: one(users, {
		fields: [storyViews.userId],
		references: [users.id]
	}),
}));

export const storiesRelations = relations(stories, ({one, many}) => ({
	storyViews: many(storyViews),
	user: one(users, {
		fields: [stories.userId],
		references: [users.id]
	}),
	community: one(communities, {
		fields: [stories.communityId],
		references: [communities.id]
	}),
}));

export const postSharesRelations = relations(postShares, ({one}) => ({
	post: one(posts, {
		fields: [postShares.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postShares.userId],
		references: [users.id]
	}),
}));

export const profileVisitorsRelations = relations(profileVisitors, ({one}) => ({
	user_profileId: one(users, {
		fields: [profileVisitors.profileId],
		references: [users.id],
		relationName: "profileVisitors_profileId_users_id"
	}),
	user_visitorId: one(users, {
		fields: [profileVisitors.visitorId],
		references: [users.id],
		relationName: "profileVisitors_visitorId_users_id"
	}),
}));

export const thoughtsRelations = relations(thoughts, ({one}) => ({
	user: one(users, {
		fields: [thoughts.userId],
		references: [users.id]
	}),
}));

export const albumContributorsRelations = relations(albumContributors, ({one}) => ({
	album: one(albums, {
		fields: [albumContributors.albumId],
		references: [albums.id]
	}),
	user: one(users, {
		fields: [albumContributors.userId],
		references: [users.id]
	}),
}));

export const groupMessagesRelations = relations(groupMessages, ({one}) => ({
	group: one(groups, {
		fields: [groupMessages.groupId],
		references: [groups.id]
	}),
	user: one(users, {
		fields: [groupMessages.senderId],
		references: [users.id]
	}),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id]
	}),
}));

export const userTagsRelations = relations(userTags, ({one}) => ({
	user: one(users, {
		fields: [userTags.userId],
		references: [users.id]
	}),
	tag: one(tags, {
		fields: [userTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	userTags: many(userTags),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({one}) => ({
	event: one(events, {
		fields: [eventParticipants.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventParticipants.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	eventParticipants: many(eventParticipants),
	user: one(users, {
		fields: [events.createdBy],
		references: [users.id]
	}),
	eventTheme: one(eventThemes, {
		fields: [events.themeId],
		references: [eventThemes.id]
	}),
}));

export const eventThemesRelations = relations(eventThemes, ({many}) => ({
	events: many(events),
}));