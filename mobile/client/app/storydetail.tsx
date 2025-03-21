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
    user: {
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

const CommentItem = memo(({ comment, onMorePress }: { 
    comment: Comment, 
    onMorePress: (id: number, content: string) => void 
}) => (
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
            <TouchableOpacity onPress={() => onMorePress(comment.id, comment.content)}>
                <Icon name="more-vert" size={20} color="#64FFDA" />
            </TouchableOpacity>
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
        <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
    </View>
));

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

    const fetchBlogDetails = async () => {
        try {
            const token = await authService.getToken();
            if (!token) {
                router.replace('/auth');
                return;
            }

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                await checkAuth();
                router.replace('/auth');
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) setBlog(result.data);
            else throw new Error(result.message || 'Failed to fetch blog details');
            setLoading(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch blog details');
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

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/comments/${id}`, {
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

            const response = await fetch(`${EXPO_PUBLIC_API_URL}blogs/comments/${commentId}`, {
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
                body: JSON.stringify({ 
                    userId: user.id, 
                    liked: !blog.liked 
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
                setBlog(prev => prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : null);
            }
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update like');
        }
    };

    const showDropdown = (commentId: number, currentContent: string) => {
        setSelectedCommentId(commentId);
        setEditCommentText(currentContent);
        setIsDropdownVisible(true);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchBlogDetails();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        const initializeData = async () => {
            if (isLoading) return;
            
            if (!isAuthenticated) {
                console.log('User not authenticated, redirecting to auth');
                router.replace('/auth');
                return;
            }

            fetchBlogDetails();
        };

        initializeData();
    }, [isAuthenticated, isLoading, id]);

    if (loading) {
        return <View style={styles.container}><Text style={styles.loadingText}>Loading...</Text></View>;
    }

    if (error || !blog) {
        return <View style={styles.container}><Text style={styles.errorText}>Error: {error || 'Blog not found'}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color="#64FFDA" />
                </TouchableOpacity>
            </View>
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
                            data={blog.comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
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
            <Modal transparent={true} visible={isDropdownVisible} animationType="fade" onRequestClose={() => setIsDropdownVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsDropdownVisible(false)}>
                    <View style={styles.dropdownMenu}>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => selectedCommentId && updateComment(selectedCommentId)}>
                            <Text style={styles.dropdownText}>Edit</Text>
                        </TouchableOpacity>
                        <TextInput style={styles.editInput} value={editCommentText} onChangeText={setEditCommentText} multiline />
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { if (selectedCommentId) { deleteComment(selectedCommentId); setIsDropdownVisible(false); } }}>
                            <Text style={styles.dropdownText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    dropdownMenu: { backgroundColor: '#112240', borderRadius: 8, padding: 10, width: '80%' },
    dropdownItem: { paddingVertical: 10 },
    dropdownText: { color: '#64FFDA', fontSize: 16 },
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
});