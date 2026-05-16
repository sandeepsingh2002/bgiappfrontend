import { TraceabilityView } from "@/components/traceability-view";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type TraceabilityPageProps = {
  params: Promise<{ masterProductId: string }>;
};

export default async function TraceabilityPage({ params }: TraceabilityPageProps) {
  const { masterProductId } = await params;
  let data: unknown;

  try {
    data = await apiFetch<unknown>(`/public/traceability/${encodeURIComponent(masterProductId)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load traceability details.";

    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle>Traceability Not Available</CardTitle>
              <CardDescription>
                Could not load traceability data for <span className="font-mono">{masterProductId}</span>.
                <br />
                {message}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return <TraceabilityView data={data} />;
}
