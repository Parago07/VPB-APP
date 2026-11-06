import React from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
export const ink = "#202a23",
  paper = "#f8f7ed",
  green = "#d9fc78",
  muted = "#576353",
  line = "#d3d7c7";
export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: paper },
  wrap: {
    width: "100%",
    maxWidth: 740,
    alignSelf: "center",
    padding: 16,
    gap: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  spread: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  heading: { fontSize: 30, fontWeight: "900", letterSpacing: -1.4, color: ink },
  body: { fontSize: 16, color: ink },
  label: { fontFamily: mono, fontSize: 12, fontWeight: "bold", color: muted },
  box: {
    backgroundColor: "#fffef8",
    padding: 14,
    borderWidth: 1,
    borderColor: line,
    gap: 10,
  },
  input: {
    borderColor: line,
    borderWidth: 1,
    padding: 12,
    color: ink,
    backgroundColor: "white",
    fontSize: 16,
  },
});
export function Button({
  children,
  onPress,
  active = false,
  dark = false,
  label,
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: dark ? ink : active ? green : "#fffef8",
        borderWidth: 1,
        borderColor: ink,
        paddingHorizontal: 11,
        paddingVertical: 10,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontWeight: "700", color: dark ? green : ink }}>
        {children}
      </Text>
    </Pressable>
  );
}
export function Field({
  name,
  value,
  onChangeText,
  placeholder,
  maxLength = 160,
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.label}>{name}</Text>
      <TextInput
        accessibilityLabel={name}
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        maxLength={maxLength}
      />
    </View>
  );
}
export { Avatar } from "./Avatar";
