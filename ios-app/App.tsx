import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import RootNavigation from './src/navigation/RootNavigation';
import { AlertProvider } from './src/context/AlertContext';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function App() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <RootNavigation />
      </AlertProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

