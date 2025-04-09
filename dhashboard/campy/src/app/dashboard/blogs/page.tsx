'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Blog {
  id: number;
  title: string;
  content: string;
  image?: string;
  likes: number;
  createdAt: string;
  user: {
    first_name: string;
    last_name: string;
  };
  comments: {
    id: number;
    content: string;
    createdAt: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }[];
  disabled: boolean;
}

export default function BlogManagement() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showDisableCommentModal, setShowDisableCommentModal] = useState(false);
  const [commentToAction, setCommentToAction] = useState<number | null>(null);
  const [commentAction, setCommentAction] = useState<'disable' | 'enable'>('disable');
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'disabled'>('all');
  const [disabledBlogs, setDisabledBlogs] = useState<Blog[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      // Parse the token to get user info
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.id) {
          setUserId(payload.id);
        }
      }

      // Use environment variable for API URL
      const apiUrl = `${API_URL}blogs`;
      console.log(`Fetching blogs from: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      
      // Filter out blogs with invalid user data and sort them
      const validBlogs = data.data
        .filter((blog: Blog) => blog && blog.user)
        .sort((a: Blog, b: Blog) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      
      setBlogs(validBlogs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load blogs');
      setLoading(false);
    }
  };

  const fetchDisabledBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      // Parse the token to get user ID
      let userId = null;
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', payload);
          userId = payload.id;
          
          // Hardcode admin users by ID (temporary solution)
          const adminUserIds = [1]; // Add your admin user IDs here
          setIsAdmin(adminUserIds.includes(userId));
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }

      // Always try the admin endpoint first with environment variable
      let apiUrl = `${API_URL}blogs/all-disabled`;
      console.log('First trying admin endpoint:', apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Admin endpoint response status:', response.status);
        
        if (response.ok) {
          // Admin access succeeded
          const data = await response.json();
          console.log('Admin endpoint success, found', data.data.length, 'disabled blogs');
          setDisabledBlogs(data.data);
          setIsAdmin(true);
        } else {
          // If access denied or other error, fall back to regular user endpoint
          console.log('Admin access failed, falling back to user endpoint');
          apiUrl = `${API_URL}blogs/disabled`;
          
          const userResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('User endpoint success, found', userData.data.length, 'disabled blogs');
            setDisabledBlogs(userData.data);
          } else {
            throw new Error('Failed to fetch disabled blogs');
          }
        }
      } catch (error) {
        console.error('Error fetching disabled blogs:', error);
        setError(error instanceof Error ? error.message : 'Failed to load disabled blogs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisableClick = (blogId: number) => {
    setBlogToDelete(blogId);
    setShowDeleteModal(true);
  };

  const handleBlogAction = async () => {
    if (!blogToDelete) return;

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs/${blogToDelete}/disable`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to disable blog');
      await fetchBlogs();
      setShowDeleteModal(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error('Error disabling blog:', error);
      setError(error instanceof Error ? error.message : 'Failed to disable blog');
    }
  };

  const handleBlogClick = async (blogId: number) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs/${blogId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blog details');
      const data = await response.json();
      setSelectedBlog(data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching blog details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load blog details');
    }
  };

  const handleCommentAction = async () => {
    if (!commentToAction || !selectedBlog) return;

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      console.log(`${commentAction === 'disable' ? 'Disabling' : 'Enabling'} comment:`, commentToAction);

      // Use the appropriate endpoint based on the action
      const endpoint = commentAction === 'disable' ? 'disable' : 'enable';
      const response = await fetch(`${API_URL}blogs/${selectedBlog.id}/comments/${commentToAction}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to ${commentAction} comment`);
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      // Refresh the blog details after successful action
      const updatedBlogResponse = await fetch(`${API_URL}blogs/${selectedBlog.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!updatedBlogResponse.ok) {
        throw new Error('Failed to refresh blog details');
      }

      const updatedBlogData = await updatedBlogResponse.json();
      setSelectedBlog(updatedBlogData.data);
      setShowDisableCommentModal(false);
      setCommentToAction(null);

    } catch (error) {
      console.error(`Error ${commentAction}ing comment:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${commentAction} comment`);
      setShowDisableCommentModal(false);
      setCommentToAction(null);
    }
  };

  const handleCommentActionClick = (commentId: number, action: 'disable' | 'enable') => {
    setCommentToAction(commentId);
    setCommentAction(action);
    setShowDisableCommentModal(true);
  };

  // Function to specifically refresh disabled blogs when needed
  const refreshDisabledBlogs = async () => {
    if (filterMode === 'disabled') {
      await fetchDisabledBlogs();
    }
  };

  // Update this function to handle enabling blog from the disabled blogs list
  const handleEnableBlog = async (blogId: number) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}blogs/${blogId}/enable`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to enable blog');
      }
      
      // Refresh both regular and disabled blogs
      await Promise.all([fetchBlogs(), fetchDisabledBlogs()]);
      
      // Show success message
      setError(null); // Clear any existing errors
      alert('Blog enabled successfully');
      
      setShowDeleteModal(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error('Error enabling blog:', error);
      setError(error instanceof Error ? error.message : 'Failed to enable blog');
    }
  };

  // Function to get filtered blogs based on current filter mode
  const getFilteredBlogs = () => {
    console.log('Getting filtered blogs. Current mode:', filterMode);
    console.log('Regular blogs count:', blogs.length);
    console.log('Disabled blogs count:', disabledBlogs.length);
    
    switch (filterMode) {
      case 'my':
        return blogs.filter(blog => blog.user && userId && blog.user.id === userId);
      case 'disabled':
        return disabledBlogs;
      case 'all':
      default:
        return blogs;
    }
  };

  // Make sure to call fetchDisabledBlogs when filter changes
  useEffect(() => {
    if (filterMode === 'disabled') {
      fetchDisabledBlogs();
    }
  }, [filterMode]);

  // Initial data loading
  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchBlogs();
    fetchDisabledBlogs(); // Fetch disabled blogs immediately
  }, []);

  // Add useEffect to handle body scroll
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal]);

  // Add this to ensure admin status is checked before fetching blogs
  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) return;
      
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Checking admin status from token:', payload);
          if (payload.role === 'admin') {
            setIsAdmin(true);
            console.log('User confirmed as admin, fetching all disabled blogs');
            await fetchDisabledBlogs();
          }
        }
      } catch (e) {
        console.error('Error checking admin status:', e);
      }
    };
    
    checkAdminAndFetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A192F' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A192F' }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[#64FFDA] mb-6">Blog Management</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex mb-6 gap-4">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterMode === 'all'
                  ? 'bg-[#64FFDA] text-[#0A192F] font-semibold'
                  : 'bg-[#112240] text-[#64FFDA] border border-[#64FFDA]'
              }`}
            >
              All Story
            </button>
            <button
              onClick={() => setFilterMode('my')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterMode === 'my'
                  ? 'bg-[#64FFDA] text-[#0A192F] font-semibold'
                  : 'bg-[#112240] text-[#64FFDA] border border-[#64FFDA]'
              }`}
            >
              My Story
            </button>
            <button
              onClick={() => setFilterMode('disabled')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterMode === 'disabled'
                  ? 'bg-[#64FFDA] text-[#0A192F] font-semibold'
                  : 'bg-[#112240] text-[#64FFDA] border border-[#64FFDA]'
              }`}
            >
              Disabled Story
            </button>
          </div>

          <div className="grid gap-6">
            {getFilteredBlogs().length > 0 ? (
              getFilteredBlogs().map((blog) => (
                <div 
                  key={blog.id} 
                  className={`bg-[#112240] rounded-lg p-6 shadow-lg hover:bg-[#1D2D50] transition-colors cursor-pointer relative ${blog.disabled ? 'opacity-70' : ''}`}
                  onClick={() => handleBlogClick(blog.id)}
                >
                  {blog.disabled && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Disabled
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl text-[#CCD6F6] font-semibold mb-2">
                        {blog.title}
                      </h2>
                      <p className="text-[#8892B0] text-sm">
                        By {blog.user?.first_name || 'Unknown'} {blog.user?.last_name || ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // If it's already disabled or in the disabled view, we want to enable it
                        if (blog.disabled || filterMode === 'disabled') {
                          setBlogToDelete(blog.id);
                          setShowDeleteModal(true);
                        } else {
                          // Otherwise, disable it
                          handleDisableClick(blog.id);
                        }
                      }}
                      className={`px-4 py-2 ${blog.disabled || filterMode === 'disabled' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg transition-colors`}
                    >
                      {blog.disabled || filterMode === 'disabled' ? 'Enable' : 'Disable'}
                    </button>
                  </div>

                  {blog.image && (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <p className="text-[#CCD6F6] mb-4">{blog.content}</p>

                  <div className="flex justify-between items-center text-sm text-[#8892B0]">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span>❤️</span>
                        <span>{blog.likes || 0} likes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>💬</span>
                        <span>{blog.comments?.length || 0} Comments</span>
                      </div>
                    </div>
                    <span>Created: {new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[#8892B0]">
                {filterMode === 'all' 
                  ? 'No blog posts available.' 
                  : filterMode === 'my' 
                    ? 'You haven\'t created any blog posts yet.' 
                    : isAdmin 
                      ? 'There are no disabled blog posts.' 
                      : 'You don\'t have any disabled blog posts.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blog Detail Modal */}
      {showDetailModal && selectedBlog && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div 
              className="bg-[#112240] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-[#1D2D50]">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-[#64FFDA]">{selectedBlog.title}</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-[#8892B0] hover:text-[#64FFDA]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-[#8892B0]">
                  By {selectedBlog.user.first_name} {selectedBlog.user.last_name} • {new Date(selectedBlog.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedBlog.image && (
                  <img
                    src={selectedBlog.image}
                    alt={selectedBlog.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <p className="text-[#CCD6F6] mb-6">{selectedBlog.content}</p>

                <div className="flex items-center mb-6">
                  <span className="text-[#8892B0]">❤️ {selectedBlog.likes} likes</span>
                </div>

                <div className="border-t border-[#1D2D50] pt-4">
                  <h3 className="text-xl font-bold text-[#64FFDA] mb-4">
                    Comments ({selectedBlog.comments.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedBlog.comments.map((comment) => (
                      <div key={comment.id} className="bg-[#1D2D50] rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[#CCD6F6] font-semibold">
                              {comment.user.first_name} {comment.user.last_name}
                            </div>
                            <div className="text-[#8892B0] text-sm">
                              {new Date(comment.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              handleCommentActionClick(comment.id, comment.disabled ? 'enable' : 'disable');
                            }}
                            className={`px-3 py-1 ${comment.disabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white text-sm rounded transition-colors`}
                          >
                            {comment.disabled ? 'Enable' : 'Disable'}
                          </button>
                        </div>
                        <p className="text-[#CCD6F6] mt-2">{comment.content}</p>
                        {comment.disabled && (
                          <div className="mt-2 bg-[#293B57] px-2 py-1 rounded text-xs inline-block text-[#8892B0]">
                            This comment is disabled
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable Comment Modal */}
      {showDisableCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#112240] p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              Confirm {commentAction === 'disable' ? 'Disable' : 'Enable'} Comment
            </h3>
            <p className="text-[#CCD6F6] mb-6">
              {commentAction === 'disable' 
                ? 'Are you sure you want to disable this comment? It will no longer be visible to users.'
                : 'Are you sure you want to enable this comment? It will be visible to users again.'}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDisableCommentModal(false);
                  setCommentToAction(null);
                }}
                className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentAction}
                className={`px-4 py-2 ${commentAction === 'disable' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors`}
              >
                {commentAction === 'disable' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Enable Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#112240] p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              Confirm {filterMode === 'disabled' ? 'Enable' : (blogToDelete && blogs.find(b => b.id === blogToDelete)?.disabled ? 'Enable' : 'Disable')}
            </h3>
            <p className="text-[#CCD6F6] mb-6">
              {filterMode === 'disabled' 
                ? 'Are you sure you want to enable this blog? It will appear in the main feed again.'
                : blogToDelete && blogs.find(b => b.id === blogToDelete)?.disabled 
                  ? 'Are you sure you want to enable this blog? It will appear in the main feed again.' 
                  : 'Are you sure you want to disable this blog? It will no longer appear in the main feed.'}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBlogToDelete(null);
                }}
                className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg hover:bg-opacity-80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (filterMode === 'disabled') {
                    handleEnableBlog(blogToDelete!);
                  } else {
                    handleBlogAction();
                  }
                }}
                className={`px-4 py-2 ${filterMode === 'disabled' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg transition-colors`}
              >
                {filterMode === 'disabled' 
                  ? 'Enable' 
                  : (blogToDelete && blogs.find(b => b.id === blogToDelete)?.disabled ? 'Enable' : 'Disable')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 