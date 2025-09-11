"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageCircle, Plus, Users, Bell, Heart, UserPlus, MapPin, Check, X, Loader2 } from "lucide-react"
import { useMessages } from "@/hooks/use-messages"
import { useGroups } from "@/hooks/use-groups"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  postId?: number
  inviteRequestId?: number
  locationRequestId?: number
  isRead: boolean
  createdAt: string
  fromUser?: {
    id: string
    username: string
    nickname?: string
    profileImage?: string
  }
}

export default function InboxPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')

  const { conversations, loading } = useMessages()
  const { groups, loading: groupsLoading, createGroup, refetch: refetchGroups } = useGroups()

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        throw new Error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleLocationRequest = async (notificationId: number, requestId: number, action: 'accept' | 'deny') => {
    if (processingIds.has(notificationId)) return
    
    try {
      setProcessingIds(prev => new Set(prev).add(notificationId))
      
      const response = await fetch(`/api/location-requests/${requestId}/${action}`, {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        
        toast({
          title: "Success",
          description: action === 'accept' 
            ? "Location shared successfully!" 
            : "Location request denied.",
        })
      } else {
        throw new Error(`Failed to ${action} location request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing location request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} location request. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />
      case 'location_request':
        return <MapPin className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimeNotification = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session?.user?.id])

  const handleGroupClick = (groupId: number) => {
    router.push(`/groups/${groupId}`)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConversationClick = (userId: string) => {
    router.push(`/inbox/${userId}`)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    setCreatingGroup(true)
    try {
      const result = await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        maxMembers: 10,
      })

      toast({
        title: "Success",
        description: "Group created successfully!",
      })

      setShowCreateGroup(false)
      setGroupName("")
      setGroupDescription("")

      // Navigate to the new group chat
      if (result && result.id) {
        router.push(`/groups/${result.id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      })
    } finally {
      setCreatingGroup(false)
    }
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 -mx-4 -my-4 md:-mx-6 md:-my-8">

      {/* Search */}
      <div className="px-6 py-4 bg-gray-950">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder={activeTab === 'messages' ? "Search messages..." : "Search notifications..."}
            className="pl-12 h-12 rounded-xl border border-gray-700 bg-gray-900/50 backdrop-blur-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 py-2 bg-gray-950 border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Notifications
            {notifications.filter(n => !n.isRead).length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0.5 text-xs">
                {notifications.filter(n => !n.isRead).length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Messages Section */}
      {activeTab === 'messages' && (
        <div className="flex-1">
          {loading || groupsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (filteredConversations.length > 0 || groups.length > 0) ? (
            <div className="bg-gray-950">
              {/* Group Chats */}
              {groups.map((group) => (
                <div
                  key={`group-${group.id}`}
                  onClick={() => handleGroupClick(group.id)}
                  className="mx-4 mb-2 px-4 py-4 hover:bg-gray-800/40 cursor-pointer transition-all duration-200 rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage
                          src={group.image}
                          alt={group.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-semibold">
                          {group.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                        <Users className="h-2 w-2 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="font-semibold text-white truncate">
                            {group.name}
                          </h3>
                          <span className="text-xs text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">
                            GROUP
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">
                            {group.memberCount} members
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 truncate leading-tight">
                        {group.description || "Group chat"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Individual Conversations */}
              {filteredConversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.userId)}
                  className="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors active:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage
                          src={conversation.profileImage}
                          alt={conversation.username}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {(conversation.nickname || conversation.username)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="font-semibold text-white truncate">
                            {conversation.nickname || conversation.username}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white min-w-[20px] h-5 text-xs px-1.5 rounded-full">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 truncate leading-tight">
                        {truncateMessage(conversation.lastMessage)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No conversations found' : 'Your inbox is empty'}
              </h3>
              <p className="text-gray-400 text-center max-w-sm mb-6 leading-relaxed">
                {searchQuery
                  ? 'Try searching for a different name or username.'
                  : 'Start conversations with people you meet, respond to invitations, or create group chats with friends.'}
              </p>
              {!searchQuery && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push('/discover')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium"
                  >
                    Discover People
                  </Button>
                  <Button
                    onClick={() => setShowCreateGroup(true)}
                    variant="outline"
                    className="px-6 py-2.5 rounded-full font-medium"
                  >
                    Create Group
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notifications Section */}
      {activeTab === 'notifications' && (
        <div className="flex-1 bg-gray-950">
          <div className="px-4 py-4">
            {notifications.some(n => !n.isRead) && (
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    notifications.forEach(notif => {
                      if (!notif.isRead) {
                        markAsRead(notif.id)
                      }
                    })
                  }}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  Mark all as read
                </Button>
              </div>
            )}
            
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Bell className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
                <p className="text-gray-400 text-center max-w-sm">
                  When you get notifications, they'll show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      !notification.isRead
                        ? 'bg-blue-900/20 border-blue-700/50 hover:bg-blue-900/30'
                        : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {notification.fromUser && (
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={notification.fromUser.profileImage || "/placeholder-avatar.jpg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                            {(notification.fromUser.nickname || notification.fromUser.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-gray-300 text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimeNotification(notification.createdAt)}
                            </p>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        {notification.type === 'location_request' && notification.locationRequestId && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLocationRequest(notification.id, notification.locationRequestId!, 'accept')
                              }}
                              disabled={processingIds.has(notification.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingIds.has(notification.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Share Location
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLocationRequest(notification.id, notification.locationRequestId!, 'deny')
                              }}
                              disabled={processingIds.has(notification.id)}
                            >
                              {processingIds.has(notification.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <X className="h-4 w-4 mr-1" />
                              )}
                              Deny
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-center">Create New Group</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Group Name *
              </label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Description (Optional)
              </label>
              <Textarea
                placeholder="What's this group about?"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateGroup(false)}
                disabled={creatingGroup}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleCreateGroup}
                disabled={creatingGroup || !groupName.trim()}
              >
                {creatingGroup ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}