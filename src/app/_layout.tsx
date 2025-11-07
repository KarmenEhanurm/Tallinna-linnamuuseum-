import "react-native-gesture-handler";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { WalletProvider } from "../context/wallet-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WalletProvider>
        <Tabs>
          <Tabs.Screen name="index" options={{ title: "Kodu" }} />
          <Tabs.Screen name="coin-flipper" options={{ title: "Viska Münti" }}/>
          <Tabs.Screen name="wallet" options={{ title: "Rahakott" }}/>
        </Tabs>
        </WalletProvider>
      </SafeAreaProvider>
      <Toast/>
    </GestureHandlerRootView>
  );
}
