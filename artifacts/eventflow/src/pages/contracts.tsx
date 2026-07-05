import { useState } from "react";
import {
  useListContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
  useListEvents,
  getListContractsQueryKey,
  getGetDashboardSummaryQueryKey,
  ContractInputContractType,
  ContractInputStatus,
  type Contract,
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
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  eventId: "",
  title: "",
  contractType: "supplier" as const,
  counterpartyName: "",
  value: 0,
  startDate: "",
  endDate: "",
  status: "draft" as const,
};

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const { data: contracts, isLoading } = useListContracts();
  const { data: events } = useListEvents();
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const deleteMutation = useDeleteContract();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState<Contract | null>(null);
  const [form, setForm] = useState(emptyForm);

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, eventId: events?.[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(contract: Contract) {
    setEditing(contract);
    setForm({
      eventId: contract.eventId,
      title: contract.title,
      contractType: contract.contractType as typeof emptyForm.contractType,
      counterpartyName: contract.counterpartyName,
      value: contract.value,
      startDate: contract.startDate.slice(0, 10),
      endDate: contract.endDate.slice(0, 10),
      status: contract.status as typeof emptyForm.status,
    });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        toast.success("Contrato atualizado");
      } else {
        await createMutation.mutateAsync({ data: form });
        toast.success("Contrato criado");
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
      toast.success("Contrato excluído");
      invalidate();
    } catch {
      toast.error("Falha ao excluir contrato");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">Acordos com patrocinadores, fornecedores, equipe e talentos.</p>
        </div>
        <Button onClick={openCreate} disabled={!events || events.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !contracts || contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum contrato ainda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contraparte</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.title}</TableCell>
                  <TableCell className="text-muted-foreground">{eventNameById.get(contract.eventId) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatLabel(contract.contractType)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contract.counterpartyName}</TableCell>
                  <TableCell>{formatCurrency(contract.value)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[contract.status]}>{formatLabel(contract.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(contract)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(contract)}>
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
            <DialogTitle>{editing ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
              <Label>Tipo de Contrato</Label>
              <Select value={form.contractType} onValueChange={(v) => setForm({ ...form, contractType: v as typeof form.contractType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ContractInputContractType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
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
                  {Object.values(ContractInputStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contraparte</Label>
              <Input value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Início</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Término</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.title || !form.eventId || !form.startDate || !form.endDate}>
              {editing ? "Salvar Alterações" : "Criar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá permanentemente "{deleting?.title}" e não pode ser desfeito.
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
