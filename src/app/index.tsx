import { HeaderTitle } from "@react-navigation/elements";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{
      flex: 1
    }}>
      <HeaderTitle style={{textAlign: "center", marginTop: 10, fontSize: 32}}>Tere tulemast 👋</HeaderTitle>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>
          Tere tulemast Tallinna linnamuuseumi mündirakendusse!
          Siin saad digitaalselt koguda kõikvõimalikke ajaloolisi münte ning neid visata 🎉
        </Text>
      </View>
    </View>
  );
}
