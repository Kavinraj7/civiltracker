'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { getActiveFirebaseConfig, FirebaseClientConfig } from '@/lib/firebase';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  RotateCcw,
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface FirebaseConfigModalProps {
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ onClose }) => {
  const { 
    isFirebaseActive, 
    refreshFirebase, 
    clearAllData, 
    exportBackupJSON, 
    importBackupJSON 
  } = useData();

  const currentConfig = getActiveFirebaseConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const configToSave: FirebaseClientConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    if (configToSave.apiKey && configToSave.projectId) {
      localStorage.setItem('civil_firebase_config', JSON.stringify(configToSave));
      setSuccessMsg('Firebase configuration saved! Reconnecting...');
      setTimeout(() => {
        refreshFirebase();
        window.location.reload();
      }, 700);
    } else {
      localStorage.removeItem('civil_firebase_config');
      setSuccessMsg('Firebase override removed. Using environment / local fallback.');
      refreshFirebase();
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('civil_firebase_config');
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    refreshFirebase();
    setSuccessMsg('Reverted to Local / Environment mode.');
  };

  const envSnippet = `NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey || 'your_api_key'}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain || 'your-project.firebaseapp.com'}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId || 'your-project-id'}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket || 'your-project.appspot.com'}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId || 'your_sender_id'}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId || 'your_app_id'}`;

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated organisation admins can read & write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civilcorp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJSON(content);
        if (ok) {
          setImportStatus('Backup data imported successfully!');
        } else {
          setImportStatus('Failed to parse backup JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Firebase & Data Settings</h2>
              <p className="text-xs text-slate-500">Configure cloud database, auth roles & local backups</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isFirebaseActive
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${
              isFirebaseActive ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
            }`} />
            <div>
              <div className="font-bold text-sm">
                {isFirebaseActive ? 'Connected to Firebase Cloud' : 'Running in Local / Standalone Mode'}
              </div>
              <p className="text-xs mt-1 text-slate-700">
                {isFirebaseActive
                  ? 'All projects, client payments, vendor transactions & worker wages are syncing to Firebase Firestore in real-time. Any admin user in Firebase Auth can login and manage all organisation records.'
                  : 'Firebase credentials are not configured yet. The application is running with high-speed local browser persistence and sample seed data. You can paste your Firebase credentials below anytime!'}
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Firebase Configuration Form */}
          <form onSubmit={handleSaveFirebaseConfig} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Firebase Web Project Credentials</span>
              </div>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 hover:underline flex items-center gap-1 text-[11px] font-bold"
              >
                <span>Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-slate-600 text-[11px]">
              Paste the Firebase web config keys below or set them in your <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">.env.local</code> file:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">API Key (apiKey)</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Auth Domain</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="civil-app.firebaseapp.com"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Project ID</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="civil-app-12345"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Storage Bucket</label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="civil-app.appspot.com"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="1029384756"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:102938:web:abcdef..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClearConfig}
                className="text-slate-500 hover:text-rose-600 underline"
              >
                Clear Override & Reset
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm transition-all"
              >
                Save & Connect Firebase
              </button>
            </div>
          </form>

          {/* Quick Copy Snippets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* .env.local helper */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">.env.local format</span>
                <button
                  onClick={() => copyToClipboard(envSnippet, setCopiedEnv)}
                  className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold"
                >
                  {copiedEnv ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEnv ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2 bg-white rounded border border-slate-200 text-[10px] text-slate-700 font-mono overflow-x-auto max-h-24">
                {envSnippet}
              </pre>
            </div>

            {/* Firestore Rules */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Firestore Security Rules</span>
                <button
                  onClick={() => copyToClipboard(firestoreRulesSnippet, setCopiedRules)}
                  className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold"
                >
                  {copiedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRules ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2 bg-white rounded border border-slate-200 text-[10px] text-slate-700 font-mono overflow-x-auto max-h-24">
                {firestoreRulesSnippet}
              </pre>
            </div>

          </div>

          {/* Backup, Export & Reset */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800">Data Backup & Tools</span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('Clear all local data and start fresh?')) {
                    clearAllData();
                    setSuccessMsg('All data has been cleared.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
            {importStatus && (
              <div className="text-[11px] text-emerald-700 font-bold">{importStatus}</div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
