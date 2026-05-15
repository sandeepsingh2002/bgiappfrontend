import { TraceabilityView } from "@/components/traceability-view";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SAMPLE_MASTER_PRODUCT_ID, sampleTraceabilityData } from "@/lib/sample-traceability";

type TraceabilityPageProps = {
  params: Promise<{ masterProductId: string }>;
};

export default async function TraceabilityPage({ params }: TraceabilityPageProps) {
  const { masterProductId } = await params;
  if (masterProductId !== SAMPLE_MASTER_PRODUCT_ID) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle>Sample Route Available</CardTitle>
              <CardDescription>
                This page is hardcoded for <span className="font-mono">{SAMPLE_MASTER_PRODUCT_ID}</span>. Open that ID
                to view complete details.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return <TraceabilityView data={sampleTraceabilityData} />;
}
