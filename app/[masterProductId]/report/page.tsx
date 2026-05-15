import Link from "next/link";
import { CreateReportSection } from "@/components/create-report-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportPageProps = {
  params: Promise<{ masterProductId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { masterProductId } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-amber-200/80 bg-white/85 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Consumer Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Reporting for Master Product ID: <span className="font-mono">{masterProductId}</span>
            </p>
            <Link
              href={`/${masterProductId}`}
              className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              Back to Traceability Page
            </Link>
          </CardContent>
        </Card>

        <CreateReportSection masterProductId={masterProductId} />
      </div>
    </main>
  );
}
