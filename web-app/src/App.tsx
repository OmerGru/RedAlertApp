import { useState } from 'react';
import { Shield, Map, Clock, Settings } from 'lucide-react';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { t } from './utils/i18n';
import './index.css';

type TabId = 'home' | 'map' | 'history' | 'settings';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof Shield;
}

const TABS: TabConfig[] = [
  { id: 'home', label: t('tabs.home'), icon: Shield },
  { id: 'map', label: t('tabs.map'), icon: Map },
  { id: 'history', label: t('tabs.history'), icon: Clock },
  { id: 'settings', label: t('tabs.settings'), icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage />;
      case 'map': return <MapPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="app-container">
      <main className="app-content">
        {renderPage()}
      </main>

      <nav className="app-tab-bar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`app-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={22} />
            <span className="app-tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
