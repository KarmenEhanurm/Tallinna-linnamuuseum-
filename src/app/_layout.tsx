import "react-native-gesture-handler";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Tabs>
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="flipper" options={{ title: "flipper" }} />
          <Tabs.Screen name="flipper-bet" options={{ title: "flipper-bet" }} />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
