import React from 'react';
import { Scale, Shield, Hammer, AlertTriangle, Lock, Eye, CheckCircle, FileText, Globe, Gavel, UserCheck, BookOpen, AlertOctagon } from 'lucide-react';

export const LegalTermsDoc = () => (
  <div className="space-y-6">
    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
      Last Updated: June 11, 2026. Welcome to the <strong>DirectRent Peer-to-Peer Leasing Ecosystem</strong>. By registering, accessing, requesting information, or publishing listings inside this workspace, you explicitly commit to these legally binding compliance and engagement rules. Please read these Terms of Service ("Terms") carefully.
    </p>

    <div className="space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Scale className="w-4 h-4 text-primary-500" />
          <span className="text-sm">1. Acceptance of Terms & Neutrality</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          DirectRent is strictly a neutral matchmaking software provider and P2P connection engine. We are not a licensed broker, real estate agent, realtor, or property manager, do not own or list properties directly, and have zero active role in the drafting, validity, execution, underwriting or legal enforcement of tenancy contracts signed between users. By using the platform, you agree that DirectRent cannot be held liable for any damages, losses, or disputes arising from user interactions.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Shield className="w-4 h-4 text-primary-500" />
          <span className="text-sm">2. Mandatory Verification Integrity (KYC)</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          All agents, landlords, and tenants must supply authentic, unmodified national identifiers (NIN/Gov ID credentials) and facial selfies. Intentionally uploading spoofed or third-party documents is a violation of international computer access and fraud statutes, and results in instant, irrevocable banned status and notification to criminal enforcement divisions. Users are responsible for updating their verified data if it lapses.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Globe className="w-4 h-4 text-primary-500" />
          <span className="text-sm">3. Fair Housing Compliance & Integrity</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Our platform operates in strict compliance with Fair Housing and Non-Discrimination standards globally. Listings must detail accurate pricing, layouts, and available utilities. Bait-and-switch configurations, hidden administrative fees, or discriminatory exclusions based on race, sex, origin, beliefs, identity, familial status, or disability will result in immediate listing deletion and account termination.
        </p>
      </div>

      <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/50">
        <div className="flex items-center gap-2 mb-2 font-bold text-rose-900 dark:text-rose-100 pb-2 border-b border-rose-200 dark:border-rose-800/50">
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <span className="text-sm">4. Independent Inspection & Payment Warnings</span>
        </div>
        <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-bold">
          DIRECTRENT EXPLICITLY AND UNILATERALLY WARNS ALL TENANTS TO REFUSE PAYING ANY BOOKING FEES, RENT DEPOSITS, OR SIGNING CONTRACTS PREVIOUS TO UNDERTAKING A RIGOROUS, PHYSICAL, IN-PERSON PROPERTY SURVEY. Inspect structural assets physically; any direct transfers done outside verified platform networks remain the exclusive transaction risk of the sender. DirectRent disclaims liability for funds sent via unverified channels.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <BookOpen className="w-4 h-4 text-primary-500" />
          <span className="text-sm">5. Intellectual Property & User Content</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          By uploading photos, descriptions, and multimedia to DirectRent, you grant us a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute the content for platform operations and advertising. You warrant that you own or have obtained necessary rights to all media uploaded. DirectRent retains full ownership right to its source code, UI/UX designs, and proprietary matchmaking algorithms.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Gavel className="w-4 h-4 text-primary-500" />
          <span className="text-sm">6. Dispute Resolution & Governing Law</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Any controversy or claim arising out of or relating to these Terms, or the breach thereof, shall be settled by confidential binding arbitration administered by the recognized arbitration association in the jurisdiction of the property, rather than in court. You agree to waive your right to a jury trial or class action. DirectRent reserves the right to intercede, freeze wallets, or enact platform bans during active disputes.
        </p>
      </div>
    </div>
  </div>
);

export const PrivacyPolicyDoc = () => (
  <div className="space-y-6">
    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
      Last Updated: June 11, 2026. At <strong>DirectRent</strong>, your personal identity credentials are held with advanced administrative, network sandboxing, and database-level security protocols. This Privacy Policy details the data we collect, why we collect it, and the rigorous rights you have over your information.
    </p>

    <div className="space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm">1. Data Collection Categories</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          We explicitly collect: (A) Profile Identifiers (Name, Phone, Email); (B) Government Demographics via KYC (National ID, Passports); (C) Biometric Data (Onboarding Facial Selfies); (D) Device Telemetry (IP, Browser specs, Push ID); (E) Transaction/Financial History (via our processing partners).
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span className="text-sm">2. Identity Shield & NIN Encryption</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          National identification data (such as NIN records) and documents are stored under encrypted, restricted Firebase cloud buckets. This dataset is restricted exclusively to authorized moderation and compliance staff checking the registration queues and is never sold to marketing channels or brokers. Data is piped using AES-256 standards.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span className="text-sm">3. Third-Party Sharing Rules</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          DirectRent does not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Exceptions include: trusted third-parties who assist us in operating our application (e.g., identity verification APIs, web hosting), or when release is mandated by law enforcement subpoenas. Aggregate, non-personally identifiable visitor information may be provided to other parties for analytics.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <FileText className="w-4 h-4 text-emerald-500" />
          <span className="text-sm">4. Encrypted Communications</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          User-to-user chat modules, feedback logs, and transaction-dispute flows are preserved in secure cloud schemas to enable professional platform mediation and safety audits during dispute claims. These logs are algorithmically scrubbed for payment card data but are accessible by moderators during conflict mediation.
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-sm">5. Platform Purge Policy (Right to be Forgotten)</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          Users hold strict proprietary power over their information. Voluntary termination of your profile purges listing databases, verification states, and active visual files, subject only to audit storage requirements for active, unresolved digital wallet disputes or anti-money laundering (AML) preservation laws governing financial logs up to 5 years.
        </p>
      </div>
    </div>
  </div>
);
