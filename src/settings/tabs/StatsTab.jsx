/**
 * Stats Tab Component
 * 
 * Displays usage statistics for the extension.
 * Now uses AppContext instead of props.
 * 
 * @component
 */

import { useApp } from "../../contexts/AppContext";

export const StatsTab = ({ showToast }) => {
  const { stats, resetStats } = useApp();

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all statistics?')) {
      resetStats();
      showToast('Statistics reset', 'success');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Usage Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Total Filtered</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.filterCount}</p>
          <p className="text-sm text-blue-700 mt-1">Items blocked all-time</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Today</h3>
          <p className="text-4xl font-bold text-green-600">{stats.todayCount}</p>
          <p className="text-sm text-green-700 mt-1">Items blocked today</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">Active Since</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.installDate}</p>
          <p className="text-sm text-purple-700 mt-1">Installation date</p>
        </div>
      </div>

      <button 
        onClick={handleReset}
        className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
      >
        Reset All Statistics
      </button>
    </div>
  );
};