import { Card } from "../ui/card";

interface PaymentStatsProps {
  stats: {
    totalRevenue: number;
    paidCount: number;
    refundedCount: number;
    failedCount: number;
  };
}

export default function PaymentStats({ stats }: PaymentStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="p-6">
        <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
        <p className="text-3xl font-bold text-black mt-2">
          £{stats.totalRevenue.toLocaleString()}
        </p>
        <p className="text-xs text-green-600 mt-1">All time</p>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-gray-600 font-medium">Paid</p>
        <p className="text-3xl font-bold text-green-600 mt-2">{stats.paidCount}</p>
        <p className="text-xs text-gray-500 mt-1">Successful payments</p>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-gray-600 font-medium">Refunded</p>
        <p className="text-3xl font-bold text-yellow-600 mt-2">
          {stats.refundedCount}
        </p>
        <p className="text-xs text-gray-500 mt-1">Refunded transactions</p>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-gray-600 font-medium">Failed</p>
        <p className="text-3xl font-bold text-red-600 mt-2">{stats.failedCount}</p>
        <p className="text-xs text-gray-500 mt-1">Failed payments</p>
      </Card>
    </div>
  );
}
