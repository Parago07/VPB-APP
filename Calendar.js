import React from "react";
import { View, Text, Pressable } from "react-native";
import { s, Button, Avatar, ink, green, line, mono } from "./ui";
import {
  dateKey,
  displayDate,
  defaultLook,
} from "./supabase/functions/_shared/domain.mjs";
import { specialDays } from "./supabase/functions/_shared/holidays.mjs";
export const holidayTint = "#fde9c8",
  holidayInk = "#7a4310";
const weekdays = "Domingo Segunda Terça Quarta Quinta Sexta Sábado".split(" ");
const months =
  "Janeiro Fevereiro Março Abril Maio Junho Julho Agosto Setembro Outubro Novembro Dezembro".split(
    " ",
  );
export default function Calendar({
  month,
  change,
  day,
  select,
  events,
  birthdays,
  looks = {},
  open,
  create,
  signal,
}) {
  const year = month.getFullYear(),
    m = month.getMonth();
  const start = new Date(year, m, 1).getDay(),
    days = new Date(year, m + 1, 0).getDate();
  const today = dateKey(new Date());
  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const chosen = sorted.filter((e) => e.date === day);
  const special = specialDays(year, birthdays ?? {}),
    marked = specialDays(Number(day.slice(0, 4)), birthdays ?? {}).filter(
      (x) => x.date === day,
    );
  return (
    <>
      <View style={s.spread}>
        <View>
          <Text style={s.label}>CALENDÁRIO · {year}</Text>
          <Text style={s.heading}>{months[m]}</Text>
        </View>
        <View style={s.row}>
          <Button label="Mês anterior" onPress={() => change(-1)}>
            ‹
          </Button>
          <Button label="Próximo mês" onPress={() => change(1)}>
            ›
          </Button>
        </View>
      </View>
      <View
        style={{ borderTopWidth: 1, borderLeftWidth: 1, borderColor: line }}
      >
        <View style={{ flexDirection: "row", backgroundColor: ink }}>
          {["D", "S", "T", "Q", "Q", "S", "S"].map((v, i) => (
            <Text
              key={i}
              style={{
                flex: 1,
                color: green,
                paddingVertical: 7,
                textAlign: "center",
                fontFamily: mono,
              }}
            >
              {v}
            </Text>
          ))}
        </View>
        {Array.from({ length: Math.ceil((start + days) / 7) }, (_, week) => (
          <View key={week} style={{ flexDirection: "row" }}>
            {Array.from({ length: 7 }, (_, w) => {
              const d = week * 7 + w - start + 1,
                valid = d > 0 && d <= days,
                key = dateKey(new Date(year, m, d));
              const entries = valid ? sorted.filter((e) => e.date === key) : [];
              const marks = valid ? special.filter((x) => x.date === key) : [],
                holiday = marks.find((x) => x.type === "holiday"),
                cakes = marks.filter((x) => x.type === "birthday");
              return (
                <Pressable
                  key={w}
                  disabled={!valid}
                  accessibilityRole="button"
                  accessibilityLabel={
                    valid
                      ? [
                          displayDate(key),
                          ...marks.map((x) =>
                            x.type === "holiday"
                              ? x.name
                              : "aniversário de " + x.name,
                          ),
                          entries.length
                            ? entries.length +
                              (entries.length > 1 ? " rolés" : " rolé")
                            : "",
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : undefined
                  }
                  onPress={() => select(key)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 74,
                    padding: 3,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: line,
                    backgroundColor:
                      valid && key === day
                        ? green
                        : holiday
                          ? holidayTint
                          : valid
                            ? "#fffef8"
                            : "#eff0e5",
                  }}
                >
                  {valid && (
                    <View style={[s.spread, { gap: 2 }]}>
                      <Text
                        style={{
                          fontWeight: key === today ? "900" : "600",
                          color: ink,
                          fontSize: 14,
                        }}
                      >
                        {d}
                        {key === today ? "·" : ""}
                      </Text>
                      {!!cakes.length && (
                        <Text style={{ fontSize: 11, color: ink }}>
                          🎂{cakes.length > 1 ? cakes.length : ""}
                        </Text>
                      )}
                    </View>
                  )}
                  {!!holiday && (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: holidayInk,
                      }}
                    >
                      {holiday.name}
                    </Text>
                  )}
                  {!!entries.length && (
                    <>
                      <View style={[s.spread, { gap: 2 }]}>
                        <Text
                          style={{
                            fontSize: 10,
                            color: ink,
                            fontFamily: mono,
                          }}
                        >
                          {entries[0].time}
                        </Text>
                        {entries.length > 1 && (
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "bold",
                              color: ink,
                            }}
                          >
                            +{entries.length - 1}
                          </Text>
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 10, color: ink }}
                      >
                        {entries[0].title}
                      </Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={s.row}>
        <Button dark onPress={create}>
          + Publicar rolé
        </Button>
        <Button active onPress={signal}>
          ϟ Soltar batsinal
        </Button>
      </View>
      <Text style={s.label}>
        {weekdays[new Date(day + "T12:00:00").getDay()].toUpperCase()} ·{" "}
        {displayDate(day)}
      </Text>
      {marked.map((x) =>
        x.type === "holiday" ? (
          <View
            key={x.type + x.name}
            style={[s.box, { backgroundColor: holidayTint }]}
          >
            <Text style={[s.label, { color: holidayInk }]}>
              {x.kind.toUpperCase()}
            </Text>
            <Text style={{ fontWeight: "800", fontSize: 20, color: ink }}>
              {x.name}
            </Text>
          </View>
        ) : (
          <View key={x.type + x.name} style={[s.box, s.row]}>
            <Avatar compact look={looks[x.name] ?? defaultLook} />
            <View style={{ gap: 4 }}>
              <Text style={s.label}>ANIVERSÁRIO</Text>
              <Text style={{ fontWeight: "800", fontSize: 20, color: ink }}>
                🎂 {x.name}
              </Text>
            </View>
          </View>
        ),
      )}
      {chosen.length === 0 && (
        <Text style={s.body}>Nenhum rolé neste dia.</Text>
      )}
      {chosen.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          onPress={() => open(e.id)}
          style={s.box}
        >
          <Text style={s.label}>
            {e.time} · {e.status}
          </Text>
          <Text style={{ fontWeight: "800", fontSize: 20, color: ink }}>
            {e.title}
          </Text>
          {!!e.location && <Text>{e.location}</Text>}
        </Pressable>
      ))}
    </>
  );
}
