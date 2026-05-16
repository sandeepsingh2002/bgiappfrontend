"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_TOKEN_COOKIE, apiFetch } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type EntityType = "producer" | "processor" | "distributor" | "warehouse" | "retailer";

type Producer = {
  _id: string;
  name: string;
  email: string;
  producerType: string;
  isVerified: boolean;
  createdAt: string;
};

type Processor = {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  isVerified?: boolean;
};

type Distributor = {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  isVerified?: boolean;
};

type Warehouse = {
  _id: string;
  name: string;
  email: string;
  warehouseName?: string;
  isVerified?: boolean;
};

type Retailer = {
  _id: string;
  name: string;
  email: string;
  storeName?: string;
  isVerified?: boolean;
};

type ProcessedProduct = {
  _id: string;
  masterProductId: string;
  processorId?: string;
  productName: string;
  createdAt: string;
};

type HistoryItem = {
  _id: string;
  masterProductId: string;
  distributorId?: string;
  warehouseId?: string;
  retailerId?: string;
  createdAt?: string;
  receivedAt?: string;
  dispatchedAt?: string;
};

function readCookie(name: string) {
  const pair = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return pair?.split("=")[1];
}

function fmt(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function AdminEntitiesPage() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<EntityType>("producer");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [producers, setProducers] = useState<Producer[]>([]);
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);

  const [products, setProducts] = useState<ProcessedProduct[]>([]);
  const [distHistory, setDistHistory] = useState<HistoryItem[]>([]);
  const [warehouseHistory, setWarehouseHistory] = useState<HistoryItem[]>([]);
  const [retailerHistory, setRetailerHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const t = readCookie(ADMIN_TOKEN_COOKIE);
      setToken(t);
      setError(t ? null : "Missing admin token. Please login again.");
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const load = useCallback(async (currentToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const [producerList, pendingProcessors, pendingDistributors, pendingWarehouses, pendingRetailers, allProducts] =
        await Promise.all([
          apiFetch<Producer[]>("/admin/producers", undefined, currentToken),
          apiFetch<Processor[]>("/admin/accounts/pending/processor", undefined, currentToken).catch(() => []),
          apiFetch<Distributor[]>("/admin/accounts/pending/distributor", undefined, currentToken).catch(() => []),
          apiFetch<Warehouse[]>("/admin/accounts/pending/warehouse", undefined, currentToken).catch(() => []),
          apiFetch<Retailer[]>("/admin/accounts/pending/retailer", undefined, currentToken).catch(() => []),
          apiFetch<ProcessedProduct[]>("/admin/products", undefined, currentToken),
        ]);

      const [dh, wh, rh] = await Promise.all([
        apiFetch<HistoryItem[]>("/distributor/history", undefined, currentToken).catch(() => []),
        apiFetch<HistoryItem[]>("/warehouse/history", undefined, currentToken).catch(() => []),
        apiFetch<HistoryItem[]>("/retailer/history", undefined, currentToken).catch(() => []),
      ]);

      setProducers(producerList.filter((p) => p.isVerified));
      setProcessors((pendingProcessors ?? []).filter((x) => x.isVerified));
      setDistributors((pendingDistributors ?? []).filter((x) => x.isVerified));
      setWarehouses((pendingWarehouses ?? []).filter((x) => x.isVerified));
      setRetailers((pendingRetailers ?? []).filter((x) => x.isVerified));
      setProducts(allProducts);
      setDistHistory(dh);
      setWarehouseHistory(wh);
      setRetailerHistory(rh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    const timer = setTimeout(() => {
      void load(token);
    }, 0);
    return () => clearTimeout(timer);
  }, [ready, token, load]);

  const currentUsers = useMemo(() => {
    if (tab === "producer") return producers;
    if (tab === "processor") return processors;
    if (tab === "distributor") return distributors;
    if (tab === "warehouse") return warehouses;
    return retailers;
  }, [tab, producers, processors, distributors, warehouses, retailers]);

  const currentTransactions = useMemo(() => {
    if (!selectedId) return [];
    if (tab === "processor") return products.filter((p) => p.processorId === selectedId);
    if (tab === "distributor") return distHistory.filter((h) => h.distributorId === selectedId);
    if (tab === "warehouse") return warehouseHistory.filter((h) => h.warehouseId === selectedId);
    if (tab === "retailer") return retailerHistory.filter((h) => h.retailerId === selectedId);
    return [];
  }, [selectedId, tab, products, distHistory, warehouseHistory, retailerHistory]);

  if (!ready) {
    return <main className="min-h-screen p-6">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-orange-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entity Directory</h1>
            <p className="text-muted-foreground">View entities and drill down into available transactions.</p>
          </div>
          <Link href="/admin" className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Back to Admin
          </Link>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as EntityType);
            setSelectedId(null);
          }}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="producer">Producer</TabsTrigger>
            <TabsTrigger value="processor">Processor</TabsTrigger>
            <TabsTrigger value="distributor">Distributor</TabsTrigger>
            <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
            <TabsTrigger value="retailer">Retailer</TabsTrigger>
          </TabsList>

          {(["producer", "processor", "distributor", "warehouse", "retailer"] as const).map((entity) => (
            <TabsContent key={entity} value={entity}>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{entity} Users</CardTitle>
                    <CardDescription>Verified users only (if endpoint supports it).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[480px]">
                      <UserTable
                        loading={loading}
                        users={entity === tab ? currentUsers : []}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                      {tab === "producer"
                        ? "No producer transaction API is exposed for admin in current OpenAPI."
                        : "Click a user to view transactions."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[480px]">
                      <TransactionTable rows={currentTransactions} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}

function UserTable({
  loading,
  users,
  selectedId,
  onSelect,
}: {
  loading: boolean;
  users: Array<{ _id: string; name?: string; email?: string; isVerified?: boolean }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (users.length === 0) return <p className="text-sm text-muted-foreground">No verified users found for this entity.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow
            key={u._id}
            className="cursor-pointer"
            onClick={() => onSelect(u._id)}
            data-state={selectedId === u._id ? "selected" : undefined}
          >
            <TableCell>
              <div className="font-medium">{u.name ?? "-"}</div>
              <div className="text-xs text-muted-foreground">{u.email ?? "-"}</div>
            </TableCell>
            <TableCell>
              <Badge variant={u.isVerified === false ? "secondary" : "default"}>
                {u.isVerified === false ? "Pending" : "Verified"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TransactionTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No transactions found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Master Product</TableHead>
          <TableHead>Event Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={String(row._id ?? i)}>
            <TableCell className="font-mono text-xs">{String(row._id ?? "-")}</TableCell>
            <TableCell className="font-mono text-xs">{String(row.masterProductId ?? "-")}</TableCell>
            <TableCell>{fmt(String(row.createdAt ?? row.receivedAt ?? row.dispatchedAt ?? ""))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
