import { Card } from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import type { ChartDataPoint } from "../../types/admin";

interface RevenueChartProps {
  data: ChartDataPoint[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM dd"),
  }));

  return (
    <Card className="p-5 border-2 border-gray-200/50 hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Revenue Trend (Last 30 Days)
      </h3>
      {formattedData.length > 0 ? (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis
                dataKey="formattedDate"
                stroke="#9ca3af"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => `£${value}`}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`£${value || 0}`, "Revenue"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "2px solid #D4AF37",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ fill: "#D4AF37", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, stroke: "#D4AF37", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[240px] flex items-center justify-center text-gray-500">
          <p className="text-sm font-medium">No revenue data available for the last 30 days</p>
        </div>
      )}
    </Card>
  );
}
