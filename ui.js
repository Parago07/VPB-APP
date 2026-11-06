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
export function Avatar({ look }) {
  const palette = {
    h: "#493625",
    f: ["#dfaa7d", "#965d40", "#633f30", "#f4cdb0"][look.skin],
    s: ["#da704c", "#578167", "#556ab0", "#9e69a0"][look.shirt],
    p: ink,
    b: "#47392e",
    e: ink,
    m: look.hat === 1 ? "#747948" : "#23282a",
    g: "#e3ba52",
    x: "#586569",
  };
  const hair = [
    ["   hhhh", "  hhhhhh", "  hffffh"],
    ["  hh hh", "  hhhhhh", "  hffffh"],
    ["   hhhh", "  hhhhhh", "  hhfffh"],
  ][look.hair];
  const top =
    look.hat === 1
      ? ["        ", "   mmmm ", "  mmmgmm"]
      : look.hat === 2
        ? ["   mmmm ", "  mmmmmm", "  mmmmmm"]
        : ["", "", ""];
  const rows = [
    ...top,
    ...(look.hat ? ["  mmmmmm", "  hffffh", "  hffffh"] : hair),
    "  fefeff",
    "   ffff",
    "  ssssss",
    " fssssssf",
    " fssssssf",
    "   pppp",
    "   p  p",
    "  bb  bb",
  ];
  return (
    <View
      accessibilityLabel="Avatar em pixel art"
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "#e3e9d2",
        padding: 10,
        alignSelf: "flex-start",
      }}
    >
      <View>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", height: 4 }}>
            {row.split("").map((c, j) => (
              <View
                key={j}
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: palette[c] ?? "transparent",
                }}
              />
            ))}
          </View>
        ))}
      </View>
      {look.speaker && (
        <View
          style={{ marginLeft: 3, backgroundColor: ink, padding: 3, gap: 3 }}
        >
          {[0, 1].map((v) => (
            <View
              key={v}
              style={{
                width: 10,
                height: 10,
                borderWidth: 2,
                borderColor: "#98a2a0",
                backgroundColor: "#485254",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
