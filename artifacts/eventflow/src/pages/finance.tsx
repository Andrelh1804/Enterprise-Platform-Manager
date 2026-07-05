import { useState } from "react";
import {
  useListTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useListEvents,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
  TransactionInputType,
  TransactionInputStatus,
  TransactionInputPaymentMethod,
  type Transaction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency, formatDate, formatLabel, statusBadgeVariant } from "@/lib/format";
import { Plus, Pencil, Trash2, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  eventId: "",
  type: "income" as const,
  category: "",
  description: "",
  amount: 0,
  dueDate: "",
  status: "pending" as const,
  paymentMethod: "pix" as const,
};

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { data: transactions, isLoading } = useListTransactions({
    ...(typeFilter !== "all" ? { type: typeFilter as "income" | "expense" } : {}),
    ...(eventFilter !== "all" ? { eventId: eventFilter } : {}),
  });
  const { data: events } = useListEvents();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [form, setForm] = useState(emptyForm);

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, eventId: events?.[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setForm({
      eventId: transaction.eventId,
      type: transaction.type as typeof emptyForm.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      dueDate: transaction.dueDate.slice(0, 10),
      status: transaction.status as typeof emptyForm.status,
      paymentMethod: transaction.paymentMethod as typeof emptyForm.paymentMethod,
    });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        toast.success("Transação atualizada");
      } else {
        await createMutation.mutateAsync({ data: form });
        toast.success("Transação criada");
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
      toast.success("Transação excluída");
      invalidate();
    } catch {
      toast.error("Falha ao excluir transação");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe receitas e despesas de todos os eventos.</p>
        </div>
        <Button onClick={openCreate} disabled={!events || events.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {Object.values(TransactionInputType).map((t) => (
              <SelectItem key={t} value={t}>
                {formatLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <BadgeDollarSign className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma transação corresponde aos filtros.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">{eventNameById.get(tx.eventId) ?? "—"}</TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell>{formatDate(tx.dueDate)}</TableCell>
                  <TableCell className={tx.type === "income" ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatLabel(tx.paymentMethod)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[tx.status]}>{formatLabel(tx.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tx)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(tx)}>
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
            <DialogTitle>{editing ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TransactionInputType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ingressos, Buffet..." />
            </div>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as typeof form.paymentMethod })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TransactionInputPaymentMethod).map((p) => (
                    <SelectItem key={p} value={p}>
                      {formatLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TransactionInputStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.description || !form.eventId || !form.dueDate}>
              {editing ? "Salvar Alterações" : "Criar Transação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá permanentemente "{deleting?.description}" e não pode ser desfeito.
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
