import { useState } from "react";
import {
  useListRegistrations,
  useCreateRegistration,
  useDeleteRegistration,
  useListEvents,
  useListTicketTypes,
  getListRegistrationsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListTicketTypesQueryKey,
  getListTicketTypesQueryOptions,
  type Registration,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatLabel, statusBadgeVariant } from "@/lib/format";
import { Plus, Trash2, Ticket, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const emptyForm = {
  eventId: "",
  ticketTypeId: "",
  participantName: "",
  email: "",
  phone: "",
  status: "confirmed" as const,
};

export default function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { data: registrations, isLoading } = useListRegistrations(
    eventFilter === "all" ? undefined : { eventId: eventFilter },
  );
  const { data: events } = useListEvents();
  const createMutation = useCreateRegistration();
  const deleteMutation = useDeleteRegistration();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Registration | null>(null);
  const [viewingTicket, setViewingTicket] = useState<Registration | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: formTicketTypes } = useListTicketTypes(
    form.eventId ? { eventId: form.eventId } : undefined,
    {
      query: {
        ...getListTicketTypesQueryOptions(form.eventId ? { eventId: form.eventId } : undefined),
        enabled: !!form.eventId,
      },
    },
  );

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));

  function openCreate() {
    const eventId = eventFilter !== "all" ? eventFilter : events?.[0]?.id ?? "";
    setForm({ ...emptyForm, eventId });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTicketTypesQueryKey() });
  }

  async function handleSubmit() {
    const ticketType = (formTicketTypes ?? []).find((t) => t.id === form.ticketTypeId);
    if (!ticketType) {
      toast.error("Selecione um lote de ingresso válido");
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        data: { ...form, price: ticketType.price },
      });
      toast.success("Inscrição criada");
      invalidate();
      setDialogOpen(false);
      setViewingTicket(created);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Algo deu errado");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync({ id: deleting.id });
      toast.success("Inscrição excluída");
      invalidate();
    } catch {
      toast.error("Falha ao excluir inscrição");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inscrições e Ingressos</h1>
          <p className="text-muted-foreground">Participantes, ingressos emitidos e status de check-in.</p>
        </div>
        <Button onClick={openCreate} disabled={!events || events.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Emitir Ingresso
        </Button>
      </div>

      <Select value={eventFilter} onValueChange={setEventFilter}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Eventos</SelectItem>
          {(events ?? []).map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !registrations || registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Ticket className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma inscrição encontrada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.participantName}</TableCell>
                  <TableCell className="text-muted-foreground">{eventNameById.get(registration.eventId) ?? "—"}</TableCell>
                  <TableCell>
                    <button
                      className="font-mono text-xs bg-muted px-2 py-1 rounded hover:underline"
                      onClick={() => setViewingTicket(registration)}
                    >
                      {registration.ticketCode}
                    </button>
                  </TableCell>
                  <TableCell>{registration.price === 0 ? "Gratuito" : formatCurrency(registration.price)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[registration.status]}>{formatLabel(registration.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {registration.checkedIn ? (
                      <Badge variant="default">Feito</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewingTicket(registration)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(registration)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Emitir Ingresso</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Nome do Participante</Label>
              <Input value={form.participantName} onChange={(e) => setForm({ ...form, participantName: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Evento</Label>
              <Select value={form.eventId} onValueChange={(v) => setForm({ ...form, eventId: v, ticketTypeId: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {(events ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Lote de Ingresso</Label>
              <Select value={form.ticketTypeId} onValueChange={(v) => setForm({ ...form, ticketTypeId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={form.eventId ? "Selecione um lote" : "Escolha o evento primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {(formTicketTypes ?? [])
                    .filter((t) => t.status === "active" && t.sold < t.quantity)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.price === 0 ? "Gratuito" : formatCurrency(t.price)} ({t.quantity - t.sold} restantes)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.eventId && (formTicketTypes ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum lote cadastrado para este evento ainda.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="waitlist">Lista de Espera</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.participantName || !form.eventId || !form.ticketTypeId || !form.email || !form.phone}>
              Emitir Ingresso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingTicket} onOpenChange={(open) => !open && setViewingTicket(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ingresso</DialogTitle>
          </DialogHeader>
          {viewingTicket && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG value={viewingTicket.ticketCode} size={200} />
              <div className="text-center">
                <p className="font-mono text-lg font-semibold tracking-wider">{viewingTicket.ticketCode}</p>
                <p className="text-sm text-muted-foreground">{viewingTicket.participantName}</p>
              </div>
              <Badge variant={viewingTicket.checkedIn ? "default" : "outline"}>
                {viewingTicket.checkedIn ? "Check-in já realizado" : "Aguardando check-in"}
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir inscrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá permanentemente "{deleting?.participantName}" da lista de inscrições e devolverá o ingresso ao lote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
