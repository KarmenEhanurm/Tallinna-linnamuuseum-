import "react-native-gesture-handler";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Tabs>
          <Tabs.Screen name="index" options={{ title: "Kodu" }} />
          <Tabs.Screen name="coin-flipper" options={{ title: "Viska Münti" }}/>
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
