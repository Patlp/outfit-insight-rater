
import React from 'react';
import { BookOpen, Clock, CheckCircle, Cpu } from 'lucide-react';

interface ProcessingStatsProps {
  totalPapers: number;
  pendingPapers: number;
  totalProcessingRuns: number;
}

const ProcessingStats: React.FC<ProcessingStatsProps> = ({
  totalPapers,
  pendingPapers,
  totalProcessingRuns
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <BookOpen className="mx-auto text-blue-500 mb-2" size={20} />
        <div className="text-2xl font-bold text-blue-700">{totalPapers}</div>
        <div className="text-xs text-blue-600">Total Papers</div>
      </div>
      <div className="text-center p-3 bg-yellow-50 rounded-lg">
        <Clock className="mx-auto text-yellow-500 mb-2" size={20} />
        <div className="text-2xl font-bold text-yellow-700">{pendingPapers}</div>
        <div className="text-xs text-yellow-600">Pending Processing</div>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <CheckCircle className="mx-auto text-green-500 mb-2" size={20} />
        <div className="text-2xl font-bold text-green-700">{totalPapers - pendingPapers}</div>
        <div className="text-xs text-green-600">Processed</div>
      </div>
      <div className="text-center p-3 bg-purple-50 rounded-lg">
        <Cpu className="mx-auto text-purple-500 mb-2" size={20} />
        <div className="text-2xl font-bold text-purple-700">{totalProcessingRuns}</div>
        <div className="text-xs text-purple-600">Processing Runs</div>
      </div>
    </div>
  );
};

export default ProcessingStats;
