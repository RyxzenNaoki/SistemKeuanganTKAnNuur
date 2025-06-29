import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Memuat...</h2>
        <p className="mt-2 text-sm text-gray-500">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
};

export default LoadingScreen;