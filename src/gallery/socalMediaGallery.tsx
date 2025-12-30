import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Heart, MessageCircle, Share2, Calendar, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { getPublicSocialPostsApi } from '../service/galleryService';
import { formatISODateToReadable, platformIcons } from '../Utils/CommonFun';
import GalleryPlacholder from '../components/ui/galleryPlacholder';

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

export interface SocialMediaProps {
  // Initial posts (optional - will fetch if not provided)
  initialPosts?: SocialPost[];
  // Base URL for API calls (optional)
  baseUrl?: string;
  // User ID for API calls
  uid?: number | string;
  // Domain/API base URL
  domain?: string;
  // Callback when a post is clicked
  onPostClick?: (post: SocialPost) => void;
}

const SocialMedia: React.FC<SocialMediaProps> = ({ 
  initialPosts, 
  baseUrl,
  uid,
  domain,
  onPostClick 
}) => {

  console.log(uid, domain);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts || initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(initialPosts ? 1 : 0);
  const [totalItems, setTotalItems] = useState(initialPosts?.length || 0);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});

  const dateOptions = [
    'all', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days',
    'This Month', 'Last Month', 'Last 3 Months', 'Last Year'
  ];

  useEffect(() => {
    // Only fetch if no initial posts provided
    if (!initialPosts || initialPosts.length === 0) {
      fetchPosts(true);
    }
  }, [searchTerm, selectedPlatform, dateFilter]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && posts.length < totalItems) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingMore, loading, posts.length, totalItems]);

  const fetchPosts = async (reset: boolean = false) => {
    if (reset) {
      setPosts([]);
      setCurrentPage(0);
      setLoading(true);
    } else {
      if (loadingMore || loading) return;
      setLoadingMore(true);
    }

    try {
      const pageToLoad = reset ? 0 : currentPage;
      const startOffset = pageToLoad * 20;

      const response = await getPublicSocialPostsApi({
        start: startOffset,
        length: 20,
        keyword: searchTerm,
        platform: selectedPlatform !== 'all' ? selectedPlatform : '',
        date_filter: dateFilter,
        uid: uid,
        domain: domain,
      });

      if (response.status === 'success') {
        const newPosts = response.data || [];

        if (reset) {
          setPosts(newPosts);
          setCurrentPage(1);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
          setCurrentPage(prev => prev + 1);
        }

        setTotalItems(response.recordsTotal || response.recordsFiltered || 0);
      } else {
        console.error('Failed to load gallery posts:', response.message);
      }
    } catch (error) {
      console.error('Failed to load gallery posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && !loading && posts.length < totalItems) {
      fetchPosts(false);
    }
  };

  const handlePostClick = (post: SocialPost) => {
    if (onPostClick) {
      onPostClick(post);
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

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const title = stripHtmlTags(post?.post?.title || post?.post?.content || '');
      const matchesSearch = !searchTerm || title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = selectedPlatform === 'all' || post.platforms?.includes(selectedPlatform);
      return matchesSearch && matchesPlatform;
    });
  }, [posts, searchTerm, selectedPlatform]);

  return (
    <div className="gallery-page">
      <main className="gallery-main">
        <div className="gallery-filters">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="twitter">X (Twitter)</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option === 'all' ? 'All Time' : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && posts.length === 0 ? (
          <GalleryPlacholder />
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <ImageIcon className="empty-icon" />
            <p className="empty-text">No posts found</p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {filteredPosts.map((post, index) => {
                const thumbnail = getPostThumbnail(post);
                const videoUrl = getVideoUrl(post);
                const engagement = getEngagementStats(post);
                const hasVideo = !!videoUrl;
                const title = stripHtmlTags(post?.post?.title || post?.post?.content || '');

                return (
                  <div
                    key={post.id}
                    className="gallery-card-wrapper"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="gallery-card">
                      {thumbnail || videoUrl ? (
                        <div className="media-container">
                          {hasVideo ? (
                            <>
                              {thumbnail && !isVideoUrl(thumbnail) ? (
                                <div className="media-container">
                                  {imageLoadingStates[`${post.id}-thumb`] && (
                                    <div className="skeleton" />
                                  )}
                                  <img
                                    src={thumbnail}
                                    alt={title}
                                    className={`gallery-media ${imageLoadingStates[`${post.id}-thumb`] ? 'media-loading' : 'media-loaded'}`}
                                    loading="lazy"
                                    onLoad={() => {
                                      setImageLoadingStates(prev => ({ ...prev, [`${post.id}-thumb`]: false }));
                                    }}
                                    onLoadStart={() => {
                                      setImageLoadingStates(prev => ({ ...prev, [`${post.id}-thumb`]: true }));
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="media-container">
                                  {imageLoadingStates[`${post.id}-video`] && (
                                    <div className="skeleton" />
                                  )}
                                  <video
                                    src={videoUrl!}
                                    className={`gallery-media ${imageLoadingStates[`${post.id}-video`] ? 'media-loading' : 'media-loaded'}`}
                                    preload="metadata"
                                    muted
                                    onLoadedData={() => {
                                      setImageLoadingStates(prev => ({ ...prev, [`${post.id}-video`]: false }));
                                    }}
                                    onLoadStart={() => {
                                      setImageLoadingStates(prev => ({ ...prev, [`${post.id}-video`]: true }));
                                    }}
                                  />
                                </div>
                              )}
                              <div className="video-overlay">
                                <div className="play-button">
                                  <Video className="play-icon" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="media-container">
                              {imageLoadingStates[`${post.id}-img`] && (
                                <div className="skeleton skeleton-small" />
                              )}
                              <img
                                src={thumbnail!}
                                alt={title}
                                className={`gallery-media ${imageLoadingStates[`${post.id}-img`] ? 'media-loading' : 'media-loaded'}`}
                                loading="lazy"
                                onLoad={() => {
                                  setImageLoadingStates(prev => ({ ...prev, [`${post.id}-img`]: false }));
                                }}
                                onLoadStart={() => {
                                  setImageLoadingStates(prev => ({ ...prev, [`${post.id}-img`]: true }));
                                }}
                              />
                            </div>
                          )}

                          <div className="hover-overlay">
                            <div className="hover-content">
                              <p className="hover-title">{title}</p>
                              <div className="hover-stats">
                                <span className="stat-item">
                                  <Heart className="stat-icon" />
                                  {engagement.likes}
                                </span>
                                <span className="stat-item">
                                  <MessageCircle className="stat-icon" />
                                  {engagement.comments}
                                </span>
                                <span className="stat-item">
                                  <Share2 className="stat-icon" />
                                  {engagement.shares}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="platform-badges">
                            {post.platforms?.map((platform) => {
                              const Icon = platformIcons[platform.toLowerCase() as keyof typeof platformIcons];
                              if (!Icon) return null;
                              return (
                                <div
                                  key={platform}
                                  className="platform-badge"
                                >
                                  <Icon className="platform-icon" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="no-media-fallback">
                          <div className="fallback-content">
                            <ImageIcon className="fallback-icon" />
                            <p className="fallback-text">{title}</p>
                          </div>
                        </div>
                      )}

                      {/* Bottom info bar */}
                      <div className="card-footer">
                        <div className="card-footer-content">
                          <div className="card-date">
                            <Calendar className="card-date-icon" />
                            {formatISODateToReadable(post?.post?.date)}
                          </div>
                          {post.author && (
                            <span className="card-author">@{post.author.username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {loadingMore && (
              <div className="loading-more">
                <Loader2 className="loading-spinner" />
              </div>
            )}

            <div ref={loadMoreRef} className="load-more-sentinel" />

            <div className="posts-count">
              Showing {filteredPosts.length} of {totalItems} posts
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SocialMedia;
