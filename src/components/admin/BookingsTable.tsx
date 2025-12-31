import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SERVICES } from "../booking/service-data";
import type { BookingWithUser } from "../../types/admin";

interface BookingsTableProps {
  bookings: BookingWithUser[];
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<BookingWithUser>[]>(
    () => [
      {
        accessorKey: "session_date",
        header: "Date & Time",
        cell: ({ row }) => {
          const date = format(new Date(row.original.session_date), "MMM dd, yyyy");
          const time = row.original.session_time.slice(0, 5);
          return (
            <div>
              <p className="font-medium text-sm">{date}</p>
              <p className="text-xs text-gray-600">{time}</p>
            </div>
          );
        },
      },
      {
        id: "client",
        accessorFn: (row) => row.users?.name || "Unknown",
        header: "Client",
        cell: ({ row }) => {
          const user = row.original.users;
          if (!user) return <span className="text-gray-400">No client data</span>;
          return (
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "service_type",
        header: "Service",
        cell: ({ row }) => {
          const service = SERVICES[row.original.service_type];
          if (!service) return <span className="text-gray-400">Unknown</span>;
          return (
            <div>
              <p className="text-sm font-medium">{service.name}</p>
              <p className="text-xs text-gray-600">£{service.price}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variants: Record<string, "success" | "warning" | "info" | "error"> = {
            confirmed: "success",
            pending: "warning",
            completed: "info",
            cancelled: "error",
          };
          return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
        },
      },
      {
        accessorKey: "payment_status",
        header: "Payment",
        cell: ({ row }) => {
          const status = row.original.payment_status;
          const variants: Record<string, "success" | "warning" | "error" | "secondary"> = {
            paid: "success",
            pending: "warning",
            failed: "error",
            refunded: "secondary",
          };
          return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-gray-200">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search bookings..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left p-4 text-sm font-semibold text-gray-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-600">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            bookings.length
          )}{" "}
          of {bookings.length} results
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
