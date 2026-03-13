import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigation from './src/navigation/RootNavigation';
import { AlertProvider } from './src/context/AlertContext';
import { WatchedLocationsProvider } from './src/context/WatchedLocationsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <WatchedLocationsProvider>
        <AlertProvider>
          <RootNavigation />
        </AlertProvider>
      </WatchedLocationsProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

