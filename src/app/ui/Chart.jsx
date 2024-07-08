import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
} from "recharts";
import { format } from "date-fns";

function formatXAxis(tickItem) {
  // If using moment.js
  return format(tickItem, "M/d h:mm aa");
}
//00798c
export default function Chart({ data }) {
  return (
    <ResponsiveContainer height={500}>
      <ComposedChart data={data}>
        <CartesianGrid />
        <Tooltip />
        <Line
          stroke="#E63946"
          strokeWidth={1}
          dataKey="dispavgVpv"
          dot={false}
          yAxisId="leftY"
        />
        <Line
          stroke="#EDAE49"
          strokeWidth={1}
          dataKey="dispavgVbatt"
          dot={false}
          yAxisId="rightY"
        />
        <Line
          stroke="#3376BD"
          strokeWidth={1}
          dataKey="watts"
          dot={false}
          yAxisId="leftY"
        />
        {/* <Line stroke="#00798c" strokeWidth={1} dataKey="batteryState" dot={false} yAxisId="rightY" /> */}
        <Legend />
        <Area
          stroke="#52489c"
          fill="#52489c"
          dataKey="AmpHours"
          yAxisId="leftY"
        />
        <XAxis
          dataKey="_time"
          tickFormatter={formatXAxis}
          angle={45}
          textAnchor="{end}"
          height={100}
        />
        <YAxis orientation="left" yAxisId="leftY" />
        <YAxis orientation="right" yAxisId="rightY" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
