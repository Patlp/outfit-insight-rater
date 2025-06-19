
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Effective Date: June 19, 2025</p>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-lg mb-6">
            RateMyFit ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>We may collect:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Personal information you provide (e.g., email, name, photos you upload)</li>
            <li>Style and fashion preferences</li>
            <li>Device and usage data (e.g., IP address, browser type)</li>
            <li>Pinterest account information (when you choose to connect your Pinterest account)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Provide and improve RateMyFit services</li>
            <li>Generate outfit insights and fashion feedback</li>
            <li>Personalize your experience</li>
            <li>Facilitate Pinterest API integrations such as importing boards or pins</li>
            <li>Analyze fashion trends and improve our AI recommendations</li>
            <li>Send you service-related communications</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Sharing Your Information</h2>
          <p>
            We do not sell your personal data. We may share limited information with third-party APIs (e.g., Pinterest) only with your permission and for the purpose of enabling features like:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Importing pins or boards to create outfits</li>
            <li>Suggesting styles based on saved Pinterest content</li>
            <li>Enabling you to save your outfit inspirations to your Pinterest boards</li>
          </ul>
          <p>
            We may also share your information with service providers who help us operate our platform, but only to the extent necessary for them to provide their services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Retention</h2>
          <p>
            We retain your data only as long as necessary for the purpose it was collected, unless required by law to keep it longer. You can request deletion of your account and associated data at any time through your account settings or by contacting us directly.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights and Choices</h2>
          <p>You can:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Request deletion of your data at any time</li>
            <li>Revoke Pinterest access by disconnecting in your account settings</li>
            <li>Update or correct your personal information</li>
            <li>Request a copy of your data</li>
            <li>Opt out of non-essential communications</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Third-Party Services</h2>
          <p>
            Our service integrates with third-party platforms like Pinterest. When you connect these services, you're also subject to their privacy policies. We encourage you to review the privacy policies of any third-party services you use in connection with RateMyFit.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Children's Privacy</h2>
          <p>
            RateMyFit is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during such transfers.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. If we make material changes, we'll notify users by updating the date at the top of this page and may provide additional notice through our service or via email.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
          <p>
            If you have questions about this policy or our privacy practices, please contact us at:{' '}
            <a href="mailto:support@ratemyfit.app" className="text-fashion-500 hover:text-fashion-600">
              support@ratemyfit.app
            </a>
          </p>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Last updated:</strong> June 19, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
