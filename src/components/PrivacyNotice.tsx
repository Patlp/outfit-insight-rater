
import React, { useState } from 'react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

const PrivacyNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="max-w-md w-full mx-auto mt-8 mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-fashion-600 transition-colors w-full">
          <span>Privacy & Data Usage</span>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg mt-2 space-y-2">
          <p>
            <strong>Data Privacy:</strong> We prioritize your privacy. Uploaded photos are temporarily processed 
            for style analysis only and are automatically deleted within 15 minutes.
          </p>
          
          <p>
            <strong>No Account Needed:</strong> RateMyFit does not collect or store any personal information
            or create user profiles.
          </p>
          
          <p>
            <strong>Age Restriction:</strong> This application is not intended for use by children under the age of 13.
          </p>
          
          <p>
            <strong>GDPR Compliance:</strong> In accordance with GDPR guidelines, we do not retain any user data
            beyond the temporary processing period.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PrivacyNotice;
