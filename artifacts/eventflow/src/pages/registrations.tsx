import { useState } from "react";
import {
  useListRegistrations,
  useCreateRegistration,
  useUpdateRegistration,
  useDeleteRegistration,
  useListEvents,
  getListRegistrationsQueryKey,
  getGetDashboardSummaryQueryKey,
  RegistrationInputTicketType,
  RegistrationInputStatus,
  type Registration,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatLabel, statusBadgeVariant } from "@/lib/format";
import { Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  eventId: "",
  participantName: "",
  email: "",
  phone: "",
  category: "",
  ticketType: "paid" as const,
  price: 0,
  status: "confirmed" as const,
  checkedIn: false,
};

export default function RegistrationsPage() {
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { data: registrations, isLoading } = useListRegistrations(
    eventFilter === "all" ? undefined : { eventId: eventFilter },
  );
  const { data: events } = useListEvents();
  const createMutation = useCreateRegistration();
  const updateMutation = useUpdateRegistration();
  const deleteMutation = useDeleteRegistration();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState<Registration | null>(null);
  const [form, setForm] = useState(emptyForm);

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, eventId: events?.[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(registration: Registration) {
    setEditing(registration);
    setForm({
      eventId: registration.eventId,
      participantName: registration.participantName,
      email: registration.email,
      phone: registration.phone,
      category: registration.category,
      ticketType: registration.ticketType as typeof emptyForm.ticketType,
      price: registration.price,
      status: registration.status as typeof emptyForm.status,
      checkedIn: registration.checkedIn,
    });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        toast.success("Inscrição atualizada");
      } else {
        await createMutation.mutateAsync({ data: form });
        toast.success("Inscrição criada");
      }
      invalidate();
      setDialogOpen(false);
    } catch {
      toast.error("Algo deu errado");
    }
  }

  async function toggleCheckIn(registration: Registration) {
    try {
      await updateMutation.mutateAsync({
        id: registration.id,
        data: { ...registration, checkedIn: !registration.checkedIn },
      });
      invalidate();
    } catch {
      toast.error("Falha ao atualizar check-in");
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
          <h1 className="text-3xl font-bold tracking-tight">Inscrições</h1>
          <p className="text-muted-foreground">Participantes, ingressos e status de check-in.</p>
        </div>
        <Button onClick={openCreate} disabled={!events || events.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Inscrição
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
                <TableHead>Ingresso</TableHead>
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
                    <Badge variant="outline">{formatLabel(registration.ticketType)}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(registration.price)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[registration.status]}>{formatLabel(registration.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Checkbox checked={registration.checkedIn} onCheckedChange={() => toggleCheckIn(registration)} />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(registration)}>
                      <Pencil className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Inscrição" : "Nova Inscrição"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Nome do Participante</Label>
              <Input value={form.participantName} onChange={(e) => setForm({ ...form, participantName: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Evento</Label>
              <Select value={form.eventId} onValueChange={(v) => setForm({ ...form, eventId: v })}>
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
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Geral, VIP..." />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Ingresso</Label>
              <Select value={form.ticketType} onValueChange={(v) => setForm({ ...form, ticketType: v as typeof form.ticketType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RegistrationInputTicketType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preço</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RegistrationInputStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Checkbox checked={form.checkedIn} onCheckedChange={(v) => setForm({ ...form, checkedIn: !!v })} />
              <Label>Já fez check-in</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.participantName || !form.eventId}>
              {editing ? "Salvar Alterações" : "Criar Inscrição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir inscrição?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá permanentemente "{deleting?.participantName}" da lista de inscrições.
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
