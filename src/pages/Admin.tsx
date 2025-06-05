import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, TestTube, Settings, FileText, BookOpen, Brain, Upload } from 'lucide-react';
import KaggleIntegrationTest from '@/components/admin/KaggleIntegrationTest';
import FashionpediaDataUpload from '@/components/admin/FashionpediaDataUpload';
import PrimaryTaxonomyUpload from '@/components/admin/PrimaryTaxonomyUpload';
import AcademicPaperUpload from '@/components/admin/AcademicPaperUpload';
import AcademicPapersList from '@/components/admin/AcademicPapersList';
import AcademicProcessingPanel from '@/components/admin/AcademicProcessingPanel';
import EnhancedTaggingPreview from '@/components/admin/EnhancedTaggingPreview';
import WhitelistSyncButton from '@/components/admin/WhitelistSyncButton';
import TaggingFlowDiagram from '@/components/admin/TaggingFlowDiagram';

const Admin: React.FC = () => {
  console.log('Admin component rendering...');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage RateMyFit data and integrations</p>
        </div>

        <Tabs defaultValue="taxonomy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="taxonomy" className="flex items-center gap-2">
              <Upload size={16} />
              Primary Taxonomy
            </TabsTrigger>
            <TabsTrigger value="kaggle" className="flex items-center gap-2">
              <Database size={16} />
              Kaggle Integration
            </TabsTrigger>
            <TabsTrigger value="fashionpedia" className="flex items-center gap-2">
              <FileText size={16} />
              Fashionpedia
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-2">
              <BookOpen size={16} />
              Academic Papers
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Brain size={16} />
              AI Processing
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube size={16} />
              Testing Tools
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="taxonomy">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Primary Fashion Taxonomy</h2>
                <WhitelistSyncButton />
              </div>
              <PrimaryTaxonomyUpload />
              <TaggingFlowDiagram />
            </div>
          </TabsContent>

          <TabsContent value="kaggle">
            <KaggleIntegrationTest />
          </TabsContent>

          <TabsContent value="fashionpedia">
            <FashionpediaDataUpload />
          </TabsContent>

          <TabsContent value="academic">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AcademicPaperUpload />
              <AcademicPapersList />
            </div>
          </TabsContent>

          <TabsContent value="processing">
            <div className="space-y-6">
              <AcademicProcessingPanel />
              <EnhancedTaggingPreview />
            </div>
          </TabsContent>

          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle>Testing Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Testing tools will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">System settings will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
