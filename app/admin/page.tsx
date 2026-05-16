"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ADMIN_TOKEN_COOKIE, apiFetch } from "@/lib/api";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Producer = {
  _id: string;
  name: string;
  email: string;
  producerType: string;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt: string;
};

type PendingAccountsResponse = {
  producer?: Producer[];
  producers?: Producer[];
};

type ProcessedProduct = {
  _id: string;
  masterProductId: string;
  productName: string;
  productCategory: string;
  totalQuantityProduced: number;
  quantityUnit: string;
  createdAt: string;
};

type HistoryItem = {
  _id: string;
  masterProductId: string;
  createdAt: string;
  [key: string]: unknown;
};

type ReportPhase = "SEEN" | "ON_INVESTIGATION" | "FIX";

type Report = {
  _id: string;
  reportId: string;
  title: string;
  consumerName: string;
  description: string;
  masterProductId: string;
  phase: ReportPhase;
  conclusion?: string | null;
  createdAt: string;
  phaseUpdatedAt?: string;
};

type AnalyticsRange = {
  from: string;
  to: string;
};

type MonthlyUsersPoint = {
  month: string;
  total: number;
  producer?: number;
  processor?: number;
  distributor?: number;
  warehouse?: number;
  retailer?: number;
};

type MonthlyProductsPoint = {
  month: string;
  added: number;
  removed: number;
  net: number;
  activeEndOfMonth?: number;
};

type MonthlyOverviewAnalyticsResponse = {
  users: {
    range: AnalyticsRange;
    points: MonthlyUsersPoint[];
    totals?: {
      total?: number;
      producer?: number;
      processor?: number;
      distributor?: number;
      warehouse?: number;
      retailer?: number;
    };
  };
  products: {
    range: AnalyticsRange;
    points: MonthlyProductsPoint[];
    totals?: {
      added?: number;
      removed?: number;
      net?: number;
    };
  };
};

function readCookie(name: string) {
  const pair = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return pair?.split("=")[1];
}

function fmt(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<Producer[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [products, setProducts] = useState<ProcessedProduct[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [distributorHistory, setDistributorHistory] = useState<HistoryItem[]>([]);
  const [warehouseHistory, setWarehouseHistory] = useState<HistoryItem[]>([]);
  const [retailerHistory, setRetailerHistory] = useState<HistoryItem[]>([]);
  const [masterProductId, setMasterProductId] = useState("");
  const [analytics, setAnalytics] = useState<MonthlyOverviewAnalyticsResponse | null>(null);
  const [analyticsFrom, setAnalyticsFrom] = useState("");
  const [analyticsTo, setAnalyticsTo] = useState("");

  const counts = useMemo(
    () => ({
      pending: pending.length,
      producers: producers.length,
      products: products.length,
      reports: reports.length,
      history: distributorHistory.length + warehouseHistory.length + retailerHistory.length,
    }),
    [
      pending.length,
      producers.length,
      products.length,
      reports.length,
      distributorHistory.length,
      warehouseHistory.length,
      retailerHistory.length,
    ],
  );

  const usersSeries = useMemo(() => analytics?.users.points ?? [], [analytics]);
  const productsSeries = useMemo(() => analytics?.products.points ?? [], [analytics]);
  const effectiveUsersTotal = analytics?.users.totals?.total ?? usersSeries.reduce((sum, p) => sum + p.total, 0);
  const effectiveAdded = analytics?.products.totals?.added ?? productsSeries.reduce((sum, p) => sum + p.added, 0);
  const effectiveRemoved = analytics?.products.totals?.removed ?? productsSeries.reduce((sum, p) => sum + p.removed, 0);

  async function loadAll(currentToken: string, range?: { from?: string; to?: string }) {
    setLoading(true);
    setError(null);

    try {
      const q = new URLSearchParams();
      if (range?.from) q.set("from", range.from);
      if (range?.to) q.set("to", range.to);
      const analyticsPath = `/admin/analytics/monthly/overview${q.toString() ? `?${q.toString()}` : ""}`;

      const [pendingData, producersData, productsData, reportData, distData, wareData, retailData, analyticsData] = await Promise.all([
        apiFetch<PendingAccountsResponse>("/admin/accounts/pending", undefined, currentToken),
        apiFetch<Producer[]>("/admin/producers", undefined, currentToken),
        apiFetch<ProcessedProduct[]>("/admin/products", undefined, currentToken),
        apiFetch<Report[]>("/reports/admin/all", undefined, currentToken),
        apiFetch<HistoryItem[]>("/distributor/history", undefined, currentToken).catch(() => []),
        apiFetch<HistoryItem[]>("/warehouse/history", undefined, currentToken).catch(() => []),
        apiFetch<HistoryItem[]>("/retailer/history", undefined, currentToken).catch(() => []),
        apiFetch<MonthlyOverviewAnalyticsResponse>(analyticsPath, undefined, currentToken).catch(() => null),
      ]);

      setPending(Array.isArray(pendingData) ? pendingData : pendingData.producer ?? pendingData.producers ?? []);
      setProducers(producersData);
      setProducts(productsData);
      setReports(reportData);
      setDistributorHistory(distData);
      setWarehouseHistory(wareData);
      setRetailerHistory(retailData);
      setAnalytics(analyticsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function verifyProducer(producerId: string) {
    if (!token) return;
    await apiFetch<Producer>(`/admin/accounts/producer/${producerId}/verify`, { method: "PATCH" }, token);
    await loadAll(token);
  }

  async function updateReportPhase(reportId: string, phase: ReportPhase) {
    if (!token) return;
    await apiFetch<Report>(`/reports/admin/${reportId}/phase`, {
      method: "PATCH",
      body: JSON.stringify({ phase }),
    }, token);
    await loadAll(token);
  }

  async function updateReportConclusion(reportId: string, conclusion: string) {
    if (!token) return;
    await apiFetch<Report>(`/reports/admin/${reportId}/conclusion`, {
      method: "PATCH",
      body: JSON.stringify({ conclusion }),
    }, token);
    await loadAll(token);
  }

  async function refreshAnalytics() {
    if (!token) return;
    await loadAll(token, { from: analyticsFrom || undefined, to: analyticsTo || undefined });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const cookieToken = readCookie(ADMIN_TOKEN_COOKIE);
      setToken(cookieToken);
      setError(cookieToken ? null : "Missing admin token. Please login again.");
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || !token) return;
    const timer = setTimeout(() => {
      void loadAll(token);
    }, 0);

    return () => clearTimeout(timer);
  }, [isReady, token]);

  if (!isReady) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-orange-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-orange-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Room</h1>
            <p className="text-muted-foreground">Manage producers, products, reports, and full movement history.</p>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <Input
              placeholder="Enter master product ID"
              value={masterProductId}
              onChange={(event) => setMasterProductId(event.target.value)}
            />
            <Link
              className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium ${
                masterProductId.trim()
                  ? "bg-primary text-primary-foreground"
                  : "pointer-events-none bg-muted text-muted-foreground"
              }`}
              href={`/${masterProductId.trim()}`}
            >
              Open Traceability
            </Link>
            <Link className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium" href="/admin/entities">
              Entities
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Pending Verification" value={counts.pending} />
          <MetricCard label="Producers" value={counts.producers} />
          <MetricCard label="Products" value={counts.products} />
          <MetricCard label="Reports" value={counts.reports} />
          <MetricCard label="History Events" value={counts.history} />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="verification" className="w-full">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="users-products">Users & Products</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Analytics Filters</CardTitle>
                  <CardDescription>Load monthly users and products overview from admin analytics APIs.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input type="date" value={analyticsFrom} onChange={(e) => setAnalyticsFrom(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input type="date" value={analyticsTo} onChange={(e) => setAnalyticsTo(e.target.value)} />
                  </div>
                  <Button onClick={() => void refreshAnalytics()} disabled={loading}>
                    {loading ? "Loading..." : "Refresh Analytics"}
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="New Users" value={effectiveUsersTotal} />
                <MetricCard label="Products Added" value={effectiveAdded} />
                <MetricCard label="Products Removed" value={effectiveRemoved} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-emerald-200/80 bg-white/90">
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>Monthly registrations across all entities.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={usersSeries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-amber-200/80 bg-white/90">
                  <CardHeader>
                    <CardTitle>Product Flow Trend</CardTitle>
                    <CardDescription>Monthly added vs removed products.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productsSeries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="added" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="removed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <DataCard title="Monthly New Users" description="From /admin/analytics/monthly/overview">
                  <MonthlyUsersTable data={usersSeries} loading={loading} />
                </DataCard>
                <DataCard title="Monthly Product Activity" description="Added / removed / net by month">
                  <MonthlyProductsTable data={productsSeries} loading={loading} />
                </DataCard>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <DataCard title="Pending Producers" description="Review and verify producer onboarding requests.">
              <ProducerTable data={pending} loading={loading} onVerify={verifyProducer} showVerifyAction />
            </DataCard>
          </TabsContent>

          <TabsContent value="users-products">
            <div className="grid gap-6 lg:grid-cols-2">
              <DataCard title="All Producers" description="Complete producer records and verification states.">
                <ProducerTable data={producers} loading={loading} />
              </DataCard>
              <DataCard title="Processed Products" description="Master products generated by processors.">
                <ProductTable data={products} loading={loading} />
              </DataCard>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <DataCard title="Consumer Reports" description="Review all reports and update investigation details.">
              <ReportsTable
                data={reports}
                loading={loading}
                onPhaseChange={updateReportPhase}
                onConclusionSave={updateReportConclusion}
              />
            </DataCard>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid gap-6 lg:grid-cols-3">
              <DataCard title="Distributor" description="Dispatch and receipt logs for both legs.">
                <HistoryTable data={distributorHistory} loading={loading} />
              </DataCard>
              <DataCard title="Warehouse" description="Warehouse handling timeline.">
                <HistoryTable data={warehouseHistory} loading={loading} />
              </DataCard>
              <DataCard title="Retailer" description="Store receiving checkpoints.">
                <HistoryTable data={retailerHistory} loading={loading} />
              </DataCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function MonthlyUsersTable({ data, loading }: { data: MonthlyUsersPoint[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No monthly user analytics found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Month</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Producer</TableHead>
          <TableHead>Processor</TableHead>
          <TableHead>Distributor</TableHead>
          <TableHead>Warehouse</TableHead>
          <TableHead>Retailer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.month}>
            <TableCell>{row.month}</TableCell>
            <TableCell>{row.total}</TableCell>
            <TableCell>{row.producer ?? 0}</TableCell>
            <TableCell>{row.processor ?? 0}</TableCell>
            <TableCell>{row.distributor ?? 0}</TableCell>
            <TableCell>{row.warehouse ?? 0}</TableCell>
            <TableCell>{row.retailer ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MonthlyProductsTable({ data, loading }: { data: MonthlyProductsPoint[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No monthly product analytics found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Month</TableHead>
          <TableHead>Added</TableHead>
          <TableHead>Removed</TableHead>
          <TableHead>Net</TableHead>
          <TableHead>Active EOM</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.month}>
            <TableCell>{row.month}</TableCell>
            <TableCell>{row.added}</TableCell>
            <TableCell>{row.removed}</TableCell>
            <TableCell>{row.net}</TableCell>
            <TableCell>{row.activeEndOfMonth ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DataCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[460px]">{children}</ScrollArea>
      </CardContent>
    </Card>
  );
}

function ProducerTable({
  data,
  loading,
  onVerify,
  showVerifyAction,
}: {
  data: Producer[];
  loading: boolean;
  onVerify?: (producerId: string) => Promise<void>;
  showVerifyAction?: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No records found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          {showVerifyAction ? <TableHead>Action</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item._id}>
            <TableCell>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.email}</div>
            </TableCell>
            <TableCell>{item.producerType}</TableCell>
            <TableCell>
              <Badge variant={item.isVerified ? "default" : "secondary"}>{item.isVerified ? "Verified" : "Pending"}</Badge>
            </TableCell>
            <TableCell>{fmt(item.createdAt)}</TableCell>
            {showVerifyAction ? (
              <TableCell>
                <Button size="sm" onClick={() => onVerify?.(item._id)}>
                  Verify
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ProductTable({ data, loading }: { data: ProcessedProduct[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No records found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Master ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Qty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item._id}>
            <TableCell className="font-mono text-xs">{item.masterProductId}</TableCell>
            <TableCell>{item.productName}</TableCell>
            <TableCell>{item.productCategory}</TableCell>
            <TableCell>
              {item.totalQuantityProduced} {item.quantityUnit}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReportsTable({
  data,
  loading,
  onPhaseChange,
  onConclusionSave,
}: {
  data: Report[];
  loading: boolean;
  onPhaseChange: (reportId: string, phase: ReportPhase) => Promise<void>;
  onConclusionSave: (reportId: string, conclusion: string) => Promise<void>;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [conclusions, setConclusions] = useState<Record<string, string>>({});

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No reports found.</p>;

  async function handlePhaseChange(reportId: string, phase: ReportPhase) {
    setUpdatingId(reportId);
    try {
      await onPhaseChange(reportId, phase);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConclusionSave(reportId: string) {
    const conclusion = conclusions[reportId]?.trim();
    if (!conclusion) return;

    setUpdatingId(reportId);
    try {
      await onConclusionSave(reportId, conclusion);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Report</TableHead>
          <TableHead>Master Product</TableHead>
          <TableHead>Phase</TableHead>
          <TableHead>Conclusion</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item._id}>
            <TableCell>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">ID: {item.reportId}</div>
              <div className="text-xs text-muted-foreground">By: {item.consumerName}</div>
            </TableCell>
            <TableCell className="font-mono text-xs">{item.masterProductId}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                  value={item.phase}
                  onChange={(e) => void handlePhaseChange(item.reportId, e.target.value as ReportPhase)}
                  disabled={updatingId === item.reportId}
                >
                  <option value="SEEN">SEEN</option>
                  <option value="ON_INVESTIGATION">ON_INVESTIGATION</option>
                  <option value="FIX">FIX</option>
                </select>
                <Badge variant="outline">{item.phase}</Badge>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-56 items-center gap-2">
                <Input
                  placeholder={item.conclusion ?? "Add conclusion"}
                  value={conclusions[item.reportId] ?? ""}
                  onChange={(e) =>
                    setConclusions((prev) => ({
                      ...prev,
                      [item.reportId]: e.target.value,
                    }))
                  }
                />
                <Button
                  size="sm"
                  onClick={() => void handleConclusionSave(item.reportId)}
                  disabled={updatingId === item.reportId || !(conclusions[item.reportId] ?? "").trim()}
                >
                  Save
                </Button>
              </div>
            </TableCell>
            <TableCell>{fmt(item.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HistoryTable({ data, loading }: { data: HistoryItem[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No records found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Master ID</TableHead>
          <TableHead>Event Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item._id}>
            <TableCell className="font-mono text-xs">{item.masterProductId}</TableCell>
            <TableCell>{fmt(item.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
