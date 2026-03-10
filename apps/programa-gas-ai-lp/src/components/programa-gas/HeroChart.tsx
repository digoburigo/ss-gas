import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
} from "recharts";

const data = [
  { mes: "Out", programado: 82, realizado: 78, desvio: 12 },
  { mes: "Nov", programado: 88, realizado: 85, desvio: 8 },
  { mes: "Dez", programado: 75, realizado: 72, desvio: 15 },
  { mes: "Jan", programado: 91, realizado: 90, desvio: 5 },
  { mes: "Fev", programado: 86, realizado: 87, desvio: 6 },
  { mes: "Mar", programado: 94, realizado: 95, desvio: 3 },
];

const renderLegend = () => (
  <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
    {[
      { color: "#1A56DB", label: "Programado" },
      { color: "rgba(91,184,212,0.8)", label: "Realizado" },
      { color: "rgba(255,255,255,0.15)", label: "Desvio" },
    ].map((item) => (
      <span
        key={item.label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 2,
            background: item.color,
            flexShrink: 0,
          }}
        />
        {item.label}
      </span>
    ))}
  </div>
);

export default function HeroChart() {
  return (
    <div style={{ width: "100%", height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="25%"
          barGap={2}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="0"
          />
          <XAxis
            dataKey="mes"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="programado"
            fill="#1A56DB"
            radius={[3, 3, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="realizado"
            fill="rgba(91,184,212,0.8)"
            radius={[3, 3, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
            animationBegin={200}
          />
          <Bar
            dataKey="desvio"
            fill="rgba(255,255,255,0.15)"
            radius={[3, 3, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
            animationBegin={400}
          />
        </BarChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}
