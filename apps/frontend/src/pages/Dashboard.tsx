import { useEffect, useState } from 'react';
import { apiClient } from '@nexus/api-client';

function Dashboard(): JSX.Element {
  const [apiStatus, setApiStatus] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiStatus = async (): Promise<void> => {
      try {
        const response = await apiClient.getHealthStatus();
        setApiStatus(
          `API is running! Version: ${response.data.version}, Uptime: ${Math.round(
            response.data.uptime ?? 0
          )}s`
        );
      } catch (error) {
        setApiStatus(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    checkApiStatus();
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome to Nexus Rooms</h2>
          <p className="text-gray-600">
            This is the MVP dashboard. Start by creating your first room or joining an existing one.
          </p>
        </div>

        {/* API Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">API Status</h3>
          {loading ? (
            <div className="animate-pulse">Checking...</div>
          ) : (
            <p className="text-sm text-gray-700 break-words">{apiStatus}</p>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Create Room
            </button>
            <button className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Join Room
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Your Rooms</h3>
        <p className="text-gray-500">No rooms yet. Create one to get started!</p>
      </div>
    </div>
  );
}

export default Dashboard;
