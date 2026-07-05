import { useState } from "react";
import {
  useListStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useListEvents,
  getListStaffQueryKey,
  getGetDashboardSummaryQueryKey,
  StaffMemberInputStatus,
  type StaffMember,
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
import { formatCurrency, formatLabel, statusBadgeVariant } from "@/lib/format";
import { Plus, Pencil, Trash2, UserSquare2 } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  eventId: "",
  name: "",
  role: "",
  email: "",
  phone: "",
  hourlyRate: 0,
  status: "scheduled" as const,
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { data: staff, isLoading } = useListStaff();
  const { data: events } = useListEvents();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);

  const eventNameById = new Map((events ?? []).map((e) => [e.id, e.name]));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, eventId: events?.[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditing(member);
    setForm({
      eventId: member.eventId,
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      hourlyRate: member.hourlyRate,
      status: member.status as typeof emptyForm.status,
    });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        toast.success("Membro da equipe atualizado");
      } else {
        await createMutation.mutateAsync({ data: form });
        toast.success("Membro da equipe adicionado");
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
      toast.success("Membro da equipe removido");
      invalidate();
    } catch {
      toast.error("Falha ao remover membro da equipe");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Escala de equipe e status de check-in em todos os eventos.</p>
        </div>
        <Button onClick={openCreate} disabled={!events || events.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !staff || staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <UserSquare2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum membro de equipe designado ainda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Valor por Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{eventNameById.get(member.eventId) ?? "—"}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{formatCurrency(member.hourlyRate)}/h</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[member.status]}>{formatLabel(member.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(member)}>
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
            <DialogTitle>{editing ? "Editar Membro da Equipe" : "Adicionar Membro da Equipe"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
              <Label>Função</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Segurança, Coordenador..." />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StaffMemberInputStatus).map((s) => (
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
            <div className="space-y-1.5 col-span-2">
              <Label>Valor por Hora</Label>
              <Input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.eventId || !form.role}>
              {editing ? "Salvar Alterações" : "Adicionar Membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá permanentemente "{deleting?.name}" do quadro de equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
