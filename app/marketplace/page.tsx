"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

type Listing = {
  _id: string;
  productName: string;
  description?: string;
  imageUrl?: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  quantityAvailable: number;
  quantityUnit: string;
  productLocation: string;
  farmType?: string;
  sellerType?: string;
  status: string;
  viewCount?: number;
  sellerRating?: { averageStars: number; totalRatings: number };
};

type ListingsResponse = {
  page: number;
  limit: number;
  total: number;
  items: Listing[];
};

type Inquiry = {
  _id: string;
  status: string;
  buyerName: string;
  buyerContact: string;
  message?: string;
  offeredPrice?: number;
};

type ChatMessage = {
  _id: string;
  sender: "buyer" | "seller";
  message: string;
  createdAt: string;
};

type View = "browse" | "detail" | "inquire" | "chat" | "buy" | "rate";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? "text-yellow-400" : "text-gray-300"}>★</span>
      ))}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [view, setView] = useState<View>("browse");
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // selected listing
  const [selected, setSelected] = useState<Listing | null>(null);

  // buyer identity (persisted in state for session)
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");

  // inquiry form
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [inquiryId, setInquiryId] = useState("");

  // chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState("");

  // buy form
  const [buyQty, setBuyQty] = useState("");
  const [buyUnit, setBuyUnit] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyNote, setBuyNote] = useState("");

  // rating form
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");

  const limit = 12;

  // ── Fetch listings ──────────────────────────────────────────────────────────

  const fetchListings = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set("q", q);
      if (location) params.set("location", location);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      const data = await apiFetch<ListingsResponse>(`/api/v1/marketplace/listings?${params}`);
      setListings(data.items);
      setTotal(data.total);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [q, location, minPrice, maxPrice]);

  useEffect(() => { fetchListings(1); }, [fetchListings]);

  // ── Open listing detail ─────────────────────────────────────────────────────

  async function openDetail(id: string) {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<Listing>(`/api/v1/marketplace/listings/${id}`);
      setSelected(data);
      setView("detail");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }

  // ── Submit inquiry ──────────────────────────────────────────────────────────

  async function submitInquiry() {
    if (!selected || !buyerName || !buyerContact) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiFetch<Inquiry>(`/api/v1/marketplace/listings/${selected._id}/inquiries`, {
        method: "POST",
        body: JSON.stringify({
          buyerName,
          buyerContact,
          message: inquiryMsg || undefined,
          offeredPrice: offeredPrice ? Number(offeredPrice) : undefined,
        }),
      });
      setInquiryId(data._id);
      setSuccess("Inquiry sent! You can now chat with the seller.");
      setView("chat");
      loadChat(data._id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  }

  // ── Load chat ───────────────────────────────────────────────────────────────

  async function loadChat(iid: string) {
    if (!buyerContact) return;
    try {
      const data = await apiFetch<ChatMessage[]>(
        `/api/v1/marketplace/inquiries/${iid}/chat?buyerContact=${encodeURIComponent(buyerContact)}`
      );
      setChatMessages(Array.isArray(data) ? data : []);
    } catch {
      // non-fatal
    }
  }

  // ── Send chat message ───────────────────────────────────────────────────────

  async function sendChat() {
    if (!inquiryId || !chatMsg || !buyerContact) return;
    setLoading(true);
    try {
      await apiFetch(`/api/v1/marketplace/inquiries/${inquiryId}/buyer-reply`, {
        method: "POST",
        body: JSON.stringify({ buyerContact, message: chatMsg }),
      });
      setChatMsg("");
      loadChat(inquiryId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  // ── Submit purchase ─────────────────────────────────────────────────────────

  async function submitBuy() {
    if (!selected || !buyerName || !buyerContact || !buyQty) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/v1/marketplace/listings/${selected._id}/buy`, {
        method: "POST",
        body: JSON.stringify({
          buyerName,
          buyerContact,
          quantity: Number(buyQty),
          quantityUnit: buyUnit || selected.quantityUnit,
          offeredPrice: buyPrice ? Number(buyPrice) : undefined,
          note: buyNote || undefined,
        }),
      });
      setSuccess("Purchase request submitted! The seller will be notified.");
      setBuyQty(""); setBuyUnit(""); setBuyPrice(""); setBuyNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit purchase request");
    } finally {
      setLoading(false);
    }
  }

  // ── Submit rating ───────────────────────────────────────────────────────────

  async function submitRating() {
    if (!selected || !buyerName || !buyerContact) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/v1/marketplace/listings/${selected._id}/ratings`, {
        method: "POST",
        body: JSON.stringify({ buyerName, buyerContact, stars, review: review || undefined }),
      });
      setSuccess("Rating submitted. Thank you!");
      setReview("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  }

  // ── Buyer identity guard ────────────────────────────────────────────────────

  function BuyerIdentityForm({ onDone }: { onDone: () => void }) {
    return (
      <div className="space-y-3 max-w-sm">
        <p className="text-sm text-muted-foreground">Enter your details to continue.</p>
        <div>
          <Label>Your Name / Business</Label>
          <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Amit Traders" />
        </div>
        <div>
          <Label>Contact (phone / email)</Label>
          <Input value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} placeholder="+91-9999999999" />
        </div>
        <Button onClick={onDone} disabled={!buyerName || !buyerContact}>Continue</Button>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commodity Marketplace</h1>
            <p className="text-muted-foreground text-sm mt-1">Browse, negotiate, and buy directly from producers & processors.</p>
          </div>
          {view !== "browse" && (
            <Button variant="outline" onClick={() => { setView("browse"); setSelected(null); setError(""); setSuccess(""); }}>
              ← Back to listings
            </Button>
          )}
        </div>

        {/* Alerts */}
        {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert className="mb-4 border-green-500 bg-green-50"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}

        {/* ── BROWSE VIEW ── */}
        {view === "browse" && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
                  <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  <Input placeholder="Min price" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <Input placeholder="Max price" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
                <Button className="mt-3" onClick={() => fetchListings(1)} disabled={loading}>
                  {loading ? "Searching…" : "Search"}
                </Button>
              </CardContent>
            </Card>

            {/* Listings grid */}
            {loading && <p className="text-center text-muted-foreground py-12">Loading listings…</p>}
            {!loading && listings.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No listings found.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <Card key={l._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(l._id)}>
                  {l.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrl} alt={l.productName} className="h-40 w-full object-cover rounded-t-lg" />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{l.productName}</CardTitle>
                      <Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{l.productLocation}</p>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    <p className="font-semibold text-green-700">
                      {l.currency} {l.priceMin.toLocaleString()} – {l.priceMax.toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground"> / {l.quantityUnit}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available: {l.quantityAvailable} {l.quantityUnit}
                      {l.farmType && <> · {l.farmType}</>}
                    </p>
                    {l.sellerRating && l.sellerRating.totalRatings > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Stars value={Math.round(l.sellerRating.averageStars)} />
                        <span className="text-muted-foreground">({l.sellerRating.totalRatings})</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => fetchListings(page - 1)}>Previous</Button>
                <span className="self-center text-sm text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</span>
                <Button variant="outline" disabled={page >= Math.ceil(total / limit)} onClick={() => fetchListings(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === "detail" && selected && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {selected.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.imageUrl} alt={selected.productName} className="w-full rounded-xl object-cover max-h-72" />
              )}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>{selected.productName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selected.productLocation}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {selected.description && <p>{selected.description}</p>}
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Price range</span><br /><strong>{selected.currency} {selected.priceMin.toLocaleString()} – {selected.priceMax.toLocaleString()}</strong></div>
                    <div><span className="text-muted-foreground">Available</span><br /><strong>{selected.quantityAvailable} {selected.quantityUnit}</strong></div>
                    {selected.farmType && <div><span className="text-muted-foreground">Farm type</span><br /><strong>{selected.farmType}</strong></div>}
                    {selected.sellerType && <div><span className="text-muted-foreground">Seller type</span><br /><strong>{selected.sellerType}</strong></div>}
                    {selected.viewCount !== undefined && <div><span className="text-muted-foreground">Views</span><br /><strong>{selected.viewCount}</strong></div>}
                  </div>
                  {selected.sellerRating && selected.sellerRating.totalRatings > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Stars value={Math.round(selected.sellerRating.averageStars)} />
                        <span className="text-muted-foreground text-xs">{selected.sellerRating.averageStars.toFixed(1)} avg · {selected.sellerRating.totalRatings} ratings</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Actions</h2>
              <Button className="w-full" onClick={() => setView("inquire")}>💬 Send Inquiry / Negotiate Price</Button>
              <Button className="w-full" variant="outline" onClick={() => setView("buy")}>🛒 Place Purchase Request</Button>
              <Button className="w-full" variant="outline" onClick={() => setView("rate")}>⭐ Rate this Seller</Button>
            </div>
          </div>
        )}

        {/* ── INQUIRE VIEW ── */}
        {view === "inquire" && selected && (
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Send Inquiry for {selected.productName}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(!buyerName || !buyerContact) ? (
                <BuyerIdentityForm onDone={() => {}} />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">As: <strong>{buyerName}</strong> ({buyerContact})</p>
                  <div>
                    <Label>Message (optional)</Label>
                    <Input value={inquiryMsg} onChange={(e) => setInquiryMsg(e.target.value)} placeholder="Can you offer a better price?" />
                  </div>
                  <div>
                    <Label>Offered Price ({selected.currency}, optional)</Label>
                    <Input type="number" value={offeredPrice} onChange={(e) => setOfferedPrice(e.target.value)} placeholder={String(selected.priceMin)} />
                  </div>
                  <Button onClick={submitInquiry} disabled={loading} className="w-full">
                    {loading ? "Sending…" : "Send Inquiry"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── CHAT VIEW ── */}
        {view === "chat" && (
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Chat with Seller</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-72 border rounded-md p-3 bg-slate-50">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-8">No messages yet.</p>
                )}
                {chatMessages.map((m) => (
                  <div key={m._id} className={`mb-3 flex ${m.sender === "buyer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender === "buyer" ? "bg-green-600 text-white" : "bg-white border"}`}>
                      <p>{m.message}</p>
                      <p className={`text-xs mt-1 ${m.sender === "buyer" ? "text-green-100" : "text-muted-foreground"}`}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                />
                <Button onClick={sendChat} disabled={loading || !chatMsg}>Send</Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => loadChat(inquiryId)}>Refresh</Button>
            </CardContent>
          </Card>
        )}

        {/* ── BUY VIEW ── */}
        {view === "buy" && selected && (
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Purchase Request: {selected.productName}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(!buyerName || !buyerContact) ? (
                <BuyerIdentityForm onDone={() => {}} />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">As: <strong>{buyerName}</strong> ({buyerContact})</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantity *</Label>
                      <Input type="number" value={buyQty} onChange={(e) => setBuyQty(e.target.value)} placeholder="1000" />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input value={buyUnit} onChange={(e) => setBuyUnit(e.target.value)} placeholder={selected.quantityUnit} />
                    </div>
                  </div>
                  <div>
                    <Label>Offered Price ({selected.currency}, optional)</Label>
                    <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder={String(selected.priceMin)} />
                  </div>
                  <div>
                    <Label>Note (optional)</Label>
                    <Input value={buyNote} onChange={(e) => setBuyNote(e.target.value)} placeholder="Need delivery by next week" />
                  </div>
                  <Button onClick={submitBuy} disabled={loading || !buyQty} className="w-full">
                    {loading ? "Submitting…" : "Submit Purchase Request"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── RATE VIEW ── */}
        {view === "rate" && selected && (
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Rate Seller for {selected.productName}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(!buyerName || !buyerContact) ? (
                <BuyerIdentityForm onDone={() => {}} />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">As: <strong>{buyerName}</strong> ({buyerContact})</p>
                  <div>
                    <Label>Stars</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStars(s)}
                          className={`text-2xl transition-colors ${s <= stars ? "text-yellow-400" : "text-gray-300"}`}
                          aria-label={`${s} star${s > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Review (optional)</Label>
                    <Input value={review} onChange={(e) => setReview(e.target.value)} placeholder="Good quality and fair pricing" />
                  </div>
                  <Button onClick={submitRating} disabled={loading} className="w-full">
                    {loading ? "Submitting…" : "Submit Rating"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}
