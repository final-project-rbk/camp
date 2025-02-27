import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config';
import React from "react";

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        first_name: string;
        last_name: string;
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
        last_name?: string;
    };
    comments: Comment[];
}

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

    const fetchBlogDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}blogs/${id}`);
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
        try {
            const response = await fetch(`${API_BASE_URL}blogs/comments/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: newComment, 
                    userId: 3
                }),
            });
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
            const response = await fetch(`${API_BASE_URL}blogs/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) fetchBlogDetails();
            else throw new Error(result.message || 'Failed to delete comment');
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
            const response = await fetch(`${API_BASE_URL}blogs/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editCommentText }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                setIsDropdownVisible(false);
                setEditCommentText('');
                fetchBlogDetails();
            } else throw new Error(result.message || 'Failed to update comment');
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update comment');
        }
    };

    const toggleLike = async () => {
        if (!blog) return;
        try {
            const response = await fetch(`${API_BASE_URL}blogs/${id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 3, liked: !blog.liked }),
            });
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
        fetchBlogDetails();
    }, [id]);

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
                    <Text style={styles.authorText}>
                        By: {blog.user?.first_name || 'Anonymous'} {blog.user?.last_name || ''}
                    </Text>
                    {blog.image && <Image source={{ uri: blog.image }} style={styles.blogImage} resizeMode="cover" />}
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
                        {[...(blog.comments || [])]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((comment) => (
                            <View key={comment.id} style={styles.commentCard}>
                                <View style={styles.commentHeaderRow}>
                                    <Text style={styles.commentAuthor}>
                                        {comment.user?.first_name || 'Anonymous'} {comment.user?.last_name || ''}
                                    </Text>
                                    <TouchableOpacity onPress={() => showDropdown(comment.id, comment.content)}>
                                        <Icon name="more-vert" size={20} color="#64FFDA" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.commentContent}>{comment.content}</Text>
                                <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
                            </View>
                        ))}
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
    authorText: { color: '#8892B0', fontSize: 16, fontStyle: 'italic', marginBottom: 15 },
    blogImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
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
    commentAuthor: { color: '#64FFDA', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
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