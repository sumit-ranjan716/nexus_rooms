import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

function VerifyEmail(): JSX.Element {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const token = params.get('token');

  useEffect(() => {
    const verify = async (): Promise<void> => {
      if (!token) {
        setMessage('Missing verification token.');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setMessage(response.message);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Verification failed');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow">
        <h1 className="text-2xl font-bold">Email Verification</h1>
        <p className="mt-4 text-gray-600">{message}</p>
        <Link className="mt-6 inline-block text-blue-600 hover:underline" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmail;