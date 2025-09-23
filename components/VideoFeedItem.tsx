import { Play, Pause, Heart, MessageCircle, Share, UserPlus, MoreHorizontal, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteButton } from "@/components/invite-button";
import { CommentModal } from "@/components/CommentModal";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface VideoFeedItemProps {
  post: {
    id: number;
    content: string;
    image?: string;
    video?: string;
    duration?: number;
    createdAt: string;
    hasPrivateLocation?: boolean;
    soundId?: string;
    soundName?: string;
    soundArtist?: string;
    soundPreviewUrl?: string;
    soundSpotifyUrl?: string;
    user: {
      id: string;
      username: string;
      nickname?: string;
      profileImage?: string;
      image?: string;
    };
    likes: number;
    isLiked: boolean;
    comments: number;
  };
  showInviteButton?: boolean;
  isActive?: boolean; // New prop to control autoplay
}

interface LocationData {
  hasLocation: boolean;
  locationName?: string;
  locationAddress?: string;
}

const VideoFeedItem = ({ 
  post,
  showInviteButton = false,
  isActive = false
}: VideoFeedItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted to hear audio
  const [currentLikes, setCurrentLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [currentComments, setCurrentComments] = useState(post.comments);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync comment count when post prop changes
  useEffect(() => {
    setCurrentComments(post.comments);
    setMediaError(false); // Reset media error when post changes
  }, [post.id, post.comments]);

  // Fetch location data if post has private location
  useEffect(() => {
    if (post.hasPrivateLocation) {
      fetch(`/api/posts/${post.id}/location`)
        .then(response => response.json())
        .then(data => {
          if (data.hasLocation) {
            setLocationData(data);
          }
        })
        .catch(error => {
          console.error('Error fetching location:', error);
        });
    }
  }, [post.id, post.hasPrivateLocation]);

  // Autoplay effect when component becomes active
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo()) return;

    const handleAutoplay = async () => {
      try {
        if (isActive) {
          // Start playing when active
          await video.play();
          setIsPlaying(true);
          console.log('🎥 Video autoplay started for post:', post.id);
        } else {
          // Pause when not active
          video.pause();
          setIsPlaying(false);
          console.log('⏸️ Video paused for post:', post.id);
        }
      } catch (error) {
        console.error('Error handling video autoplay:', error);
        // Fallback: if autoplay fails, just set playing state
        setIsPlaying(false);
      }
    };

    handleAutoplay();
  }, [isActive, post.id]);

  // Global video pause/resume for when post creator opens
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo()) return;

    const handlePauseAllVideos = () => {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
        console.log('⏸️ Video paused for post creator (post:', post.id, ')');
      }
    };

    const handleResumeVideos = () => {
      // Only resume if this video should be active and is currently paused
      if (isActive && video.paused) {
        video.play().then(() => {
          setIsPlaying(true);
          console.log('▶️ Video resumed after post creator (post:', post.id, ')');
        }).catch(console.error);
      }
    };

    window.addEventListener('pauseAllFeedVideos', handlePauseAllVideos);
    window.addEventListener('resumeFeedVideos', handleResumeVideos);

    return () => {
      window.removeEventListener('pauseAllFeedVideos', handlePauseAllVideos);
      window.removeEventListener('resumeFeedVideos', handleResumeVideos);
    };
  }, [isActive, post.id]);

  // Intersection Observer for better autoplay control and performance
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const ratio = entry.intersectionRatio;

            if (ratio > 0.7) {
              // Video is mostly visible - play if active
              if (isActive && video.paused) {
                video.play().then(() => {
                  setIsPlaying(true);
                  console.log('🎥 Video started playing (intersection):', post.id);
                }).catch(console.error);
              }
            } else if (ratio > 0.3) {
              // Video is partially visible - preload but don't play
              if (video.readyState < 2) {
                video.load(); // Preload video
                console.log('📱 Video preloading:', post.id);
              }
            } else {
              // Video is barely visible - pause if playing
              if (!video.paused) {
                video.pause();
                setIsPlaying(false);
                console.log('⏸️ Video paused (not visible enough):', post.id);
              }
            }
          } else {
            // Video is not visible - pause and reset
            if (!video.paused) {
              video.pause();
              setIsPlaying(false);
              console.log('⏸️ Video paused (not intersecting):', post.id);
            }
          }
        });
      },
      {
        threshold: [0, 0.3, 0.7, 1.0],
        rootMargin: '20px'
      }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, [isActive, post.id]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState ? currentLikes + 1 : currentLikes - 1;
    
    // Optimistic update
    setIsLiked(newLikedState);
    setCurrentLikes(newLikeCount);
    
    try {
      console.log(`${newLikedState ? 'Liking' : 'Unliking'} post ${post.id}`);
      
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: newLikedState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Like response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Like failed:", response.status, errorText);
        // Revert on error
        setIsLiked(!newLikedState);
        setCurrentLikes(currentLikes);
        toast({
          title: "Error",
          description: "Failed to like post. Please try again.",
          variant: "destructive",
        });
      } else {
        const result = await response.json();
        console.log("✅ Like successful:", result);
        // Update with server response to ensure consistency
        if (result.likes !== undefined) {
          setCurrentLikes(result.likes);
        }
        if (result.isLiked !== undefined) {
          setIsLiked(result.isLiked);
        }
      }
    } catch (error) {
      console.error("Like error:", error);
      // Revert on error
      setIsLiked(!newLikedState);
      setCurrentLikes(currentLikes);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const getBestImageUrl = (user: any): string | null => {
    if (user.profileImage && user.profileImage.trim() && !user.profileImage.includes("placeholder")) {
      return user.profileImage;
    }
    if (user.image && user.image.trim() && !user.image.includes("placeholder")) {
      return user.image;
    }
    return null;
  };

  const getMediaUrl = () => {
    const mediaUrl = post.video || post.image;
    if (!mediaUrl || mediaUrl.trim() === '') {
      console.log('⚠️ No media URL for post:', post.id);
      return '/placeholder.jpg';
    }
    
    // Log the media URL for debugging
    console.log('🔗 Media URL for post', post.id, ':', mediaUrl);
    
    // Check if it's a valid URL
    try {
      new URL(mediaUrl);
      return mediaUrl;
    } catch (urlError) {
      console.error('❌ Invalid URL for post', post.id, ':', mediaUrl, urlError);
      return '/placeholder.jpg';
    }
  };
  
  const isVideo = () => {
    return !!post.video && post.video.trim() !== '';
  };
  
  const hasMedia = () => {
    const mediaUrl = post.video || post.image;
    return !!(mediaUrl && mediaUrl.trim() !== '');
  };
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserDisplayName = () => {
    return post.user.nickname || post.user.username;
  };

  const getUserAvatar = () => {
    return getBestImageUrl(post.user) || '/placeholder-avatar.jpg';
  };

  const handleComment = () => {
    console.log('Comment clicked for post:', post.id);
    setIsCommentModalOpen(true);
  };

  const handleCommentCountChange = (change: number) => {
    setCurrentComments(prev => Math.max(0, prev + change));
  };

  const handleShare = async () => {
    try {
      console.log('🔄 Starting share process for post:', post.id);
      
      // Show immediate feedback
      toast({
        title: "Generating share link...",
        description: "Please wait a moment.",
      });
      
      // Call the share API to get proper share data
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const shareData = await response.json();
        console.log('✅ Share data received:', shareData);
        
        // Try native sharing first on mobile
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          try {
            await navigator.share({
              title: shareData.title || `Check out this post by ${getUserDisplayName()}`,
              text: shareData.text || post.content,
              url: shareData.url,
            });
            console.log('✅ Native share successful');
            toast({
              title: "Shared!",
              description: "Post shared successfully.",
            });
            return;
          } catch (shareError) {
            console.log("Native share failed, falling back to clipboard:", shareError);
          }
        }

        // Fallback to clipboard
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareData.url);
          console.log('✅ Link copied to clipboard');
          toast({
            title: "Link Copied!",
            description: "Post link has been copied to your clipboard.",
          });
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = shareData.url;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand("copy");
            console.log('✅ Link copied to clipboard (fallback)');
            toast({
              title: "Link Copied!",
              description: "Post link has been copied to your clipboard.",
            });
          } catch (err) {
            console.error('Failed to copy link');
            toast({
              title: "Share Link",
              description: `Copy this link: ${shareData.url}`,
            });
          }
          document.body.removeChild(textArea);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Share API failed:', response.status, errorText);
        throw new Error(`Failed to generate share link: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error sharing post:', error);
      // Fallback to basic sharing
      const fallbackUrl = `${window.location.origin}/posts/shared/fallback-${post.id}`;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(fallbackUrl);
          toast({
            title: "Link Copied!",
            description: "Post link has been copied to your clipboard.",
          });
        } catch {
          toast({
            title: "Share Link",
            description: `Copy this link: ${fallbackUrl}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Share Link",
          description: `Copy this link: ${fallbackUrl}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleLocationRequest = async () => {
    if (isRequestingLocation) return;
    
    try {
      setIsRequestingLocation(true);
      
      const response = await fetch('/api/location-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
        }),
      });

      if (response.ok) {
        toast({
          title: "Request Sent!",
          description: "Your location request has been sent to the post owner.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send location request');
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send location request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingLocation(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Media Background - Full Screen */}
      <div className="absolute inset-0">
        {!hasMedia() ? (
          // Text-only post background
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
            <div className="text-center text-white px-8 max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white/70" />
              </div>
              <p className="text-lg font-medium leading-relaxed">{post.content}</p>
            </div>
          </div>
        ) : isVideo() ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={getMediaUrl()}
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            poster={post.image || '/placeholder.jpg'}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedData={() => {
              console.log('📹 Video loaded for post:', post.id, 'URL:', getMediaUrl());
              // Attempt autoplay when video is loaded and active
              if (isActive && videoRef.current) {
                videoRef.current.play().catch(console.error);
              }
            }}
            onError={(e) => {
              const url = getMediaUrl();
              console.error('❌ Video error for post:', post.id, 'URL:', url);
              console.error('Error details:', e.currentTarget.error);
              
              // Try to validate the URL
              fetch('/api/validate-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              }).then(res => res.json()).then(result => {
                console.log('🔍 URL validation result:', result);
              }).catch(err => {
                console.error('Failed to validate URL:', err);
              });
              
              setMediaError(true);
            }}
            onCanPlayThrough={() => {
              console.log('📹 Video can play through:', post.id);
            }}
            onWaiting={() => {
              console.log('⏳ Video buffering:', post.id);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <img
            className="w-full h-full object-cover"
            src={getMediaUrl()}
            alt="Post content"
            onError={(e) => {
              const url = getMediaUrl();
              console.error('❌ Image error for post:', post.id, 'URL:', url);
              console.error('Error details:', e.currentTarget.onerror);
              
              // Try to validate the URL
              fetch('/api/validate-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              }).then(res => res.json()).then(result => {
                console.log('🔍 URL validation result:', result);
              }).catch(err => {
                console.error('Failed to validate URL:', err);
              });
              
              setMediaError(true);
            }}
            onLoad={() => {
              console.log('📷 Image loaded for post:', post.id, 'URL:', getMediaUrl());
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
        
        {/* Fallback for media errors */}
        {mediaError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center text-white/70">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-8 h-8" />
              </div>
              <p className="text-sm">Media unavailable</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Video Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Play/Pause Overlay - Only show for videos, more subtle like TikTok */}
      {isVideo() && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.play().catch(console.error);
              }
            }}
            className="w-20 h-20 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-md transition-all duration-300 border border-white/20"
          >
            <Play className="w-10 h-10 ml-1" />
          </Button>
        </div>
      )}
      
      {/* Tap to pause (invisible overlay) */}
      {isVideo() && isPlaying && (
        <div 
          className="absolute inset-0 z-5"
          onClick={(e) => {
            // Don't pause if clicking on buttons or interactive elements
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('[role="button"]')) {
              return;
            }
            
            const video = videoRef.current;
            if (video) {
              video.pause();
            }
          }}
        />
      )}
      
      {/* Duration Badge (if available) */}
      {post.duration && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
            {formatDuration(post.duration)}
          </div>
        </div>
      )}



      {/* Right Side Actions - Minimal Design */}
      <div className="absolute right-4 bottom-36 md:bottom-28 flex flex-col space-y-4 z-20">
        <div className="flex flex-col items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={isLiking}
            className={`w-10 h-10 rounded-full transition-all duration-200 ${
              isLiked 
                ? 'bg-white text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            } backdrop-blur-sm`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <span className="text-white text-xs font-medium mt-1">{currentLikes}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              handleComment();
            }}
            className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <span className="text-white text-xs font-medium mt-1">{currentComments}</span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            console.log('🔄 Share button clicked for post:', post.id);
            handleShare();
          }}
          className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
        >
          <Share className="w-5 h-5" />
        </Button>

        {/* Mute/Unmute Button - Only show for videos */}
        {isVideo() && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              const newMutedState = !isMuted;
              setIsMuted(newMutedState);
              if (videoRef.current) {
                videoRef.current.muted = newMutedState;
              }
              console.log('🔊 Audio toggled:', newMutedState ? 'muted' : 'unmuted');
            }}
            className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </Button>
        )}
      </div>

      {/* Bottom Content - Clean & Elegant */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pb-20 md:pb-8">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar 
            className="w-12 h-12 border-2 border-white cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => {
              window.location.href = `/profile/${post.user.id}`;
            }}
          >
            <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-white text-black font-semibold">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              window.location.href = `/profile/${post.user.id}`;
            }}
          >
            <h3 className="font-semibold text-white text-lg">{getUserDisplayName()}</h3>
            <p className="text-white/60 text-sm">@{post.user.username}</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-white text-base mb-4 leading-relaxed font-medium">
          {post.content}
        </p>
        
        {/* Sound Info */}
        {post.soundName && (
          <div className="flex items-center space-x-3 mb-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {post.soundName}
              </p>
              {post.soundArtist && (
                <p className="text-white/70 text-xs truncate">
                  {post.soundArtist}
                </p>
              )}
            </div>
            {post.soundSpotifyUrl && (
              <button
                onClick={() => window.open(post.soundSpotifyUrl, '_blank')}
                className="text-green-400 hover:text-green-300 transition-colors p-1"
                title="Open in Spotify"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Invite Section */}
        {showInviteButton && (
          <div className="mb-4">
            <InviteButton postId={post.id} postUserId={post.user.id} />
          </div>
        )}
        
        {/* Location */}
        {locationData && (
          <div className="flex items-center text-white/80 text-sm mb-2">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{locationData.locationName || "Location available"}</span>
            {!locationData.locationAddress && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLocationRequest}
                disabled={isRequestingLocation}
                className="ml-2 text-white hover:text-white hover:bg-white/10 p-1 h-auto"
              >
                {isRequestingLocation ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Request Details"
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={post.id}
        postContent={post.content}
        postUser={{
          username: post.user.username,
          nickname: post.user.nickname,
          profileImage: getBestImageUrl(post.user) || undefined,
        }}
        onCommentCountChange={handleCommentCountChange}
      />

    </div>
  );
};

export default VideoFeedItem;