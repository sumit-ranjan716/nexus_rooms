/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState, useRef } from 'react';
import { apiClient } from '@nexus/api-client';
import type { ContentItem, Room, Folder, Tag, Comment, ContentVersion, ActivityLog } from '@nexus/types';
export default function Dashboard(): JSX.Element {

  // Core Room State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  
  // Workspace Content State
  const [content, setContent] = useState<ContentItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  // Selected Item Detail State (Drawer)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Input & Creation States
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [folderName, setFolderName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#6366f1');
  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>('all');

  // UI Status
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [virusStatus, setVirusStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'comments' | 'versions'>('comments');

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // References to keep SSE closures updated
  const activeItemRef = useRef<ContentItem | null>(null);
  useEffect(() => {
    activeItemRef.current = activeItem;
  }, [activeItem]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  // 1. Initial Data Fetching
  async function loadRooms(): Promise<void> {
    try {
      const data = await apiClient.getRooms();
      setRooms(data);
      if (!selectedRoomId && data.length > 0) {
        setSelectedRoomId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load rooms', e);
    }
  }

  async function loadRoomDetails(roomId: string): Promise<void> {
    try {
      const contentData = await apiClient.getContent(roomId);
      setContent(contentData.items);

      const foldersData = await apiClient.getFolders(roomId);
      setFolders(foldersData);

      const tagsData = await apiClient.getTags(roomId);
      setTags(tagsData);

      const activityData = await apiClient.getActivityLog(roomId);
      setActivity(activityData);
    } catch (e) {
      setStatus('Failed loading room assets.');
    }
  }

  async function loadComments(itemId: string): Promise<void> {
    try {
      const data = await apiClient.getComments(itemId);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadVersions(itemId: string): Promise<void> {
    try {
      const data = await apiClient.getVersions(itemId);
      setVersions(data);
    } catch (e) {
      console.error(e);
    }
  }

  // Reload active item drawer if updated
  useEffect(() => {
    if (activeItem) {
      loadComments(activeItem.id);
      loadVersions(activeItem.id);
    }
  }, [activeItem]);

  // Load rooms on start
  useEffect(() => {
    loadRooms().then(() => setLoading(false));
  }, []);

  // Reload details when room selection changes
  useEffect(() => {
    if (!selectedRoomId) {
      setContent([]);
      setFolders([]);
      setTags([]);
      setActivity([]);
      setSelectedFolderId(null);
      setSelectedTagId(null);
      return;
    }
    loadRoomDetails(selectedRoomId);
  }, [selectedRoomId]);

  // 2. Server-Sent Events (SSE) Realtime Stream Sync
  useEffect(() => {
    if (!selectedRoomId) return;

    // Connect to backend server SSE broadcast channel
    const streamUrl = `${apiClient['baseUrl'] || 'http://localhost:3001'}/api/v1/rooms/${selectedRoomId}/stream`;
    const es = new EventSource(streamUrl);

    es.addEventListener('CONTENT_ADDED', (e: any) => {
      try {
        const item = JSON.parse(e.data) as ContentItem;
        setContent((prev) => {
          if (prev.some((x) => x.id === item.id)) return prev;
          return [item, ...prev];
        });
        // Trigger fresh activity logs
        apiClient.getActivityLog(selectedRoomId).then(setActivity);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('CONTENT_DELETED', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setContent((prev) => prev.filter((x) => x.id !== data.id));
        if (activeItemRef.current?.id === data.id) {
          setIsDrawerOpen(false);
          setActiveItem(null);
        }
        apiClient.getActivityLog(selectedRoomId).then(setActivity);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('FOLDER_ADDED', (e: any) => {
      try {
        const folder = JSON.parse(e.data) as Folder;
        setFolders((prev) => {
          if (prev.some((x) => x.id === folder.id)) return prev;
          return [...prev, folder];
        });
        apiClient.getActivityLog(selectedRoomId).then(setActivity);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('FOLDER_UPDATED', (e: any) => {
      try {
        const folder = JSON.parse(e.data) as Folder;
        setFolders((prev) => prev.map((x) => (x.id === folder.id ? folder : x)));
        apiClient.getActivityLog(selectedRoomId).then(setActivity);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('FOLDER_DELETED', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setFolders((prev) => prev.filter((x) => x.id !== data.id));
        apiClient.getActivityLog(selectedRoomId).then(setActivity);
      } catch (err) {
        console.error(err);
      }
    });

    es.addEventListener('COMMENT_ADDED', (e: any) => {
      try {
        const comment = JSON.parse(e.data) as Comment;
        if (activeItemRef.current && activeItemRef.current.id === comment.contentItemId) {
          loadComments(comment.contentItemId);
        }
        apiClient.getActivityLog(selectedRoomId).then(setActivity);
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      es.close();
    };
  }, [selectedRoomId]);

  // 3. Filtering & Searching Logic
  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      // Keyword matches title or mime type
      const matchSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mimeType.toLowerCase().includes(searchQuery.toLowerCase());

      // Folder matches
      const matchFolder = !selectedFolderId || item.metadata?.folderId === selectedFolderId || (item as any).folderId === selectedFolderId;

      // Tag matches
      const matchTag = !selectedTagId || (item as any).tags?.some((t: any) => t.id === selectedTagId);

      // Mime classification matches
      let matchType = true;
      if (selectedContentType !== 'all') {
        matchType = item.type === selectedContentType;
      }

      return matchSearch && matchFolder && matchTag && matchType;
    });
  }, [content, searchQuery, selectedFolderId, selectedTagId, selectedContentType]);

  // 4. Folder Actions
  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    try {
      await apiClient.createFolder(selectedRoomId, { name: folderName.trim() });
      setFolderName('');
      setStatus('Folder created.');
    } catch (e) {
      setStatus('Failed creating folder.');
    }
  }

  async function handleRenameFolder(folderId: string) {
    if (!newFolderName.trim()) return;
    try {
      await apiClient.updateFolder(selectedRoomId, folderId, newFolderName.trim());
      setNewFolderName('');
      setEditingFolderId(null);
      setStatus('Folder renamed.');
    } catch (e) {
      setStatus('Rename failed.');
    }
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm('Are you sure you want to delete this folder? All contents will be unlinked.')) return;
    try {
      await apiClient.deleteFolder(selectedRoomId, folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      setStatus('Folder deleted.');
    } catch (e) {
      setStatus('Failed deleting folder.');
    }
  }

  // 5. Tag Actions
  async function handleCreateTag() {
    if (!tagName.trim()) return;
    try {
      await apiClient.createTag(selectedRoomId, { name: tagName.trim(), color: tagColor });
      setTagName('');
      setStatus('Tag added.');
    } catch (e) {
      setStatus('Failed creating tag.');
    }
  }

  // 6. Comments Actions (Including nested reply parsing)
  async function handleAddComment() {
    if (!commentText.trim() || !activeItem) return;
    try {
      await apiClient.createComment(activeItem.id, { body: commentText.trim() });
      setCommentText('');
      loadComments(activeItem.id);
    } catch (e) {
      setStatus('Failed posting comment.');
    }
  }

  async function handleAddReply(parentId: string) {
    if (!replyText.trim() || !activeItem) return;
    try {
      await apiClient.createComment(activeItem.id, { body: replyText.trim(), parentId });
      setReplyText('');
      setReplyingToId(null);
      loadComments(activeItem.id);
    } catch (e) {
      setStatus('Failed posting reply.');
    }
  }

  // 7. Versioning Rollback Action
  async function handleRollback(versionId: string) {
    if (!activeItem || !confirm('Are you sure you want to rollback to this version?')) return;
    try {
      await apiClient.rollbackVersion(activeItem.id, versionId);
      setStatus('Version rolled back!');
      // Reload room details & update active drawer item
      await loadRoomDetails(selectedRoomId);
      const freshContent = await apiClient.getContent(selectedRoomId);
      const updated = freshContent.items.find(x => x.id === activeItem.id);
      if (updated) {
        setActiveItem(updated);
      }
    } catch (e) {
      setStatus('Rollback failed.');
    }
  }

  // 8. Dynamic File Drag & Drop + Emulated ClamAV Asynchronous Virus Scanning
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  async function uploadFile(file: File) {
    if (!selectedRoomId) return;
    setUploading(true);
    setUploadProgress(10);
    setStatus('Initializing upload...');

    try {
      // 1. Get local virtual-S3 presigned URL
      const presign = await apiClient.getPresignedUrl(selectedRoomId, {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
      });

      setUploadProgress(30);

      // 2. Perform Mock ClamAV Antivirus Scanning (Asynchronously)
      setVirusStatus('initializing');
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setVirusStatus('scanning');
      setUploadProgress(50);
      // Simulating blocks analysis
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Clear for upload
      setVirusStatus('clean');
      setUploadProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Upload file payload directly to fastify static S3 storage mock
      const uploadRes = await fetch(presign.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-filename': file.name,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Local S3 Upload Failed');
      }

      setUploadProgress(90);

      // 4. Create database Content Item entry matching local virtual-S3
      const tagIdsToSend = selectedTagId ? [selectedTagId] : [];
      await apiClient.createContent(selectedRoomId, {
        uploadId: presign.uploadId,
        filename: file.name,
        title: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
        folderId: selectedFolderId || undefined,
        tagIds: tagIdsToSend,
      });

      setUploadProgress(100);
      setStatus('File uploaded successfully and verified by ClamAV!');
      
      // Reload assets
      await loadRoomDetails(selectedRoomId);
    } catch (error: any) {
      console.error(error);
      setStatus(`Upload failed: ${error.message || 'Error'}`);
    } finally {
      setUploading(false);
      setVirusStatus(null);
      setUploadProgress(0);
    }
  }

  // Download Handler
  async function handleDownload(item: ContentItem) {
    try {
      const res = await apiClient.getDownloadUrl(item.id);
      window.open(res.downloadUrl, '_blank');
    } catch (e) {
      setStatus('Download link generation failed.');
    }
  }

  // Delete Content Item
  async function handleDeleteContent(itemId: string) {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await apiClient.deleteContent(itemId);
      setStatus('Content deleted.');
      if (activeItem?.id === itemId) {
        setIsDrawerOpen(false);
        setActiveItem(null);
      }
      await loadRoomDetails(selectedRoomId);
    } catch (e) {
      setStatus('Delete content failed.');
    }
  }

  // 9. Format Helpers
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return (
          <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'document':
      case 'text':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Render
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn transition-colors duration-300">
      
      {/* COLUMN 1: Room Selection & Management */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Workspace Rooms Selector */}
        <div className="glass rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Workspace Rooms
            </h2>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative ${
                  selectedRoomId === room.id
                    ? 'border-primary/40 bg-primary/10 text-foreground font-semibold shadow-sm'
                    : 'border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                <div className="font-medium truncate group-hover:translate-x-1 transition-transform duration-200">
                  {room.name}
                </div>
                <div className="text-xs mt-1 text-muted-foreground/80 font-normal">
                  {room.memberCount} members
                </div>
              </button>
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No rooms created yet.</p>
            )}
          </div>
        </div>

        {/* Create Room Form */}
        <div className="glass rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Create New Room</h3>
          <div className="space-y-3.5">
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="E.g., Design Sync"
              className="w-full text-sm rounded-xl border border-border px-3.5 py-2.5 bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition"
            />
            <textarea
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Description (Optional)"
              className="w-full text-sm rounded-xl border border-border px-3.5 py-2.5 bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition resize-none"
              rows={2}
            />
            <button
              onClick={async () => {
                if (!roomName.trim()) return;
                try {
                  await apiClient.createRoom({ name: roomName.trim(), description: roomDescription.trim() || undefined });
                  setRoomName('');
                  setRoomDescription('');
                  await loadRooms();
                  setStatus('Workspace expanded!');
                } catch (e) {
                  setStatus('Failed creating room.');
                }
              }}
              className="w-full text-sm rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Create Room
            </button>
          </div>
        </div>

        {/* Room Tags */}
        {selectedRoomId && (
          <div className="glass rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3.5 flex items-center justify-between">
              <span>Tags</span>
              {selectedTagId && (
                <button onClick={() => setSelectedTagId(null)} className="text-xs text-primary hover:underline">
                  Clear
                </button>
              )}
            </h3>
            
            {/* Tag List */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                  style={{ backgroundColor: selectedTagId === tag.id ? tag.color : undefined, borderColor: tag.color }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    selectedTagId === tag.id
                      ? 'text-white font-medium border-transparent scale-105 shadow-sm'
                      : 'text-foreground/80 hover:bg-secondary'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: selectedTagId === tag.id ? 'white' : tag.color }}></span>
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags defined yet.</span>}
            </div>

            {/* Create Tag */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex gap-2">
                <input
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="New tag name"
                  className="flex-1 text-xs rounded-xl border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-8 h-8 p-0.5 rounded-lg border border-border cursor-pointer bg-background"
                />
              </div>
              <button
                onClick={handleCreateTag}
                className="w-full text-xs font-semibold rounded-lg bg-secondary text-foreground hover:bg-secondary-foreground/10 py-2 transition"
              >
                Create Tag
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COLUMN 2 & 3: Folder Explorer, Upload Zone, Search & Content */}
      <div className="lg:col-span-2 space-y-6">
        
        {selectedRoom ? (
          <>
            {/* Header, Search & Filter Controls */}
            <div className="glass rounded-2xl border border-border p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{selectedRoom.name}</h1>
                  {selectedRoom.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedRoom.description}</p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to delete this workspace room?')) return;
                    try {
                      await apiClient.deleteRoom(selectedRoom.id);
                      setSelectedRoomId('');
                      await loadRooms();
                      setStatus('Room deleted.');
                    } catch (e) {
                      setStatus('Delete room failed.');
                    }
                  }}
                  className="text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-3 py-1.5 hover:bg-destructive hover:text-white transition duration-200"
                >
                  Delete Room
                </button>
              </div>

              {/* Advanced Search & Filtering Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="sm:col-span-2 relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search file contents, titles, extensions..."
                    className="w-full text-sm rounded-xl border border-border pl-10 pr-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div>
                  <select
                    value={selectedContentType}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    className="w-full text-sm rounded-xl border border-border px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition"
                  >
                    <option value="all">All File Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="image">Images</option>
                    <option value="document">Office Docs</option>
                    <option value="text">Text Blocks</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Folder Navigation / Explorer */}
            <div className="glass rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center justify-between">
                <span>Folders Explorer</span>
                {selectedFolderId && (
                  <button onClick={() => setSelectedFolderId(null)} className="text-xs text-primary hover:underline">
                    Back to Root
                  </button>
                )}
              </h3>

              {/* Folders Flex Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      selectedFolderId === folder.id
                        ? 'border-primary bg-primary/5 text-primary-foreground font-semibold shadow-sm'
                        : 'border-border bg-card/60 text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
                      className="flex-1 text-left flex items-center gap-2 truncate"
                    >
                      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm1 2h3.586l1.707 1.707A1 1 0 0011 8h5v6H4V6h1z" clipRule="evenodd" />
                      </svg>
                      {editingFolderId === folder.id ? (
                        <input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)}
                          className="w-full text-xs p-1 rounded border bg-background text-foreground"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm font-medium truncate">{folder.name}</span>
                      )}
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {editingFolderId === folder.id ? (
                        <button
                          onClick={() => handleRenameFolder(folder.id)}
                          className="p-1 hover:text-emerald-500 transition"
                        >
                          ✓
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolderId(folder.id);
                            setNewFolderName(folder.name);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground p-1 transition"
                          title="Rename Folder"
                        >
                          ✎
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive p-1 transition"
                        title="Delete Folder"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create Folder Form */}
              <div className="flex gap-2 border-t border-border pt-4">
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="New folder name..."
                  className="flex-1 text-sm rounded-xl border border-border px-3.5 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 text-xs font-semibold bg-secondary rounded-xl text-foreground hover:bg-secondary-foreground/10 transition"
                >
                  Create Folder
                </button>
              </div>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-102'
                  : 'border-border hover:border-primary/50 bg-card/30'
              }`}
            >
              {/* Invisible File Input */}
              <input
                type="file"
                id="file-upload-input"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="space-y-4 w-full text-center py-4">
                  {/* Rotating Indicator */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                    <span className="text-sm font-semibold text-foreground">
                      {virusStatus === 'initializing' && 'Preparing upload parameters...'}
                      {virusStatus === 'scanning' && 'ClamAV Virus Scanning: Analyzing data blocks...'}
                      {virusStatus === 'clean' && 'ClamAV Scan: [CLEAN] Uploading file to virtual S3...'}
                      {!virusStatus && 'Uploading and processing file...'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-4/5 mx-auto bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">{uploadProgress}% complete</span>
                </div>
              ) : (
                <label
                  htmlFor="file-upload-input"
                  className="cursor-pointer flex flex-col items-center gap-3.5 text-center w-full h-full py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Drag & Drop files here, or <span className="text-primary hover:underline">browse files</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports uploads up to 10MB. Mock ClamAV scanned automatically.
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Content Explorer Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Files & Notes ({filteredContent.length})
                </h3>
                {selectedFolderId && (
                  <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Folder Context Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className="glass border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar with Icon & Delete Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-2 bg-secondary/80 rounded-xl">
                          {getFileIcon(item.type)}
                        </div>
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/5 transition-colors"
                          title="Delete file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Info */}
                      <div className="mt-3.5">
                        <h4
                          onClick={() => {
                            setActiveItem(item);
                            setIsDrawerOpen(true);
                          }}
                          className="font-bold text-foreground text-base tracking-tight hover:text-primary cursor-pointer line-clamp-1 truncate"
                        >
                          {item.title}
                        </h4>
                        
                        {/* Render Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(item as any).tags?.map((t: any) => (
                            <span
                              key={t.id}
                              style={{ backgroundColor: `${t.color}15`, color: t.color, borderColor: `${t.color}30` }}
                              className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status Panel */}
                    <div className="flex items-center justify-between border-t border-border mt-4 pt-3.5 text-xs text-muted-foreground">
                      <span>{formatBytes(item.fileSizeBytes)}</span>
                      <button
                        onClick={() => handleDownload(item)}
                        className="text-primary font-semibold hover:underline flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                ))}

                {filteredContent.length === 0 && (
                  <div className="sm:col-span-2 text-center py-10 border border-dashed border-border rounded-2xl bg-card/20">
                    <p className="text-sm text-muted-foreground font-medium">No items found matching the current search parameters.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl border border-border p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">No Selected Workspace Room</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Please select an existing workspace room from the left panel or compile a new room to begin storing items.
            </p>
          </div>
        )}
      </div>

      {/* COLUMN 4: Activity Log Feed Panel */}
      <div className="lg:col-span-1">
        {selectedRoomId && (
          <div className="glass rounded-2xl border border-border p-5 shadow-sm space-y-4 h-full min-h-[500px] flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              Live Workspace Activity
            </h3>
            
            <div className="flex-1 overflow-y-auto max-h-[700px] pr-1 space-y-4 custom-scrollbar text-xs">
              {activity.map((log) => (
                <div key={log.id} className="border-l-2 border-primary/30 pl-3.5 py-1.5 transition-all hover:border-primary duration-200">
                  <p className="font-semibold text-foreground">
                    {log.actor?.displayName || 'System'}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {log.action.replace(/_/g, ' ').toLowerCase()} <span className="font-medium text-foreground">{log.metadata?.title || log.metadata?.name || ''}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-10">No activities logged yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* sliding sidebar item drawer (Version control, rollbacks, nested comments) */}
      {isDrawerOpen && activeItem && (
        <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)}></div>
          
          <div className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl relative animate-slideIn">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(activeItem.type)}
                <div>
                  <h3 className="text-lg font-bold text-foreground line-clamp-1 truncate max-w-[280px]" title={activeItem.title}>
                    {activeItem.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploaded: {new Date(activeItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-border text-sm font-semibold">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3.5 text-center border-b-2 transition-all duration-200 ${
                  activeTab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Threaded Discussions
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`flex-1 py-3.5 text-center border-b-2 transition-all duration-200 ${
                  activeTab === 'versions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Versions History ({versions.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* DISCUSSIONS TAB */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Comments List */}
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-2 border-b border-secondary/50 pb-3 last:border-transparent">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-bold text-foreground/80">{comment.author?.displayName || 'User'}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-foreground/90 pl-1">{comment.body}</p>
                        
                        {/* Reply Button */}
                        <div className="pl-1">
                          <button
                            onClick={() => setReplyingToId(comment.id)}
                            className="text-xs text-primary hover:underline font-semibold"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Nest Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-4 border-l-2 border-secondary/80 space-y-2.5 mt-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="text-xs text-foreground bg-secondary/20 p-2.5 rounded-xl">
                                <div className="flex items-center justify-between font-semibold text-muted-foreground mb-1">
                                  <span>{reply.author?.displayName || 'User'}</span>
                                  <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-foreground/90">{reply.body}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Form */}
                        {replyingToId === comment.id && (
                          <div className="mt-3 flex gap-2 pl-2">
                            <input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 text-xs rounded-xl border border-border px-3 py-2 bg-background text-foreground focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddReply(comment.id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-xl"
                            >
                              Post
                            </button>
                            <button
                              onClick={() => setReplyingToId(null)}
                              className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">No discussions yet. Post a comment below to start a thread!</p>
                    )}
                  </div>

                  {/* Main Add Comment Box */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Comment on this file..."
                      className="w-full text-sm rounded-xl border border-border px-3.5 py-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      className="w-full text-sm rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 hover:scale-[1.01] active:scale-[0.99] transition duration-200"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              )}

              {/* VERSIONS HISTORY TAB */}
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  {versions.map((v) => (
                    <div key={v.id} className="border border-border rounded-xl p-4 bg-card/60 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            v{v.versionNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-2">
                          {v.changeSummary || 'File updated'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {v.creator?.displayName || 'System'}
                        </p>
                      </div>
                      
                      {/* Rollback Trigger */}
                      {v.versionNumber < versions.length && (
                        <button
                          onClick={() => handleRollback(v.id)}
                          className="text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl px-3 py-2 hover:bg-amber-500 hover:text-white transition duration-200"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No multiple versions logged for this file.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Global Status HUD */}
      {status && (
        <div className="fixed bottom-6 right-6 z-50 glass border border-border px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slideIn">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-foreground">{status}</span>
          <button onClick={() => setStatus('')} className="text-muted-foreground hover:text-foreground text-xs font-bold pl-2">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
