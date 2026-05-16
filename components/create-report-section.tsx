"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api";

type CreateReportSectionProps = {
  masterProductId: string;
};

type CreateReportResponse = {
  reportId: string;
};

export function CreateReportSection({ masterProductId }: CreateReportSectionProps) {
  const [title, setTitle] = useState("");
  const [consumerName, setConsumerName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        title,
        consumerName,
        reportType: "general_product_report",
        description,
        masterProductId,
        imageUrls: imageUrls
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const data = await apiFetch<CreateReportResponse>("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess(`Report created successfully. Report ID: ${data.reportId}`);
      setTitle("");
      setConsumerName("");
      setDescription("");
      setImageUrls("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Report</CardTitle>
        <CardDescription>Consumers can report any issue related to this master product.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="report-title">Title</Label>
            <Input id="report-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="consumer-name">Consumer Name</Label>
            <Input id="consumer-name" value={consumerName} onChange={(e) => setConsumerName(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="report-description">Description</Label>
            <textarea
              id="report-description"
              className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="report-images">Image URLs (comma separated)</Label>
            <Input
              id="report-images"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://... , https://..."
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
