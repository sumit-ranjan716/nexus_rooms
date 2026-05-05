import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@nexus/api-client';
import type { ContentItem, Room } from '@nexus/types';
import { authService } from '../services/authService';
import { useAuthStore } from '../store';

function Dashboard(): JSX.Element {
  const email = useAuthStore((state) => state.email);
  const displayName = useAuthStore((state) => state.displayName);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceBody, setResourceBody] = useState('');
  const [resourceType, setResourceType] = useState<'text' | 'link'>('text');
  const [status, setStatus] = useState('Loading workspace...');
  const [loading, setLoading] = useState(true);

  const selectedRoom = useMemo(() => rooms.find((room) => room.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);

  async function loadRooms(): Promise<void> {
    const data = await apiClient.getRooms();
    setRooms(data);
    if (!selectedRoomId && data.length > 0) {
      setSelectedRoomId(data[0].id);
    }
  }

  async function loadRoomContent(roomId: string): Promise<void> {
    const response = await apiClient.getContent(roomId);
    setContent(response.items);
  }

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      try {
        await loadRooms();
        setStatus('Workspace is ready.');
      } catch (error) {
        setStatus(`Failed loading rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) {
      setContent([]);
      return;
    }

    loadRoomContent(selectedRoomId).catch((error: unknown) => {
      setStatus(`Failed loading content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
  }, [selectedRoomId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Nexus Rooms</h1>
          <p className="mt-2 text-gray-600">Signed in as {displayName || email || 'User'}</p>
        </div>
        <button
          onClick={async () => {
            await authService.logout();
            clearAuth();
            window.location.href = '/login';
          }}
          className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
        >
          Logout
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">{loading ? 'Loading...' : status}</div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg bg-white p-6 shadow lg:col-span-1">
          <h2 className="text-xl font-semibold">Create Room</h2>
          <div className="mt-4 space-y-3">
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room name" className="w-full rounded border p-2" />
            <textarea value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)} placeholder="Description (optional)" className="w-full rounded border p-2" rows={3} />
            <button
              className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={async () => {
                if (!roomName.trim()) return;
                try {
                  await apiClient.createRoom({ name: roomName.trim(), description: roomDescription.trim() || undefined });
                  setRoomName('');
                  setRoomDescription('');
                  await loadRooms();
                  setStatus('Room created successfully.');
                } catch (error) {
                  setStatus(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              Create Room
            </button>
          </div>

          <h3 className="mt-8 text-lg font-semibold">Your Rooms</h3>
          <div className="mt-3 space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full rounded border p-3 text-left ${selectedRoomId === room.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="font-medium">{room.name}</div>
                <div className="text-xs text-gray-500">{room.memberCount} members</div>
              </button>
            ))}
            {rooms.length === 0 && <p className="text-sm text-gray-500">No rooms yet.</p>}
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{selectedRoom?.name || 'Select a room'}</h2>
              <p className="text-sm text-gray-500">Manage structured room content</p>
            </div>
            {selectedRoom && (
              <button
                className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                onClick={async () => {
                  try {
                    await apiClient.deleteRoom(selectedRoom.id);
                    setSelectedRoomId('');
                    setContent([]);
                    await loadRooms();
                    setStatus('Room deleted.');
                  } catch (error) {
                    setStatus(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
              >
                Delete Room
              </button>
            )}
          </div>

          {selectedRoom ? (
            <>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <select value={resourceType} onChange={(e) => setResourceType(e.target.value as 'text' | 'link')} className="rounded border p-2">
                  <option value="text">Text Block</option>
                  <option value="link">Link</option>
                </select>
                <input value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="Title" className="rounded border p-2" />
                <textarea value={resourceBody} onChange={(e) => setResourceBody(e.target.value)} placeholder={resourceType === 'link' ? 'https://example.com' : 'Write the shared note...'} className="rounded border p-2 md:col-span-2" rows={3} />
                <button
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 md:col-span-2"
                  onClick={async () => {
                    if (!resourceTitle.trim() || !resourceBody.trim()) return;
                    try {
                      await apiClient.createContent(selectedRoom.id, {
                        uploadId: crypto.randomUUID(),
                        filename: resourceType === 'link' ? 'link.url' : 'note.txt',
                        title: resourceTitle.trim(),
                        mimeType: resourceType === 'link' ? 'text/uri-list' : 'text/plain',
                        fileSizeBytes: new TextEncoder().encode(resourceBody).length,
                      });
                      setResourceTitle('');
                      setResourceBody('');
                      await loadRoomContent(selectedRoom.id);
                      setStatus('Resource added to room.');
                    } catch (error) {
                      setStatus(`Failed to add resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                >
                  Add Resource
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {content.map((item) => (
                  <div key={item.id} className="rounded border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.type} • {item.mimeType}</p>
                      </div>
                      <button
                        className="rounded bg-gray-800 px-2 py-1 text-xs text-white hover:bg-black"
                        onClick={async () => {
                          await apiClient.deleteContent(item.id);
                          await loadRoomContent(selectedRoom.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {content.length === 0 && <p className="text-sm text-gray-500">No resources yet.</p>}
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-gray-500">Create or select a room to manage resources.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
