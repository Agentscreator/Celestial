import { pgTable, foreignKey, integer, uuid, timestamp, varchar, text, real, unique, date, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const storyType = pgEnum("story_type", ['personal', 'community'])
export const tagCategory = pgEnum("tag_category", ['interest', 'context', 'intention'])


export const albumImageLikes = pgTable("album_image_likes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "album_image_likes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	imageId: integer("image_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [albumImages.id],
			name: "album_image_likes_image_id_album_images_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "album_image_likes_user_id_users_id_fk"
		}),
]);

export const albumJoinRequests = pgTable("album_join_requests", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "album_join_requests_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	albumId: integer("album_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	requestMessage: text(),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	respondedBy: uuid("responded_by"),
}, (table) => [
	foreignKey({
			columns: [table.albumId],
			foreignColumns: [albums.id],
			name: "album_join_requests_album_id_albums_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "album_join_requests_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.respondedBy],
			foreignColumns: [users.id],
			name: "album_join_requests_responded_by_users_id_fk"
		}),
]);

export const albumShares = pgTable("album_shares", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "album_shares_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	albumId: integer("album_id").notNull(),
	sharedBy: uuid("shared_by").notNull(),
	sharedWith: uuid("shared_with"),
	shareToken: varchar("share_token", { length: 64 }).notNull(),
	accessLevel: varchar("access_level", { length: 20 }).default('view').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.albumId],
			foreignColumns: [albums.id],
			name: "album_shares_album_id_albums_id_fk"
		}),
	foreignKey({
			columns: [table.sharedBy],
			foreignColumns: [users.id],
			name: "album_shares_shared_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.sharedWith],
			foreignColumns: [users.id],
			name: "album_shares_shared_with_users_id_fk"
		}),
]);

export const albumImages = pgTable("album_images", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "album_images_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	albumId: integer("album_id").notNull(),
	contributorId: uuid("contributor_id").notNull(),
	imageUrl: varchar("image_url", { length: 500 }).notNull(),
	caption: text(),
	likes: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.albumId],
			foreignColumns: [albums.id],
			name: "album_images_album_id_albums_id_fk"
		}),
	foreignKey({
			columns: [table.contributorId],
			foreignColumns: [users.id],
			name: "album_images_contributor_id_users_id_fk"
		}),
]);

export const communityMembers = pgTable("community_members", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "community_members_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	communityId: uuid("community_id").notNull(),
	userId: uuid("user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "community_members_community_id_communities_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "community_members_user_id_users_id_fk"
		}),
]);

export const albumImageComments = pgTable("album_image_comments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "album_image_comments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	imageId: integer("image_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [albumImages.id],
			name: "album_image_comments_image_id_album_images_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "album_image_comments_user_id_users_id_fk"
		}),
]);

export const communities = pgTable("communities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	image: varchar({ length: 500 }),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "communities_created_by_users_id_fk"
		}),
]);

export const followers = pgTable("followers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "followers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	followerId: uuid("follower_id").notNull(),
	followingId: uuid("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [users.id],
			name: "followers_follower_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [users.id],
			name: "followers_following_id_users_id_fk"
		}),
]);

export const groupMembers = pgTable("group_members", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "group_members_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	groupId: integer("group_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 20 }).default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_members_group_id_groups_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_members_user_id_users_id_fk"
		}),
]);

export const groupStories = pgTable("group_stories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "group_stories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	groupId: integer("group_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text(),
	image: varchar({ length: 500 }),
	video: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_stories_group_id_groups_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_stories_user_id_users_id_fk"
		}),
]);

export const groupStoryViews = pgTable("group_story_views", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "group_story_views_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	storyId: integer("story_id").notNull(),
	userId: uuid("user_id").notNull(),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [groupStories.id],
			name: "group_story_views_story_id_group_stories_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_story_views_user_id_users_id_fk"
		}),
]);

export const inviteRequests = pgTable("invite_requests", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "invite_requests_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	inviteId: integer("invite_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "invite_requests_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.inviteId],
			foreignColumns: [postInvites.id],
			name: "invite_requests_invite_id_post_invites_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "invite_requests_user_id_users_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "messages_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	content: text(),
	messageType: varchar("message_type", { length: 20 }).default('text').notNull(),
	attachmentUrl: text("attachment_url"),
	attachmentType: varchar("attachment_type", { length: 50 }),
	attachmentName: varchar("attachment_name", { length: 255 }),
	attachmentSize: integer("attachment_size"),
	duration: integer(),
	isRead: integer("is_read").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_users_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "notifications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: uuid("user_id").notNull(),
	fromUserId: uuid("from_user_id"),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	data: text(),
	isRead: integer("is_read").default(0).notNull(),
	actionUrl: varchar("action_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "notifications_from_user_id_users_id_fk"
		}),
]);

export const postComments = pgTable("post_comments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "post_comments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	userId: uuid().notNull(),
	parentCommentId: integer("parent_comment_id"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_comments_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_comments_userId_users_id_fk"
		}),
]);

export const postInviteParticipants = pgTable("post_invite_participants", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "post_invite_participants_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	inviteId: integer("invite_id").notNull(),
	userId: uuid("user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.inviteId],
			foreignColumns: [postInvites.id],
			name: "post_invite_participants_invite_id_post_invites_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_invite_participants_user_id_users_id_fk"
		}),
]);

export const locationRequests = pgTable("location_requests", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "location_requests_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	requesterId: uuid("requester_id").notNull(),
	postOwnerId: uuid("post_owner_id").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	locationName: varchar("location_name", { length: 200 }),
	locationAddress: text("location_address"),
	latitude: real(),
	longitude: real(),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "location_requests_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [users.id],
			name: "location_requests_requester_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.postOwnerId],
			foreignColumns: [users.id],
			name: "location_requests_post_owner_id_users_id_fk"
		}),
]);

export const postInvites = pgTable("post_invites", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "post_invites_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	inviteDescription: text("invite_description"),
	participantLimit: integer("participant_limit").default(10).notNull(),
	currentParticipants: integer("current_participants").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_invites_post_id_posts_id_fk"
		}),
]);

export const postLikes = pgTable("post_likes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "post_likes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_likes_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_likes_userId_users_id_fk"
		}),
]);

export const postLocations = pgTable("post_locations", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "post_locations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	locationName: varchar("location_name", { length: 200 }).notNull(),
	locationAddress: text("location_address"),
	latitude: real(),
	longitude: real(),
	isPrivate: integer("is_private").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_locations_post_id_posts_id_fk"
		}),
]);

export const storyViews = pgTable("story_views", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "story_views_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	storyId: integer("story_id").notNull(),
	userId: uuid().notNull(),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_views_story_id_stories_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "story_views_userId_users_id_fk"
		}),
]);

export const tags = pgTable("tags", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "tags_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 100 }).notNull(),
	tagCategory: tagCategory("tag_category").notNull(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
]);

export const posts = pgTable("posts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "posts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: uuid().notNull(),
	content: text(),
	image: varchar({ length: 500 }),
	video: varchar({ length: 500 }),
	duration: integer(),
	editedVideoData: text("edited_video_data"),
	hasPrivateLocation: integer("has_private_location").default(0).notNull(),
	communityName: varchar("community_name", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_userId_users_id_fk"
		}),
]);

export const postShares = pgTable("post_shares", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "post_shares_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	postId: integer("post_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_shares_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_shares_user_id_users_id_fk"
		}),
]);

export const profileVisitors = pgTable("profile_visitors", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "profile_visitors_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	profileId: uuid("profile_id").notNull(),
	visitorId: uuid("visitor_id").notNull(),
	visitedAt: timestamp("visited_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [users.id],
			name: "profile_visitors_profile_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.visitorId],
			foreignColumns: [users.id],
			name: "profile_visitors_visitor_id_users_id_fk"
		}),
]);

export const stories = pgTable("stories", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "stories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: uuid().notNull(),
	type: storyType().default('personal').notNull(),
	communityId: uuid("community_id"),
	content: text(),
	image: varchar({ length: 500 }),
	video: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "stories_userId_users_id_fk"
		}),
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "stories_community_id_communities_id_fk"
		}),
]);

export const thoughts = pgTable("thoughts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "thoughts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: uuid().notNull(),
	title: varchar({ length: 200 }),
	content: text().notNull(),
	embedding: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "thoughts_userId_users_id_fk"
		}),
]);

export const groups = pgTable("groups", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "groups_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	image: varchar({ length: 500 }),
	createdBy: uuid("created_by").notNull(),
	postId: integer("post_id"),
	isActive: integer("is_active").default(1).notNull(),
	maxMembers: integer("max_members").default(10),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "groups_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "groups_post_id_posts_id_fk"
		}),
]);

export const albums = pgTable("albums", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "albums_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	creatorId: uuid("creator_id").notNull(),
	isPublic: integer("is_public").default(1).notNull(),
	allowContributions: integer("allow_contributions").default(1).notNull(),
	shareToken: varchar("share_token", { length: 64 }),
	maxContributors: integer("max_contributors"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "albums_creator_id_users_id_fk"
		}),
	unique("albums_share_token_unique").on(table.shareToken),
]);

export const albumContributors = pgTable("album_contributors", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "album_contributors_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	albumId: integer("album_id").notNull(),
	userId: uuid("user_id").notNull(),
	canEdit: integer("can_edit").default(0).notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.albumId],
			foreignColumns: [albums.id],
			name: "album_contributors_album_id_albums_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "album_contributors_user_id_users_id_fk"
		}),
]);

export const groupMessages = pgTable("group_messages", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "group_messages_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	groupId: integer("group_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	content: text(),
	messageType: varchar("message_type", { length: 20 }).default('text').notNull(),
	attachmentUrl: text("attachment_url"),
	attachmentType: varchar("attachment_type", { length: 50 }),
	attachmentName: varchar("attachment_name", { length: 255 }),
	attachmentSize: integer("attachment_size"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [groups.id],
			name: "group_messages_group_id_groups_id_fk"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "group_messages_sender_id_users_id_fk"
		}),
]);

export const userSettings = pgTable("user_settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "user_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: uuid("user_id").notNull(),
	inviteMode: varchar("invite_mode", { length: 20 }).default('manual').notNull(),
	autoAcceptLimit: integer("auto_accept_limit").default(10),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_settings_user_id_users_id_fk"
		}),
	unique("user_settings_user_id_unique").on(table.userId),
]);

export const userTags = pgTable("user_tags", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "user_tags_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: uuid().notNull(),
	tagId: integer("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_tags_userId_users_id_fk"
		}),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "user_tags_tag_id_tags_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	dob: date().notNull(),
	gender: varchar({ length: 20 }).notNull(),
	genderPreference: varchar({ length: 20 }).notNull(),
	preferredAgeMin: integer().notNull(),
	preferredAgeMax: integer().notNull(),
	proximity: varchar({ length: 20 }).notNull(),
	timezone: varchar({ length: 100 }).notNull(),
	metroArea: varchar("metro_area", { length: 100 }).notNull(),
	latitude: real().notNull(),
	longitude: real().notNull(),
	profileImage: varchar("profile_image", { length: 500 }),
	about: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	image: varchar({ length: 500 }),
	nickname: varchar({ length: 100 }),
});

export const eventParticipants = pgTable("event_participants", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "event_participants_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	eventId: integer("event_id").notNull(),
	userId: uuid("user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_participants_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_participants_user_id_users_id_fk"
		}),
]);

export const eventThemes = pgTable("event_themes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "event_themes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text(),
	primaryColor: varchar("primary_color", { length: 7 }).notNull(),
	secondaryColor: varchar("secondary_color", { length: 7 }).notNull(),
	accentColor: varchar("accent_color", { length: 7 }).notNull(),
	textColor: varchar("text_color", { length: 7 }).notNull(),
	backgroundGradient: text("background_gradient"),
	fontFamily: varchar("font_family", { length: 100 }).notNull(),
	fontWeight: varchar("font_weight", { length: 20 }).default('400').notNull(),
	borderRadius: integer("border_radius").default(8).notNull(),
	shadowIntensity: varchar("shadow_intensity", { length: 20 }).default('medium').notNull(),
	category: varchar({ length: 50 }).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("event_themes_name_unique").on(table.name),
]);

export const events = pgTable("events", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	title: varchar({ length: 200 }).notNull(),
	description: text().notNull(),
	location: varchar({ length: 300 }).notNull(),
	eventDate: date("event_date").notNull(),
	eventTime: varchar("event_time", { length: 10 }).notNull(),
	maxParticipants: integer("max_participants"),
	currentParticipants: integer("current_participants").default(1).notNull(),
	createdBy: uuid("created_by").notNull(),
	shareToken: varchar("share_token", { length: 64 }).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isInvite: integer("is_invite").default(0).notNull(),
	inviteDescription: text("invite_description"),
	groupName: varchar("group_name", { length: 100 }),
	themeId: integer("theme_id"),
	customFlyerUrl: varchar("custom_flyer_url", { length: 500 }),
	flyerData: text("flyer_data"),
	thumbnailVideoUrl: varchar("thumbnail_video_url", { length: 500 }),
	thumbnailImageUrl: varchar("thumbnail_image_url", { length: 500 }),
	customBackgroundUrl: varchar("custom_background_url", { length: 500 }),
	customBackgroundType: varchar("custom_background_type", { length: 20 }),
	isRepeating: integer("is_repeating").default(0).notNull(),
	repeatPattern: varchar("repeat_pattern", { length: 20 }),
	repeatInterval: integer("repeat_interval").default(1),
	repeatEndDate: date("repeat_end_date"),
	repeatDaysOfWeek: varchar("repeat_days_of_week", { length: 20 }),
	parentEventId: integer("parent_event_id"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "events_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.themeId],
			foreignColumns: [eventThemes.id],
			name: "events_theme_id_event_themes_id_fk"
		}),
	foreignKey({
			columns: [table.parentEventId],
			foreignColumns: [table.id],
			name: "events_parent_event_id_events_id_fk"
		}),
	unique("events_share_token_unique").on(table.shareToken),
]);

export const eventMedia = pgTable("event_media", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "event_media_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	eventId: integer("event_id").notNull(),
	uploadedBy: uuid("uploaded_by").notNull(),
	mediaUrl: varchar("media_url", { length: 500 }).notNull(),
	thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
	title: varchar({ length: 200 }),
	description: text(),
	mediaType: varchar("media_type", { length: 20 }).notNull(),
	duration: integer(),
	width: integer(),
	height: integer(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	isPublic: integer("is_public").default(1).notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_media_event_id_events_id_fk"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "event_media_uploaded_by_users_id_fk"
		}),
]);
