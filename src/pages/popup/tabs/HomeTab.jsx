// src/pages/popup/tabs/HomeTab.jsx
import { useState, useEffect } from 'react';
import { StatusCard } from '../components/StatusCard';
import { QuickBlockCurrent } from '../components/QuickBlockCurrent';
import { useToast } from '../../../components/ToastContainer';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';

export const HomeTab = ({ 
  wordManager, 
  siteManager,
  showConfirmation 
}) => {
  const { showToast } = useToast();
  const { settings, updateSettings, stats } = useApp();
  const { user } = useAuth();
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at || user?.confirmed_at;

  const handleBlockCurrentSite = async (domain) => {
    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    if (settings.blockedSites.includes(cleanDomain)) {
      showToast(`${cleanDomain} is already blocked`, 'info');
      return;
    }
    
    await updateSettings({ 
      blockedSites: [...settings.blockedSites, cleanDomain] 
    });
    
    showToast(`Blocked ${cleanDomain}`, 'success');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { 
          url: settings.redirectUrl || 'https://griffinswebservices.com' 
        });
      }
    });
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      // Refresh the session to get latest user data
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session?.user?.email_confirmed_at) {
        showToast('Email verified! You\'re all set! 🎉', 'success');
      } else {
        showToast('Email not verified yet. Check your inbox!', 'info');
      }
    } catch (error) {
      showToast('Could not check verification status', 'error');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: chrome.runtime.getURL('src/pages/settings/index.html')
        }
      });

      if (error) throw error;
      
      showToast('Verification email sent! Check your inbox.', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to send email', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Email Verification Banner (if logged in but unverified) */}
      {user && !isEmailVerified && (
        <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl text-white shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📧</span>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Verify Your Email</h3>
              <p className="text-xs text-white/90 mb-3">
                Check your inbox and click the verification link to complete setup.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCheckVerification}
                  disabled={checkingVerification}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {checkingVerification ? 'Checking...' : 'I Verified ✓'}
                </button>
                <button
                  onClick={handleResendVerification}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  Resend Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Verified Success (show briefly after verification) */}
      {user && isEmailVerified && (
        <div className="p-4 bg-gradient-to-r from-green-400 to-green-500 rounded-xl text-white shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-bold text-sm">Email Verified!</h3>
              <p className="text-xs text-white/90">
                Your account is fully set up and syncing.
              </p>
            </div>
          </div>
        </div>
      )}

      <QuickBlockCurrent 
        onBlockSite={handleBlockCurrentSite}
        showConfirmation={showConfirmation}
      />
      
      <StatusCard todayCount={stats.todayCount} />
      
      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
          Quick Add Word
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={wordManager.inputValue}
            onChange={(e) => wordManager.setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && wordManager.addItem(showConfirmation)}
            placeholder="Type word to block..."
            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button 
            onClick={() => wordManager.addItem(showConfirmation)}
            className="px-4 py-2 bg-white text-primary rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
          >
            Add
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
          Quick Block Site
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={siteManager.inputValue}
            onChange={(e) => siteManager.setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && siteManager.addItem(showConfirmation)}
            placeholder="e.g., example.com"
            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button 
            onClick={() => siteManager.addItem(showConfirmation)}
            className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
          >
            Block
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-center">
          <div className="text-2xl font-bold">{stats.filterCount}</div>
          <div className="text-xs opacity-70">Total Blocked</div>
        </div>
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-center">
          <div className="text-2xl font-bold">
            {settings.blockedWords.length + settings.blockedSites.length}
          </div>
          <div className="text-xs opacity-70">Words + Sites</div>
        </div>
      </div>
    </div>
  );
};