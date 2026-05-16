import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type TraceabilityViewProps = {
  data: unknown;
};

type JsonRecord = Record<string, unknown>;

function toDate(value: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function stageLabel(stage: string) {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TraceabilityView({ data }: TraceabilityViewProps) {
  const trace = (data ?? {}) as JsonRecord;
  const origin = ((trace.producerOrigins as JsonRecord[] | undefined)?.[0] ?? {}) as JsonRecord;
  const rawProduct = (origin.rawProduct ?? {}) as JsonRecord;
  const farmFields = (rawProduct.farmFields ?? {}) as JsonRecord;
  const geo = (farmFields.geoLocation ?? { lat: null, lng: null }) as JsonRecord;
  const processedProduct = (trace.processedProduct ?? {}) as JsonRecord;
  const distributionLeg1 = (processedProduct.distributionLeg1 ?? {}) as JsonRecord;
  const distributionLeg2 = (processedProduct.distributionLeg2 ?? {}) as JsonRecord;
  const warehouseStop = (processedProduct.warehouseStop ?? {}) as JsonRecord;
  const retailerStop = (processedProduct.retailerStop ?? {}) as JsonRecord;
  const otherIngredients = (processedProduct.otherIngredients as JsonRecord[] | undefined) ?? [];
  const processor = (trace.processor ?? {}) as JsonRecord;
  const batch = (trace.batch ?? {}) as JsonRecord;
  const processingDetails = (processedProduct.processingDetails ?? {}) as JsonRecord;
  const expiryDate = new Date(`${(processedProduct.expiryDate as string | undefined) ?? ""}T23:59:59`);
  const isExpired = new Date() > expiryDate;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-amber-200/80 bg-white/85 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Master Product Trace</p>
                <CardTitle className="text-2xl md:text-3xl">{data?.masterProductId ?? "N/A"}</CardTitle>
              </div>
              <Badge
                variant={isExpired ? "destructive" : "secondary"}
                className={isExpired ? "w-fit bg-red-100 text-red-700" : "w-fit bg-emerald-100 text-emerald-700"}
              >
                {isExpired ? "EXPIRED" : "SAFE TO EAT"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Product:</span> {data.processedProduct.productName}
            </p>
            <p>
              <span className="font-medium">Quantity:</span> {String(processedProduct.totalQuantityProduced ?? "N/A")}{" "}
              {String(processedProduct.quantityUnit ?? "")}
            </p>
            <p className="md:col-span-2 break-all">
              <span className="font-medium">QR:</span> {String(trace.qrCodeUrl ?? "N/A")}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Producer Origin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Farmer:</span> {String(((origin.producer ?? {}) as JsonRecord).name ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Crop:</span> {String(farmFields.cropName ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Farm Size:</span> {String(farmFields.farmSizeAcres ?? "N/A")} acres
              </p>
              <p>
                <span className="font-medium">Harvest Date:</span> {String(farmFields.harvestDate ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Geo Coordinates:</span> {String(geo.lat ?? "N/A")}, {String(geo.lng ?? "N/A")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Farm Location Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <iframe
                  title="Farm Location"
                  src={`https://www.google.com/maps?q=${String(geo.lat ?? "")},${String(geo.lng ?? "")}&z=13&output=embed`}
                  className="h-64 w-full md:h-72"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Processing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Processor:</span> {String(processor.companyName ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Batch:</span> {String(batch.batchId ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Manufactured:</span> {String(processedProduct.manufacturingDate ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Expiry:</span> {String(processedProduct.expiryDate ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Packaging:</span> {String(processingDetails.packagingType ?? "N/A")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Leg 1:</span> {String(distributionLeg1.distributorName ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Warehouse:</span> {String(warehouseStop.warehouseName ?? "N/A")}
              </p>
              <p>
                <span className="font-medium">Leg 2:</span> {distributionLeg2.distributorName}
              </p>
              <p>
                <span className="font-medium">Retailer:</span> {String(retailerStop.retailerName ?? "N/A")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transport Leg 1 (Processor to Distributor)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Transporter:</span> {distributionLeg1?.distributorName ?? "N/A"}</p>
              <p><span className="font-medium">Vehicle:</span> {distributionLeg1?.vehicleId ?? "N/A"}</p>
              <p><span className="font-medium">Dispatched:</span> {toDate(distributionLeg1?.dispatchedAt)}</p>
              <p><span className="font-medium">Received:</span> {toDate(distributionLeg1?.receivedAt)}</p>
              <p><span className="font-medium">Temp:</span> {distributionLeg1?.startTemp ?? "N/A"}C to {distributionLeg1?.endTemp ?? "N/A"}C</p>
              <p><span className="font-medium">Humidity:</span> {distributionLeg1?.startHumidity ?? "N/A"}% to {distributionLeg1?.endHumidity ?? "N/A"}%</p>
              <p className="sm:col-span-2"><span className="font-medium">Notes:</span> {distributionLeg1?.notes ?? "N/A"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transport Leg 2 (Warehouse to Retail)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Transporter:</span> {distributionLeg2?.distributorName ?? "N/A"}</p>
              <p><span className="font-medium">Vehicle:</span> {distributionLeg2?.vehicleId ?? "N/A"}</p>
              <p><span className="font-medium">Dispatched:</span> {toDate(distributionLeg2?.dispatchedAt)}</p>
              <p><span className="font-medium">Received:</span> {toDate(distributionLeg2?.receivedAt)}</p>
              <p><span className="font-medium">Temp:</span> {distributionLeg2?.startTemp ?? "N/A"}C to {distributionLeg2?.endTemp ?? "N/A"}C</p>
              <p><span className="font-medium">Humidity:</span> {distributionLeg2?.startHumidity ?? "N/A"}% to {distributionLeg2?.endHumidity ?? "N/A"}%</p>
              <p className="sm:col-span-2"><span className="font-medium">Notes:</span> {distributionLeg2?.notes ?? "N/A"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Warehouse:</span> {warehouseStop?.warehouseName ?? "N/A"}</p>
              <p><span className="font-medium">Quantity Received:</span> {warehouseStop?.quantityReceived ?? "N/A"} kg</p>
              <p><span className="font-medium">Received At:</span> {toDate(warehouseStop?.receivedAt)}</p>
              <p><span className="font-medium">Dispatched At:</span> {toDate(warehouseStop?.dispatchedAt)}</p>
              <p><span className="font-medium">Storage Temp:</span> {warehouseStop?.storageTemp ?? "N/A"}C</p>
              <p><span className="font-medium">Storage Humidity:</span> {warehouseStop?.storageHumidity ?? "N/A"}%</p>
              <p className="sm:col-span-2"><span className="font-medium">Notes:</span> {warehouseStop?.notes ?? "N/A"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retailer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Retailer:</span> {retailerStop?.retailerName ?? "N/A"}</p>
              <p><span className="font-medium">Received At:</span> {toDate(retailerStop?.receivedAt)}</p>
              <p className="sm:col-span-2"><span className="font-medium">Shelf Location:</span> {retailerStop?.shelfLocation ?? "N/A"}</p>
              <p className="sm:col-span-2"><span className="font-medium">Notes:</span> {retailerStop?.notes ?? "N/A"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ingredients and Process Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {otherIngredients.map((ingredient) => (
                <div key={ingredient.ingredientName} className="rounded-lg border p-3">
                  <p className="font-medium">{ingredient.ingredientName}</p>
                  <p>{ingredient.quantity} {ingredient.quantityUnit}</p>
                  <p className="text-muted-foreground">{ingredient.supplier}</p>
                </div>
              ))}
              <div className="rounded-lg border p-3">
                <p>Cleaning: {processingDetails.cleaning ? "Yes" : "No"}</p>
                <p>Washing: {processingDetails.washing ? "Yes" : "No"}</p>
                <p>Stone Grinding: {processingDetails.stoneGrinding ? "Yes" : "No"}</p>
                <p>Fortified: {processingDetails.fortified ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(((trace.histories ?? {}) as JsonRecord).distributorHistory as JsonRecord[] | undefined ?? []).map((entry) => (
                <div key={entry._id} className="rounded-lg border p-3">
                  <p className="font-medium">{entry.leg.toUpperCase()} - {entry.distributorId}</p>
                  <p>Vehicle: {entry.vehicleId}</p>
                  <p>{toDate(entry.dispatchedAt)} to {toDate(entry.receivedAt)}</p>
                  <p className="text-muted-foreground">{entry.notes}</p>
                </div>
              ))}
              {(((trace.histories ?? {}) as JsonRecord).warehouseHistory as JsonRecord[] | undefined ?? []).map((entry) => (
                <div key={entry._id} className="rounded-lg border p-3">
                  <p className="font-medium">Warehouse {entry.warehouseId}</p>
                  <p>Storage: {entry.storageTemp}C / {entry.storageHumidity}%</p>
                  <p className="text-muted-foreground">{entry.notes}</p>
                </div>
              ))}
              {(((trace.histories ?? {}) as JsonRecord).retailerHistory as JsonRecord[] | undefined ?? []).map((entry) => (
                <div key={entry._id} className="rounded-lg border p-3">
                  <p className="font-medium">Retailer {entry.retailerId}</p>
                  <p>Shelf: {entry.shelfLocation}</p>
                  <p className="text-muted-foreground">{entry.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {((trace.timeline as JsonRecord[] | undefined) ?? []).map((item) => (
              <div key={`${item.stage}-${item.refId}`} className="rounded-lg border bg-muted/25 p-3 text-sm">
                <p className="font-medium">{stageLabel(item.stage)}</p>
                <p className="text-muted-foreground">{toDate(item.time)}</p>
                <p className="text-xs text-muted-foreground">Ref: {item.refId}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need to Report an Issue?</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${data?.masterProductId ?? ""}/report`}
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Go to Consumer Report Page
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
