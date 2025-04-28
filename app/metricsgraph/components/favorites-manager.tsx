'use client';

import React, { useState } from 'react';
import { useMetrics } from '../metrics-context';
import { Bookmark, X, Save } from 'lucide-react';

export default function FavoritesManager() {
  const { selectedMetrics, favorites, saveAsFavorite, loadFavorite, deleteFavorite } = useMetrics();
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const handleSave = () => {
    if (newFavoriteName.trim()) {
      saveAsFavorite(newFavoriteName.trim());
      setNewFavoriteName('');
      setShowSaveDialog(false);
    }
  };
  
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-700 flex items-center">
          <Bookmark className="h-4 w-4 mr-2 text-blue-600" />
          Saved Selections
        </h3>
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={selectedMetrics.length === 0}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          <Save className="h-3 w-3 mr-1" />
          Save Current Selection
        </button>
      </div>
      
      {showSaveDialog && (
        <div className="mb-3 p-3 border border-blue-200 rounded bg-blue-50">
          <label className="block text-sm font-medium text-blue-800 mb-1">
            Name for this selection:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFavoriteName}
              onChange={(e) => setNewFavoriteName(e.target.value)}
              placeholder="e.g., Monthly Sales Overview"
              className="flex-1 px-3 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {favorites.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No saved selections yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {favorites.map(favorite => (
            <div key={favorite.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
              <span className="text-sm font-medium">{favorite.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => loadFavorite(favorite.id)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Load
                </button>
                <button
                  onClick={() => deleteFavorite(favorite.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                >
                  <X className="h-3 w-3 mr-0.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}