import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EXPO_PUBLIC_API_URL } from '../config';
import React, { memo } from "react";
import { FlashList } from "@shopify/flash-list";
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/auth.service';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    userId?: number;
    disabled?: boolean;
    user?: {
        id?: number;
        first_name: string;
        last_name: string;
        profile_image: string;
    };
}

interface Blog {
    id: number;
    title: string;
    content: string;
    image?: string;
    createdAt: string;
    likes: number;
    liked: boolean;
    user: {
        first_name: string;
        last_name: string;
        profile_image: string;
    };
    comments: Comment[];
}

const DEFAULT_PROFILE_IMAGE = 'https://johannesippen.com/img/blog/humans-not-users/header.jpg';

const getLikeKey = (blogId: number, userId: number) => `blog_${blogId}_liked_by_${userId}`;

const CommentItem = memo(({ comment, onMorePress }: { 
    comment: Comment, 
    onMorePress: (id: number, content: string) => void 
}) => {
    const { user: currentUser } = useAuth();
    
    console.log('Comment data:', comment);
    console.log('Current user ID:', currentUser?.id);
    
    const isCommentOwner = currentUser && 
        (Number(currentUser.id) === Number(comment.userId || comment.user?.id));
    
    console.log('Is comment owner:', isCommentOwner);
    
    return (
        <View style={styles.commentCard}>
            <View style={styles.commentHeaderRow}>
                <View style={styles.commentAuthorContainer}>
                    <Image 
                        source={{ uri: comment.user?.profile_image || DEFAULT_PROFILE_IMAGE }} 
                        style={styles.commentAuthorImage}
                    />
                    <Text style={styles.commentAuthor}>
                        {comment.user?.first_name || 'Anonymous'} {comment.user?.last_name || ''}
                    </Text>
                </View>
                {isCommentOwner && (
                    <TouchableOpacity onPress={() => onMorePress(comment.id, comment.content)}>
                        <Icon name="more-vert" size={20} color="#64FFDA" />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.commentContent}>{comment.content}</Text>
            <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
        </View>
    );
});

const decodeJWT = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Manual JWT decode error:', error);
        return null;
    }
};

export default function StoryDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [editCommentText, setEditCommentText] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const { isAuthenticated, isLoading, user, checkAuth } = useAuth();
    const [localLiked, setLocalLiked] = useState(false);
    const [isBlogMenuVisible, setBlogMenuVisible] = useState(false);
    const [editBlogTitle, setEditBlogTitle] = useState('');
    const [editBlogContent, setEditBlogContent] = useState('');
    const [isEditBlogModalVisible, setEditBlogModalVisible] = useState(false);
    const [isCommentDropdownVisible, setIsCommentDropdownVisible] = useState(false);

    const checkLocalLikeStatus = async (blogId: number, userId: number) => {
        try {
            const key = getLikeKey(blogId, userId);
            const likeStatus = await AsyncStorage.getItem(key);
            console.log(`Checking local like status for ${key}: ${likeStatus}`);
            return likeStatus === 'true';
        } catch (error) {
            console.error('Error checking local like status:', error);
            return false;
        }
    };

    const fetchBlogDetails = async () => {
        try {
            console.log(`[Blog Fetch] Starting for ID: ${id}`);
            
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.log('[Auth Error] No token available');
                router.replace('/auth');
                return;
            }

            const decoded = decodeJWT(token);
            const currentUserId = decoded?.id;
            
            if (!currentUserId) {
                console.error('[Auth Error] Could not get user ID from token');
                router.replace('/auth');
                return;
            }

            console.log(`[API Request] Fetching blog ${id} for user ${currentUserId}`);
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    await AsyncStorage.removeItem('userToken');
                    router.replace('/auth');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`[API Response] Success: ${result.success}, Liked: ${result.data.liked}`);
            
            if (result.success) {
                // IMPORTANT: Use the API's liked status first!
                const apiLiked = result.data.liked;
                
                // Store the API's liked status in AsyncStorage to keep them in sync
                const likeKey = getLikeKey(id, currentUserId);
                await AsyncStorage.setItem(likeKey, apiLiked.toString());
                console.log(`[Like Sync] Updated AsyncStorage with API value: ${apiLiked}`);
                
                // Update both states
                setLocalLiked(apiLiked);
                setBlog(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch blog details');
            }
        } catch (err) {
            console.error('[Blog Error]', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch blog details');
        } finally {
            setLoading(false);
        }
    };

    const addComment = async () => {
        if (!newComment.trim()) {
            Alert.alert('Error', 'Comment cannot be empty');
            return;
        }
        if (!user?.id) {
            Alert.alert('Error', 'Please login to comment');
            return;
        }

        try {
            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}/comments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    content: newComment, 
                    userId: user.id
                }),
            });

            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                setNewComment('');
                fetchBlogDetails();
            } else throw new Error(result.message || 'Failed to add comment');
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add comment');
        }
    };

    const deleteComment = async (commentId: number) => {
        try {
            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                fetchBlogDetails();
                Alert.alert('Success', 'Comment deleted successfully');
            } else throw new Error(result.message || 'Failed to delete comment');
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete comment');
        }
    };

    const updateComment = async (commentId: number) => {
        if (!editCommentText.trim()) {
            Alert.alert('Error', 'Comment cannot be empty');
            return;
        }

        try {
            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/comments/${commentId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editCommentText }),
            });

            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                setIsDropdownVisible(false);
                setEditCommentText('');
                fetchBlogDetails();
                Alert.alert('Success', 'Comment updated successfully');
            } else throw new Error(result.message || 'Failed to update comment');
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update comment');
        }
    };

    const toggleLike = async () => {
        if (!blog || !user?.id) {
            Alert.alert('Error', 'Please login to like blogs');
            return;
        }

        try {
            const currentLiked = blog.liked;
            const newLikeStatus = !currentLiked;
            
            setBlog(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    liked: newLikeStatus,
                    likes: newLikeStatus ? prev.likes + 1 : prev.likes - 1
                };
            });

            const likeKey = getLikeKey(Number(id), user.id);
            await AsyncStorage.setItem(likeKey, newLikeStatus.toString());
            console.log(`Saved like status to AsyncStorage: ${likeKey} = ${newLikeStatus}`);

            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}/like`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({}),
            });

            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }

            if (!response.ok) {
                setBlog(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        liked: currentLiked,
                        likes: currentLiked ? prev.likes + 1 : prev.likes - 1
                    };
                });
                await AsyncStorage.setItem(likeKey, currentLiked.toString());
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Like response:', result);
            
            if (result.success) {
                // Set a flag that likes have been updated
                // This will trigger a refresh when returning to the story list
                await AsyncStorage.setItem('likes_updated', 'true');
                console.log('Set likes_updated flag to true');
            } else {
                setBlog(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        liked: currentLiked,
                        likes: currentLiked ? prev.likes + 1 : prev.likes - 1
                    };
                });
                await AsyncStorage.setItem(likeKey, currentLiked.toString());
                throw new Error(result.message || 'Failed to update like');
            }
        } catch (err: unknown) {
            console.error('Error in toggleLike:', err);
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update like');
        }
    };

    const showDropdown = (commentId: number, currentContent: string) => {
        setSelectedCommentId(commentId);
        setEditCommentText(currentContent);
        setIsCommentDropdownVisible(true);
    };

    const hideDropdown = () => {
        setIsCommentDropdownVisible(false);
    };
    
    const disableComment = async (commentId: number) => {
        try {
            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }

            // Add network connectivity check
            try {
                await fetch(`${EXPO_PUBLIC_API_URL}`, { 
                    method: 'HEAD',
                    timeout: 5000
                });
            } catch (networkErr) {
                console.error('Network connectivity error:', networkErr);
                Alert.alert(
                    'Network Error', 
                    'Unable to connect to the server. Please check your internet connection and try again.'
                );
                return;
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}/comments/${commentId}/disable`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                fetchBlogDetails();
                Alert.alert('Success', 'Comment disabled successfully');
                setIsCommentDropdownVisible(false);
            } else throw new Error(result.message || 'Failed to disable comment');
        } catch (err) {
            console.error('Error disabling comment:', err);
            Alert.alert('Error', 'Unable to disable comment. Please try again later.');
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchBlogDetails().then(() => setRefreshing(false));
    }, [id]);

    useEffect(() => {
        fetchBlogDetails();
    }, [id]);

    const isBlogOwner = () => {
        if (!blog || !user) return false;
        return Number(blog.userId) === Number(user.id);
    };

    const showEditBlogModal = () => {
        if (!blog) return;
        setEditBlogTitle(blog.title);
        setEditBlogContent(blog.content);
        setEditBlogModalVisible(true);
        setBlogMenuVisible(false);
    };

    const updateBlog = async () => {
        if (!editBlogTitle.trim() || !editBlogContent.trim()) {
            Alert.alert('Error', 'Title and content cannot be empty');
            return;
        }
        
        try {
            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }
            
            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editBlogTitle,
                    content: editBlogContent
                }),
            });
            
            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            if (result.success) {
                setEditBlogModalVisible(false);
                fetchBlogDetails();
                Alert.alert('Success', 'Blog updated successfully');
                
                // Set update flag for main screen
                await AsyncStorage.setItem('blogs_updated', 'true');
            } else {
                throw new Error(result.message || 'Failed to update blog');
            }
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update blog');
        }
    };

    const disableBlog = async () => {
        Alert.alert(
            'Confirm Disable',
            'Are you sure you want to disable this blog post? It will no longer be visible to other users.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Disable', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await authService.getToken();
                            if (!token) {
                                router.replace('/auth');
                                return;
                            }
                            
                            // Add network connectivity check
                            try {
                                // First check if we can reach the API at all
                                await fetch(`${EXPO_PUBLIC_API_URL}`, { 
                                    method: 'HEAD',
                                    timeout: 5000 // 5 second timeout
                                });
                            } catch (networkErr) {
                                console.error('Network connectivity error:', networkErr);
                                Alert.alert(
                                    'Network Error', 
                                    'Unable to connect to the server. Please check your internet connection and try again.'
                                );
                                return;
                            }
                            
                            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}/disable`, {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                            });
                            
                            if (response.status === 401) {
                                await checkAuth();
                                router.replace('/auth');
                                return;
                            }
                            
                            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                            
                            const result = await response.json();
                            if (result.success) {
                                Alert.alert('Success', 'Blog disabled successfully');
                                // Set update flag for main screen
                                await AsyncStorage.setItem('blogs_updated', 'true');
                                // Navigate back
                                router.back();
                            } else {
                                throw new Error(result.message || 'Failed to disable blog');
                            }
                        } catch (err) {
                            console.error('Error disabling blog:', err);
                            Alert.alert('Error', 'Unable to disable blog. Please try again later.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <View style={styles.container}><Text style={styles.loadingText}>Loading...</Text></View>;
    }

    if (error || !blog) {
        return <View style={styles.container}><Text style={styles.errorText}>Error: {error || 'Blog not found'}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Icon name="arrow-back" size={24} color="#64FFDA" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blog Details</Text>
                
                {isBlogOwner() && (
                    <TouchableOpacity style={styles.menuButton} onPress={() => setBlogMenuVisible(!isBlogMenuVisible)}>
                        <Icon name="more-vert" size={24} color="#64FFDA" />
                    </TouchableOpacity>
                )}
            </View>
            
            {isBlogMenuVisible && (
                <View style={styles.blogDropdownMenu}>
                    <TouchableOpacity style={styles.dropdownItem} onPress={showEditBlogModal}>
                        <Text style={styles.dropdownText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropdownItem} onPress={disableBlog}>
                        <Text style={styles.dropdownText}>Disable</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            <ScrollView 
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#64FFDA"]}
                        tintColor="#64FFDA"
                    />
                }
            >
                <View style={styles.content}>
                    <Text style={styles.title}>{blog.title}</Text>
                    <View style={styles.authorContainer}>
                        <Image 
                            source={{ uri: blog.user?.profile_image || DEFAULT_PROFILE_IMAGE }} 
                            style={styles.authorImage}
                        />
                        <Text style={styles.authorText}>
                            By: {blog.user?.first_name || 'Anonymous'} {blog.user?.last_name || ''}
                        </Text>
                    </View>
                    {blog.image && (
                        <Image 
                            source={{ uri: blog.image }} 
                            style={styles.blogImage}
                        />
                    )}
                    <Text style={styles.contentText}>{blog.content}</Text>
                    <View style={styles.metaContainer}>
                        <TouchableOpacity style={styles.likeButton} onPress={toggleLike}>
                            <Icon name={blog.liked ? "favorite" : "favorite-border"} size={24} color={blog.liked ? "#FF6B6B" : "#64FFDA"} />
                            <Text style={styles.metaText}> {blog.likes}</Text>
                        </TouchableOpacity>
                        <Text style={styles.dateText}>{new Date(blog.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.commentSection}>
                        <Text style={styles.commentHeader}>Comments</Text>
                        <View style={styles.commentInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add a comment..."
                                placeholderTextColor="#8892B0"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <TouchableOpacity style={styles.submitButton} onPress={addComment}>
                                <Text style={styles.submitButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                        <FlashList
                            data={blog.comments
                                .filter(comment => !comment.disabled)
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                            renderItem={({ item }) => (
                                <CommentItem 
                                    comment={item} 
                                    onMorePress={showDropdown}
                                />
                            )}
                            estimatedItemSize={100}
                            keyExtractor={(item) => item.id.toString()}
                        />
                    </View>
                </View>
            </ScrollView>
            <Modal
                transparent={true}
                visible={isCommentDropdownVisible}
                animationType="fade"
                onRequestClose={hideDropdown}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={hideDropdown}
                >
                    <View style={styles.commentDropdownMenu}>
                        <TouchableOpacity 
                            style={styles.dropdownItem} 
                            onPress={() => {
                                hideDropdown();
                                setTimeout(() => {
                                    setIsDropdownVisible(true);
                                }, 300);
                            }}
                        >
                            <Icon name="edit" size={20} color="#64FFDA" style={styles.dropdownIcon} />
                            <Text style={styles.dropdownText}>Edit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.dropdownItem} 
                            onPress={() => {
                                if (selectedCommentId) {
                                    disableComment(selectedCommentId);
                                }
                            }}
                        >
                            <Icon name="visibility-off" size={20} color="#64FFDA" style={styles.dropdownIcon} />
                            <Text style={styles.dropdownText}>Disable</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
            
            <Modal
                transparent={true}
                visible={isEditBlogModalVisible}
                animationType="slide"
                onRequestClose={() => setEditBlogModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.editBlogModal}>
                        <Text style={styles.modalTitle}>Edit Blog</Text>
                        <TextInput
                            style={styles.editInput}
                            placeholder="Title"
                            placeholderTextColor="#8892B0"
                            value={editBlogTitle}
                            onChangeText={setEditBlogTitle}
                        />
                        <TextInput
                            style={[styles.editInput, styles.contentTextInput]}
                            placeholder="Content"
                            placeholderTextColor="#8892B0"
                            value={editBlogContent}
                            onChangeText={setEditBlogContent}
                            multiline
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditBlogModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={updateBlog}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            <Modal
                transparent={true}
                visible={isDropdownVisible}
                animationType="slide"
                onRequestClose={() => setIsDropdownVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.editCommentModal}>
                        <Text style={styles.modalTitle}>Edit Comment</Text>
                        <TextInput
                            style={[styles.editInput, styles.contentTextInput]}
                            placeholder="Edit your comment..."
                            placeholderTextColor="#8892B0"
                            value={editCommentText}
                            onChangeText={setEditCommentText}
                            multiline
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsDropdownVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={() => {
                                    if (selectedCommentId) {
                                        updateComment(selectedCommentId);
                                    }
                                }}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A192F' },
    scrollView: { flex: 1 },
    content: { padding: 20 },
    title: { color: '#64FFDA', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    authorImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        resizeMode: 'cover'
    },
    authorText: {
        color: '#8892B0',
        fontSize: 16,
        fontStyle: 'italic',
    },
    blogImage: { 
        width: '100%', 
        height: 200, 
        borderRadius: 8, 
        marginBottom: 15,
        resizeMode: 'cover'
    },
    contentText: { color: '#CCD6F6', fontSize: 16, lineHeight: 24, marginBottom: 20 },
    metaContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    likeButton: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    metaText: { color: '#64FFDA', fontSize: 16, marginLeft: 5 },
    dateText: { color: '#8892B0', fontSize: 14 },
    commentSection: { marginTop: 20 },
    commentHeader: { color: '#64FFDA', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    commentInput: { flexDirection: 'row', marginBottom: 20 },
    input: { flex: 1, backgroundColor: '#112240', color: '#CCD6F6', borderRadius: 8, padding: 12, marginRight: 10, fontSize: 16 },
    submitButton: { backgroundColor: '#64FFDA', padding: 12, borderRadius: 8, justifyContent: 'center' },
    submitButtonText: { color: '#0A192F', fontWeight: 'bold' },
    commentCard: { backgroundColor: '#112240', padding: 15, borderRadius: 8, marginBottom: 10 },
    commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    commentAuthorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentAuthorImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
        resizeMode: 'cover'
    },
    commentAuthor: {
        color: '#64FFDA',
        fontSize: 16,
        fontWeight: 'bold',
    },
    commentContent: { color: '#CCD6F6', fontSize: 14, marginBottom: 5 },
    commentDate: { color: '#8892B0', fontSize: 12 },
    loadingText: { color: '#64FFDA', fontSize: 18, textAlign: 'center', marginTop: 20 },
    errorText: { color: '#FF6B6B', fontSize: 16, textAlign: 'center', marginTop: 20 },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    commentDropdownMenu: {
        position: 'absolute',
        top: '30%',
        alignSelf: 'center',
        backgroundColor: '#112240',
        borderRadius: 8,
        padding: 10,
        width: 200,
        elevation: 5,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    dropdownIcon: {
        marginRight: 10,
    },
    dropdownText: {
        color: '#64FFDA',
        fontSize: 16,
    },
    editInput: { backgroundColor: '#0A192F', color: '#CCD6F6', borderRadius: 8, padding: 10, marginVertical: 10, fontSize: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#0A192F',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#64FFDA',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    menuButton: {
        padding: 8,
    },
    blogDropdownMenu: {
        position: 'absolute',
        top: 60,
        right: 10,
        backgroundColor: '#112240',
        borderRadius: 8,
        padding: 10,
        zIndex: 2,
        elevation: 5,
        width: 120,
    },
    contentTextInput: {
        height: 200,
        textAlignVertical: 'top',
    },
    editBlogModal: {
        width: '90%',
        backgroundColor: '#112240',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        color: '#64FFDA',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        padding: 12,
        borderRadius: 8,
        flex: 0.48,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#293B57',
    },
    saveButton: {
        backgroundColor: '#64FFDA',
    },
    cancelButtonText: {
        color: '#CCD6F6',
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#0A192F',
        fontWeight: 'bold',
    },
    editCommentModal: {
        width: '90%',
        backgroundColor: '#112240',
        borderRadius: 10,
        padding: 20,
    },
});