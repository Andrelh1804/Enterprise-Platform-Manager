import { useState } from "react";
import { useParams } from "wouter";
import { useGetEvent, useListTicketTypes, useCreateRegistration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatLabel } from "@/lib/format";
import { MapPin, Calendar, Ticket, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function PublicEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id ?? "";

  const { data: event, isLoading } = useGetEvent(eventId);
  const { data: ticketTypes } = useListTicketTypes({ eventId });
  const createMutation = useCreateRegistration();

  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(null);
  const [form, setForm] = useState({ participantName: "", email: "", phone: "" });
  const [ticket, setTicket] = useState<{ code: string; name: string } | null>(null);

  const availableTicketTypes = (ticketTypes ?? []).filter((t) => t.status === "active" && t.sold < t.quantity);

  async function handlePurchase() {
    if (!selectedTicketTypeId) return;
    const ticketType = (ticketTypes ?? []).find((t) => t.id === selectedTicketTypeId);
    if (!ticketType) return;

    try {
      const created = await createMutation.mutateAsync({
        data: {
          eventId,
          ticketTypeId: ticketType.id,
          participantName: form.participantName,
          email: form.email,
          phone: form.phone,
          price: ticketType.price,
          status: "confirmed",
        },
      });
      setTicket({ code: created.ticketCode, name: created.participantName });
      setSelectedTicketTypeId(null);
      setForm({ participantName: "", email: "", phone: "" });
      toast.success("Ingresso emitido com sucesso!");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Não foi possível emitir o ingresso.");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!event) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Evento não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">{event.category}</Badge>
            <CardTitle className="text-3xl">{event.name}</CardTitle>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)} {event.time ? `às ${event.time}` : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.venue}, {event.city}, {event.state}
              </span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5" />
              Ingressos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableTicketTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Não há ingressos disponíveis para este evento no momento.</p>
            ) : (
              availableTicketTypes.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{t.quantity - t.sold} restantes</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{t.price === 0 ? "Gratuito" : formatCurrency(t.price)}</span>
                    <Button onClick={() => setSelectedTicketTypeId(t.id)}>Comprar</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTicketTypeId} onOpenChange={(open) => !open && setSelectedTicketTypeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seus Dados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome Completo</Label>
              <Input value={form.participantName} onChange={(e) => setForm({ ...form, participantName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <Button
              className="w-full"
              onClick={handlePurchase}
              disabled={!form.participantName || !form.email || !form.phone || createMutation.isPending}
            >
              Confirmar Emissão do Ingresso
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ticket} onOpenChange={(open) => !open && setTicket(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Ingresso Confirmado
            </DialogTitle>
          </DialogHeader>
          {ticket && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG value={ticket.code} size={200} />
              <div className="text-center">
                <p className="font-mono text-lg font-semibold tracking-wider">{ticket.code}</p>
                <p className="text-sm text-muted-foreground">{ticket.name}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Apresente este QR Code na entrada do evento. Um comprovante também foi vinculado ao seu e-mail cadastrado.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
