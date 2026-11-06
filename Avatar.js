import React from "react";
import { View } from "react-native";

// Every character is one square on the same grid. Dots expose the layer below.
const body = [
  "......oooooooo....",
  ".....osfffffffo...",
  "....osffllllffso..",
  "....osfllllllfso..",
  "...osffhhffhhffso.",
  "...osffweffweffso.",
  "...osffweffweffso.",
  "....osfffssfffso..",
  ".....osfflfssso...",
  "......osfhhfso....",
  ".......osssso.....",
  ".....oottsssttoo..",
  "....otccttttcccto.",
  "...otccLLLLcccctto",
  "..otccLccccccctcto",
  "..otctccccccLctcto",
  "..osfotccccctctfso",
  "..oflotcccccctofso",
  "..osfotcctttttofso",
  "...ooottccctttooo.",
  ".....oddppppddo...",
  ".....opPppopPpo...",
  ".....opPpdoPppo...",
  ".....opPdo.oppo...",
  ".....oppdo.opdo...",
  ".....oddpo.opdo...",
  "....ohHHho.ohHHo..",
  "...ohhhHho.ohhHho.",
  "...owwwwoo.oowwwo.",
];
const haircuts = [
  [
    "......oooooo",
    "....oohHHhhhoo",
    "...ohHHHHhhhhhho",
    "...ohhHHhhhhhhho",
    "...ohhhhhooohhho",
    "....ohho.....oho",
  ],
  [
    ".....o....o",
    "....oHo..oHo..o",
    "...ohHHooHhHooHo",
    "..ohHHHhhhhhhHho",
    "...ohhhhhhhhhho",
    "....ohhoo..ohho",
  ],
  [
    ".......oooooo",
    ".....oohHHHHhoo",
    "....ohHHHhhhhhho",
    "...ohHHHhhhhhHho",
    "...ohHhhhhhhhoho",
    "...ohhhhhhhoo.oo",
    "....ohhhhoo",
    "....ohhoo",
  ],
];
const caps = [
  [],
  [
    "......ooooooo",
    "....ooaaaAAAaoo",
    "...oaAAAaaaaaBao",
    "..oaAAaaaraaaBBo",
    "..oaaaaarrraBBBo",
    "...oBBBBBrBBBooo",
    "....ooaaaaaBBBBoo",
    ".......ooooooo",
  ],
  [
    "......ooooooo",
    "....ooqqQQqqqoo",
    "...oqQqQqqqQqqqo",
    "..oQqqQQqqQqqqqqo",
    "..oqqQqqQqqQqqqqo",
    "..oqQqqQqqQqqQqqo",
    "..oqqQqqqQqqqqqqo",
    "..oqQqqQqqqQqqqqo",
    "..oqqQqqqQqqQqqqo",
    "..oqqqqQqqQqqqqqo",
    "...oqqqqqqqqqqqo",
    "....ooooooooooo",
  ],
];
const cabinet = [
  "....ooooooo",
  "...oxxxxxxxo",
  "...oxoooooxo",
  ".ooooooooooooo",
  "oxXXXXXXXXXXxxo",
  "oxggoGGGGorrxxo",
  "oxxxxxxxxxxxxxo",
  "oxooooxxxooooxo",
  "oxoXxoxxxoXxoxo",
  "oxooooxxxooooxo",
  "oxxxxxxxxxxxxxo",
  "oxxxxoooooxxxxo",
  "oxxooxXXXxooxxo",
  "oxoxXxxxxxXxoxo",
  "oxoxxxXXXxxxoxo",
  "oxoxxXoooXxxoxo",
  "oxoxxXoooXxxoxo",
  "oxoxxxXXXxxxoxo",
  "oxoxXxxxxxXxoxo",
  "oxxooxXXXxooxxo",
  "oxxxxoooooxxxxo",
  "oxXXXXXXXXXXxxo",
  ".ooooooooooooo",
];
const skin = [
  ["#dfa279", "#a96851", "#f5c497"],
  ["#aa7050", "#754637", "#cc936c"],
  ["#795041", "#51352f", "#a77558"],
  ["#f1bea0", "#c58a74", "#ffdbb9"],
];
const shirt = [
  ["#ce674d", "#8c463e", "#ef9671"],
  ["#598c72", "#355c50", "#87b18c"],
  ["#577db2", "#384c78", "#8eaad6"],
  ["#a778a6", "#704c79", "#d3a3ce"],
];

function layer(grid, rows, x, y) {
  rows.forEach((row, dy) =>
    [...row].forEach((color, dx) => {
      if (color !== ".") grid[y + dy][x + dx] = color;
    }),
  );
}

export function Avatar({ look, large = false, compact = false }) {
  const pixel = compact ? 1.5 : large ? 5 : 4;
  const width = look.speaker ? 37 : 22;
  const grid = Array.from({ length: 42 }, () => Array(width).fill("."));
  const [f, s, l] = skin[look.skin] ?? skin[0];
  const [c, t, L] = shirt[look.shirt] ?? shirt[0];
  const colors = {
    f,
    s,
    l,
    c,
    t,
    L,
    o: "#29272e",
    h: "#503a38",
    H: "#865847",
    w: "#faf1db",
    e: "#252632",
    d: "#303949",
    p: "#495569",
    P: "#62738b",
    a: "#758157",
    A: "#9ca574",
    B: "#505b45",
    r: "#c85449",
    q: "#333341",
    Q: "#4b4959",
    x: "#49545a",
    X: "#778786",
    g: "#f3bb63",
    G: "#98bd97",
  };
  layer(grid, body, 1, 12);
  layer(grid, haircuts[look.hair] ?? haircuts[0], 1, 9);
  // Adapted from DiceBear Pixel Art light02 / dark03 (CC0), aligned to VPB eyes.
  if (look.glasses === 1)
    layer(grid, ["eeeeeeeeeeee", ".e...ee...e.", ".eeee..eeee."], 5, 16);
  if (look.glasses === 2)
    layer(grid, ["eeeeeeeeeeee", ".eQQqqqqQQe.", ".eeeeeeeeee."], 5, 16);
  if (look.hat) layer(grid, caps[look.hat], 1, look.hat === 2 ? 2 : 7);
  if (look.speaker) layer(grid, cabinet, 22, 18);
  const runs = [];
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const start = x,
        color = row[x++];
      while (x < row.length && row[x] === color) x++;
      if (color !== ".")
        runs.push(
          <View
            key={y + "-" + start}
            style={{
              position: "absolute",
              left: start * pixel,
              top: y * pixel,
              width: (x - start) * pixel,
              height: pixel,
              backgroundColor: colors[color],
            }}
          />,
        );
    }
  });
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        "Avatar em pixel art" +
        (["", ", com quepe Mao Tsé-Tung", ", com chapéu da Guarda Real"][
          look.hat
        ] ?? "") +
        (look.speaker ? " e Balthinha" : "")
      }
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#e3e9d2",
        alignSelf: "center",
      }}
    >
      <View
        style={{
          width: width * pixel,
          height: grid.length * pixel,
          borderBottomWidth: pixel,
          borderColor: "#bac6af",
        }}
      >
        {runs}
      </View>
    </View>
  );
}
