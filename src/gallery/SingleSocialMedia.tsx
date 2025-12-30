import { platformIcons } from '../Utils/CommonFun';
import { getPublicSocialPostsApi } from '../service/galleryService';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Image as ImageIcon, Video, Loader2, ArrowLeft } from 'lucide-react';

export interface SocialPost {
  id: number;
  author: {
    id: number;
    username: string;
    email: string;
  };
  post: {
    title: string;
    content: string;
    date: string;
    modified: string | null;
  };
  platforms: string[];
  links: {
    [key: string]: {
      video_url: string;
      image_url: string;
    };
  };
  platform_analytics?: {
    [platform: string]: {
      like_count?: number;
      total_reactions?: number;
      video_views?: number;
      shares_count?: number;
      comments_count?: number;
      impressions?: number;
    };
  };
  meta: {
    [key: string]: any;
  };
}

export interface SingleSocialMediaProps {
  postId?: number | string;
  post?: SocialPost;
  baseUrl?: string;
  uid?: number | string;
  domain?: string;
  onPostClick?: (post: SocialPost) => void;
  onBackClick?: () => void;
}

const SingleSocialMedia: React.FC<SingleSocialMediaProps> = ({
  postId,
  post: initialPost,
  baseUrl,
  uid,
  domain,
  onPostClick,
  onBackClick
}) => {
  const [post, setPost] = useState<SocialPost | null>(initialPost || null);
  const [relatedPosts, setRelatedPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedLoadingMore, setRelatedLoadingMore] = useState(false);
  const [relatedTotalItems, setRelatedTotalItems] = useState(0);
  const [selectedPlatformView, setSelectedPlatformView] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [tiktokIframeKey, setTiktokIframeKey] = useState(0);
  const relatedLoadMoreRef = useRef<HTMLDivElement>(null);
  const relatedObserverRef = useRef<IntersectionObserver | null>(null);
  const relatedScrollContainerRef = useRef<HTMLDivElement>(null);
  const relatedCurrentPageRef = useRef(0);
  const tiktokIframeRef = useRef<HTMLIFrameElement>(null);
  const currentId = postId?.toString() || initialPost?.id?.toString();

  const fetchRelatedPosts = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setRelatedLoading(true);
      relatedCurrentPageRef.current = 0;
    } else {
      if (relatedLoadingMore || relatedLoading) return;
      setRelatedLoadingMore(true);
    }

    try {
      const pageToLoad = reset ? 0 : relatedCurrentPageRef.current;
      const startOffset = pageToLoad * 20;
      const response = await getPublicSocialPostsApi({
        start: startOffset,
        length: 20,
        keyword: '',
        platform: '',
        date_filter: '',
        uid: uid,
        domain: domain,
      });

      if (response?.status === 'success') {
        const newPosts = response.data || [];

        if (reset) {
          setRelatedPosts(newPosts);
          relatedCurrentPageRef.current = 1;
        } else {
          setRelatedPosts(prev => [...prev, ...newPosts]);
          relatedCurrentPageRef.current += 1;
        }
        setRelatedTotalItems(response.recordsTotal || response.recordsFiltered || 0);
      }
    } catch (error) {
      console.error('Error loading related posts:', error);
    } finally {
      setRelatedLoading(false);
      setRelatedLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatedPosts(true);
  }, [fetchRelatedPosts]);

  useEffect(() => {
    if (relatedObserverRef.current) {
      relatedObserverRef.current.disconnect();
    }

    const setupObserver = () => {
      if (!relatedLoadMoreRef.current || !relatedScrollContainerRef.current) return;

      relatedObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !relatedLoadingMore && !relatedLoading && relatedPosts.length < relatedTotalItems) {
            fetchRelatedPosts(false);
          }
        },
        {
          threshold: 0.1,
          root: relatedScrollContainerRef.current,
          rootMargin: '100px'
        }
      );

      relatedObserverRef.current.observe(relatedLoadMoreRef.current);
    };

    const rafId = requestAnimationFrame(() => {
      setupObserver();
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (relatedObserverRef.current) {
        relatedObserverRef.current.disconnect();
      }
    };
  }, [relatedLoadingMore, relatedLoading, relatedPosts.length, relatedTotalItems, fetchRelatedPosts]);

  useEffect(() => {
    if (currentId) {
      setImageLoadingStates({});
      const existingPost = relatedPosts.find((post: SocialPost) => post.id.toString() === currentId);

      if (existingPost) {
        setPost(existingPost);
        const availableLinks = getAvailablePlatformLinks(existingPost);
        if (availableLinks.length > 0) {
          setSelectedPlatformView(availableLinks[0].platform);
        }
        setLoading(false);
      } else if (!initialPost) {
        fetchSinglePost();
      }
    }
  }, [currentId, relatedPosts, initialPost]);

  const fetchSinglePost = async () => {
    if (!currentId) return;

    setLoading(true);
    try {
      const response = await getPublicSocialPostsApi({
        start: 0,
        length: 20,
        keyword: currentId,
        platform: '',
        date_filter: '',
        uid: uid,
        domain: domain,
      });

      if (response?.status === 'success' && response?.data && response.data.length > 0) {
        const singlePost = response.data[0];
        setPost(singlePost);
        const availableLinks = getAvailablePlatformLinks(singlePost);
        if (availableLinks.length > 0) {
          setSelectedPlatformView(availableLinks[0].platform);
        }
      } else {
        setPost(null);
      }
    } catch (error) {
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (relatedPost: SocialPost) => {
    if (onPostClick) {
      onPostClick(relatedPost);
    }
    // Also update current post if no external handler
    if (!onPostClick) {
      setPost(relatedPost);
      setImageLoadingStates({});
      const availableLinks = getAvailablePlatformLinks(relatedPost);
      if (availableLinks.length > 0) {
        setSelectedPlatformView(availableLinks[0].platform);
      }
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  const getPostThumbnail = (post: SocialPost) => {
    if (post?.meta?.thumbnail) {
      return post.meta.thumbnail;
    }
    if (post?.meta?.mediaUrls && post?.meta?.mediaUrls?.length > 0) {
      const firstImage = post?.meta?.mediaUrls?.find((url: string) =>
        url && (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp'))
      );
      if (firstImage) return firstImage;
      const firstVideo = post?.meta?.mediaUrls?.find((url: string) =>
        url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'))
      );
      if (firstVideo) return firstVideo;
    }
    return null;
  };

  const getVideoUrl = (post: SocialPost) => {
    if (post?.meta?.mediaUrls && post?.meta?.mediaUrls?.length > 0) {
      const firstVideo = post?.meta?.mediaUrls?.find((url: string) =>
        url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('.avi'))
      );
      return firstVideo || null;
    }
    return null;
  };

  const isVideoUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('.avi');
  };

  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const getEngagementStats = (post: SocialPost) => {
    const analytics = post?.platform_analytics || {} as any;
    const platforms = Object.values(analytics || {}) as Array<{
      like_count?: number; total_reactions?: number; video_views?: number;
      shares_count?: number; comments_count?: number; impressions?: number;
    }>;
    const totals = platforms.reduce(
      (acc, p) => {
        const likes = (p.total_reactions ?? 0) || (p.like_count ?? 0);
        acc.likes += likes;
        acc.comments += p.comments_count ?? 0;
        acc.shares += p.shares_count ?? 0;
        acc.views += (p.video_views ?? 0) || (p.impressions ?? 0);
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, views: 0 }
    );
    return totals;
  };

  const getPlatformEmbedUrl = (platform: string, url: string): string | null => {
    if (!url) return null;
    try {
      switch (platform.toLowerCase()) {
        case 'facebook':
          if (url.includes('/watch/?v=') || url.includes('/watch')) {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=500&height=500&autoplay=true&loop=true`;
          }
          if (url.includes('/posts/') || url.includes('/photo')) {
            return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true&height=500`;
          }
          return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500&show_text=true&height=500`;
        case 'instagram':
          if (url.includes('/reel/') || url.includes('/p/')) {
            const postId = url.match(/\/(reel|p)\/([^/?]+)/)?.[2];
            if (postId) {
              const isReel = url.includes('/reel/');
              if (isReel) {
                return `https://www.instagram.com/reel/${postId}/embed/?autoplay=true&loop=1&hidecaption=1`;
              }
              return `https://www.instagram.com/p/${postId}/embed/?hidecaption=1`;
            }
          }
          return null;
        case 'twitter':
        case 'x':
          const tweetId = url.match(/status\/(\d+)/)?.[1];
          if (tweetId) {
            return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
          }
          return null;
        case 'youtube':
          const youtubeId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
          if (youtubeId) {
            return `https://www.youtube.com/embed/${youtubeId}?loop=1&rel=0&playlist=${youtubeId}&autoplay=1`;
          }
          return null;
        case 'tiktok':
          const tiktokId = url.match(/\/video\/(\d+)/)?.[1];
          if (tiktokId) {
            return `https://www.tiktok.com/embed/v2/${tiktokId}?autoplay=1&loop=1`;
          }
          return null;
        default:
          return null;
      }
    } catch (error) {
      console.error('Error converting URL to embed:', error);
      return null;
    }
  };

  const getAvailablePlatformLinks = (post: SocialPost) => {
    if (!post.links || !post.platforms) return [];
    return post.platforms
      .map(platform => {
        const links = post.links?.[platform.toLowerCase()];
        if (!links) return null;
        const embedUrl = getPlatformEmbedUrl(platform, links.video_url || links.image_url || '');
        if (!embedUrl) return null;
        return {
          platform,
          url: links.video_url || links.image_url || '',
          embedUrl
        };
      })
      .filter((item): item is { platform: string; url: string; embedUrl: string } => item !== null);
  };

  const availablePlatformLinks = useMemo(() => {
    if (!post) return [];
    return getAvailablePlatformLinks(post);
  }, [post]);

  const filteredRelatedPosts = useMemo(() => {
    if (!post || !currentId) return relatedPosts;
    return relatedPosts.filter(relatedPost => relatedPost.id.toString() !== currentId.toString());
  }, [relatedPosts, post, currentId]);

  useEffect(() => {
    if (post && availablePlatformLinks.length > 0 && !selectedPlatformView) {
      setSelectedPlatformView(availablePlatformLinks[0].platform);
    }
  }, [post, availablePlatformLinks, selectedPlatformView]);

  useEffect(() => {
    if (selectedPlatformView?.toLowerCase() === 'tiktok') {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin === 'https://www.tiktok.com' ||
          event.origin === 'https://tiktok.com' ||
          event.origin.includes('tiktok.com')) {
          if (event.data) {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data?.type === 'videoEnd' || data?.event === 'videoEnd') {
              setTiktokIframeKey(prev => prev + 1);
            }
          }
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [selectedPlatformView]);

  if (loading) {
    return (
      <div className="single-page">
        <main className="single-main">
          <div className="single-grid">
            <div className="single-content-area with-sidebar">
              <div className="skeleton-back-btn" />
              <div className="skeleton-player">
                <div className="skeleton-video">
                  <div className="skeleton-video-inner">
                    <Loader2 className="single-spinner-large" />
                  </div>
                </div>
                <div className="skeleton-platform-bar">
                  <div className="skeleton-platform-content">
                    <div className="skeleton-platform-label" />
                    <div className="skeleton-platform-btn" />
                    <div className="skeleton-platform-btn" />
                    <div className="skeleton-platform-btn" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="sidebar">
                <div className="skeleton-sidebar-title" />
                <div className="skeleton-related-list">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-related-item">
                      <div className="skeleton-related-thumb" />
                      <div className="skeleton-related-info">
                        <div className="skeleton-related-title" />
                        <div className="skeleton-related-title-short" />
                        <div className="skeleton-related-author" />
                        <div className="skeleton-related-stats">
                          <div className="skeleton-related-stat" />
                          <div className="skeleton-related-stat" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="single-page-centered">
        <div className="not-found-container">
          <p className="not-found-text">Post not found</p>
          {onBackClick && (
            <button
              onClick={handleBackClick}
              className="not-found-button"
            >
              Back to Gallery
            </button>
          )}
        </div>
      </div>
    );
  }

  const thumbnail = getPostThumbnail(post);
  const videoUrl = getVideoUrl(post);
  const title = stripHtmlTags(post?.post?.title || '');

  return (
    <div className="single-page">
      <main className="single-main">
        <div className="single-grid">
          <div className="single-content-area with-sidebar">
            {onBackClick && (
              <button
                onClick={handleBackClick}
                className="back-button"
              >
                <ArrowLeft className="back-button-icon" />
                Back to Gallery
              </button>
            )}
            <div className="media-player-container">
              {selectedPlatformView ? (
                (() => {
                  const platformLink = availablePlatformLinks.find(p => p.platform === selectedPlatformView);
                  if (platformLink && platformLink.embedUrl) {
                    const isInstagram = platformLink.platform.toLowerCase() === 'instagram';
                    const isTiktok = platformLink.platform.toLowerCase() === 'tiktok';
                    const isNarrow = selectedPlatformView === "twitter" || selectedPlatformView === "instagram";

                    let embedUrl = platformLink.embedUrl;
                    if (isTiktok) {
                      if (!embedUrl.includes('loop=1')) {
                        embedUrl = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}loop=1`;
                      }
                      embedUrl = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}_t=${tiktokIframeKey}`;
                    }

                    return (
                      <div className={`embed-container ${isNarrow ? 'narrow' : ''} ${isInstagram ? 'instagram-bg' : ''}`}>
                        <iframe
                          key={isTiktok ? `tiktok-${tiktokIframeKey}` : undefined}
                          ref={isTiktok ? tiktokIframeRef : undefined}
                          src={embedUrl}
                          className={`embed-iframe ${isInstagram ? 'instagram-iframe' : ''}`}
                          allow="encrypted-media; picture-in-picture; autoplay; clipboard-write"
                          allowFullScreen
                          loading="lazy"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        />
                      </div>
                    );
                  }
                  return null;
                })()
              ) : (
                (thumbnail || videoUrl) && (
                  <div className="native-media-container">
                    {videoUrl ? (
                      <>
                        {imageLoadingStates[`${post.id}-video`] && (
                          <div className="loading-gradient" />
                        )}
                        <video
                          src={videoUrl}
                          controls
                          className={`native-video ${imageLoadingStates[`${post.id}-video`] ? 'media-hidden' : 'media-visible'}`}
                          poster={thumbnail && !isVideoUrl(thumbnail) ? thumbnail : undefined}
                          onLoadedData={() => {
                            setImageLoadingStates(prev => ({ ...prev, [`${post.id}-video`]: false }));
                          }}
                          onLoadStart={() => {
                            setImageLoadingStates(prev => ({ ...prev, [`${post.id}-video`]: true }));
                          }}
                        />
                      </>
                    ) : (
                      <>
                        {imageLoadingStates[`${post.id}-img`] && (
                          <div className="loading-gradient" />
                        )}
                        <img
                          src={thumbnail!}
                          alt={title}
                          className={`native-image ${imageLoadingStates[`${post.id}-img`] ? 'media-hidden' : 'media-visible'}`}
                          onLoad={() => {
                            setImageLoadingStates(prev => ({ ...prev, [`${post.id}-img`]: false }));
                          }}
                          onLoadStart={() => {
                            setImageLoadingStates(prev => ({ ...prev, [`${post.id}-img`]: true }));
                          }}
                        />
                      </>
                    )}
                  </div>
                )
              )}

              {availablePlatformLinks.length > 0 && (
                <div className="platform-switcher">
                  <div className="platform-switcher-content">
                    <span className="platform-switcher-label">View on :</span>
                    {availablePlatformLinks.map(({ platform, embedUrl }) => {
                      const Icon = platformIcons[platform.toLowerCase() as keyof typeof platformIcons];
                      return (
                        <button
                          key={platform}
                          onClick={() => setSelectedPlatformView(platform)}
                          className={`platform-btn ${selectedPlatformView === platform ? 'active' : ''}`}
                        >
                          {Icon && <Icon className="platform-btn-icon" />}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="sidebar">
              <h2 className="sidebar-title">Other Posts You Might Like</h2>
              {relatedLoading ? (
                <div className="single-loading-spinner">
                  <Loader2 className="single-spinner-icon" />
                </div>
              ) : filteredRelatedPosts.length === 0 ? (
                <p className="no-related-text">No related posts found</p>
              ) : (
                <div ref={relatedScrollContainerRef} className="related-posts-container">
                  <div className="related-posts-list">
                    {filteredRelatedPosts.map((relatedPost) => {
                      const relatedThumbnail = getPostThumbnail(relatedPost);
                      const relatedVideoUrl = getVideoUrl(relatedPost);
                      const relatedTitle = stripHtmlTags(relatedPost?.post?.title || relatedPost?.post?.content || '');
                      const relatedEngagement = getEngagementStats(relatedPost);
                      const hasRelatedVideo = !!relatedVideoUrl;

                      return (
                        <div
                          key={relatedPost.id}
                          className="related-post-item"
                          onClick={() => handlePostClick(relatedPost)}
                        >
                          <div className="related-post-card">
                            <div className="related-post-thumbnail">
                              {relatedThumbnail || relatedVideoUrl ? (
                                <>
                                  {hasRelatedVideo ? (
                                    <>
                                      {relatedThumbnail && !isVideoUrl(relatedThumbnail) ? (
                                        <img
                                          src={relatedThumbnail}
                                          alt={relatedTitle}
                                          className="related-post-image"
                                        />
                                      ) : (
                                        <video
                                          src={relatedVideoUrl!}
                                          className="related-post-video"
                                          muted
                                          preload="metadata"
                                        />
                                      )}
                                      <div className="related-video-overlay">
                                        <div className="related-play-button">
                                          <Video className="related-play-icon" />
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <img
                                      src={relatedThumbnail!}
                                      alt={relatedTitle}
                                      className="related-post-image"
                                    />
                                  )}
                                </>
                              ) : (
                                <div className="related-no-media">
                                  <ImageIcon className="related-no-media-icon" />
                                </div>
                              )}
                            </div>

                            <div className="related-post-info">
                              <h3 className="related-post-title">
                                {relatedTitle}
                              </h3>
                              <div className="related-post-author">
                                {relatedPost.author && (
                                  <span>@{relatedPost.author.username}</span>
                                )}
                              </div>
                              <div className="related-post-stats">
                                <span className="related-stat-item">
                                  <Heart className="related-stat-icon" />
                                  {relatedEngagement.likes}
                                </span>
                                <span className="related-stat-item">
                                  <MessageCircle className="related-stat-icon" />
                                  {relatedEngagement.comments}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {relatedLoadingMore && (
                    <div className="single-loading-spinner">
                      <Loader2 className="single-spinner-icon" />
                    </div>
                  )}
                  <div ref={relatedLoadMoreRef} className="related-load-sentinel" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SingleSocialMedia;
