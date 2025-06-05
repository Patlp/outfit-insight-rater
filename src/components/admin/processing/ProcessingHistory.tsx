
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ProcessingStats {
  totalProcessingRuns: number;
  statusBreakdown: Record<string, number>;
  recentActivity: Array<{
    status: string;
    process_type: string;
    created_at: string;
  }>;
}

interface ProcessingHistoryProps {
  stats: ProcessingStats;
}

const ProcessingHistory: React.FC<ProcessingHistoryProps> = ({ stats }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!stats.recentActivity.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Recent Processing Activity</h3>
      <div className="space-y-2">
        {stats.recentActivity.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(activity.status)}>
                {activity.status}
              </Badge>
              <span className="text-sm">{activity.process_type.replace('_', ' ')}</span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(activity.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingHistory;
