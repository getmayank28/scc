import React from "react";
import { useLocalStorageForm } from "../../hooks";

export const LocalStorageStatus: React.FC = () => {
  const {
    hasStoredData,
    isDataRecent,
    getStoredDataAge,
    clearStoredData,
    loadStoredData,
  } = useLocalStorageForm();

  if (!hasStoredData) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-gray-800/50 border border-gray-600/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <p className="text-green-300 text-sm font-medium">Progress Saved</p>
            <p className="text-gray-400 text-xs">
              Last updated: {getStoredDataAge()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadStoredData}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            title="Reload stored data"
          >
            🔄
          </button>
          <button
            onClick={clearStoredData}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            title="Clear stored data"
          >
            🗑️
          </button>
        </div>
      </div>

      {!isDataRecent && (
        <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
          <p className="text-yellow-300 text-xs">
            ⚠️ Data is older than 24 hours. Consider starting fresh.
          </p>
        </div>
      )}
    </div>
  );
};
