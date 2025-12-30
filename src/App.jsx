import './App.css'
import { useState } from 'react'
import SocialMedia from './gallery/socalMediaGallery'
import SingleSocialMedia from './gallery/SingleSocialMedia'

function App() {
  const [currentView, setCurrentView] = useState('gallery')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)

  const handlePostClick = (post) => {
    setSelectedPost(post)
    setSelectedPostId(post.id)
    setCurrentView('single')
  }

  const handleBackClick = () => {
    setCurrentView('gallery')
    setSelectedPostId(null)
    setSelectedPost(null)
  }

  return (
    <div>
      {currentView === 'gallery' ? (
        <SocialMedia onPostClick={handlePostClick} />
      ) : (
        <SingleSocialMedia
          postId={selectedPostId}
          post={selectedPost}
          onPostClick={handlePostClick}
          onBackClick={handleBackClick}
        />
      )}
    </div>
  )
}

export default App
