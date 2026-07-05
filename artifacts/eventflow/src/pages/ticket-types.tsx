import { useState } from "react";
import {
  useListTicketTypes,
  useCreateTicketType,
  useUpdateTicketType,
  useDeleteTicketType,
  useListEvents,
  getListTicketTypesQueryKey,
  type TicketType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatLabel, statusBadgeVariant } from "@/lib/format";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  eventId: "",
  name: "",
  description: "",
  price: 0,
  quantity: 100,
  status: "active" as const,
};

export default function TicketTypesPage() {
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { data: events } = useListEvents();
  const { data: ticketTypes, isLoading } = useListTicketTypes(
    eventFilter === "all" ? undefined : { eventId: eventFilter },
  );
  const createMutation = useCreateTicketType();
  const updateMutation = useUpdateTicketType();
  const deleteMutation = useDeleteTicketType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [deleting, setDeleting] = useState<TicketType | null>(null);
  const [form, setForm] = useState(emptyForm);

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, eventId: eventFilter !== "all" ? eventFilter : events?.[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(ticketType: TicketType) {
    setEditing(ticketType);
    setForm({
      eventId: ticketType.eventId,
      name: ticketType.name,
      description: ticketType.description ?? "",
      price: ticketType.price,
      quantity: ticketType.quantity,
      status: ticketType.status as typeof emptyForm.status,
    });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListTicketTypesQueryKey() });
  }

  async function handleSubmit() {
    const data = { ...form, description: form.description || undefined };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
        toast.success("Lote de ingresso atualizado");
      } else {
        await createMutation.mutateAsync({ data });
        toast.success("Lote de ingresso criado");
      }
      invalidate();
      setDialogOpen(false);
    } catch {
      toast.error("Algo deu errado");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync({ id: deleting.id });
      toast.success("Lote de ingresso excluído");
      invalidate();
    } catch {
      toast.error("Falha ao excluir. Verifique se não há ingressos vendidos vinculados.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ingressos e Lotes</h1>
          <p className="text-muted-foreground">Configure os tipos de ingresso, preços e quantidades por evento.</p>
        </div>
        <Button onClick={openCreate} disabled={!events || events.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lote
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !ticketTypes || ticketTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Tags className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum lote de ingresso ainda.</p>
            <Button onClick={openCreate} variant="outline" disabled={!events || events.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lote
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Vendidos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketTypes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {t.name}
                    {t.description ? <p className="text-xs text-muted-foreground">{t.description}</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{eventNameById.get(t.eventId) ?? "—"}</TableCell>
                  <TableCell>{t.price === 0 ? "Gratuito" : formatCurrency(t.price)}</TableCell>
                  <TableCell className="min-w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={t.quantity > 0 ? (t.sold / t.quantity) * 100 : 0} className="w-24" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {t.sold}/{t.quantity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[t.status] ?? "outline"}>{formatLabel(t.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(t)}>
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
            <DialogTitle>{editing ? "Editar Lote" : "Novo Lote de Ingresso"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
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
            <div className="space-y-1.5 col-span-2">
              <Label>Nome do Lote</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="1º Lote, VIP, Meia-entrada..." />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="sold_out">Esgotado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.eventId || form.quantity < 1}>
              {editing ? "Salvar Alterações" : "Criar Lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lote de ingresso?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá permanentemente "{deleting?.name}". Lotes com ingressos vendidos vinculados não podem ser excluídos.
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
