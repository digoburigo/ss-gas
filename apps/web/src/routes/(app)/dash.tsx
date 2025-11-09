import { createFileRoute } from "@tanstack/react-router";

import { ChartAreaInteractive } from "~/components/dash/chart-area-interactive";
import { DataTable } from "~/components/dash/data-table";
import { SectionCards } from "~/components/dash/section-cards";

// Sample data for the DataTable - replace with actual data from your API
const sampleData = [
  {
    id: 1,
    header: "Introduction",
    type: "Text",
    status: "Done",
    target: "All",
    limit: "1000",
    reviewer: "John Doe",
  },
  {
    id: 2,
    header: "Methodology",
    type: "Text",
    status: "In Progress",
    target: "All",
    limit: "2000",
    reviewer: "Jane Smith",
  },
];

export const Route = createFileRoute("/(app)/dash")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={sampleData} />
    </div>
  );
}
