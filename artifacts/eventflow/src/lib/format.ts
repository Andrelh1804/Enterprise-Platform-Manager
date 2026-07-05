export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR", { year: "numeric", month: "short", day: "numeric" });
}

const labelTranslations: Record<string, string> = {
  planning: "Planejamento",
  confirmed: "Confirmado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  prospect: "Prospecção",
  negotiating: "Em Negociação",
  delivered: "Entregue",
  active: "Ativo",
  inactive: "Inativo",
  pending_review: "Em Avaliação",
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  expired: "Expirado",
  scheduled: "Agendado",
  checked_in: "Check-in Feito",
  checked_out: "Check-out Feito",
  no_show: "Não Compareceu",
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  waitlist: "Lista de Espera",
  master: "Master",
  gold: "Ouro",
  silver: "Prata",
  bronze: "Bronze",
  naming_rights: "Naming Rights",
  supplier: "Fornecedor",
  sponsor: "Patrocinador",
  staff: "Equipe",
  artist: "Artista",
  speaker: "Palestrante",
  exhibitor: "Expositor",
  volunteer: "Voluntário",
  income: "Receita",
  expense: "Despesa",
  pix: "Pix",
  credit_card: "Cartão de Crédito",
  boleto: "Boleto",
  bank_transfer: "Transferência Bancária",
  cash: "Dinheiro",
  free: "Gratuito",
  vip: "VIP",
  box: "Camarote",
  premium: "Premium",
  combo: "Combo",
};

export function formatLabel(value: string): string {
  const translated = labelTranslations[value];
  if (translated) return translated;
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planning: "outline",
  confirmed: "default",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
  prospect: "outline",
  negotiating: "outline",
  delivered: "secondary",
  active: "default",
  inactive: "secondary",
  pending_review: "outline",
  draft: "outline",
  sent: "outline",
  signed: "default",
  expired: "destructive",
  scheduled: "outline",
  checked_in: "default",
  checked_out: "secondary",
  no_show: "destructive",
  pending: "outline",
  paid: "default",
  overdue: "destructive",
  waitlist: "outline",
};
