import { useParams, Link } from "wouter";
import {
  useGetEvent,
  useListSponsors,
  useListSuppliers,
  useListContracts,
  useListStaff,
  useListTransactions,
  useListRegistrations,
  useListTicketTypes,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatLabel, statusBadgeVariant } from "@/lib/format";
import { ArrowLeft, MapPin, Users, Calendar, ExternalLink, Tags, Download } from "lucide-react";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id ?? "";

  const { data: event, isLoading } = useGetEvent(eventId);
  const { data: sponsors } = useListSponsors({ eventId });
  const { data: suppliers } = useListSuppliers();
  const { data: contracts } = useListContracts({ eventId });
  const { data: staff } = useListStaff({ eventId });
  const { data: transactions } = useListTransactions({ eventId });
  const { data: registrations } = useListRegistrations({ eventId });
  const { data: ticketTypes } = useListTicketTypes({ eventId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Event not found.</div>
    );
  }

  const revenue = (transactions ?? []).filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = (transactions ?? []).filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <Link href="/events">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venue}, {event.city}, {event.state}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {event.capacity.toLocaleString()} capacity
            </span>
          </div>
        </div>
        <Badge variant={statusBadgeVariant[event.status]} className="text-sm">
          {formatLabel(event.status)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-500">{formatCurrency(revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-500">{formatCurrency(expenses)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registrations</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{registrations?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sponsors</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{sponsors?.length ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sponsors</CardTitle>
        </CardHeader>
        <CardContent>
          {!sponsors || sponsors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No sponsors for this event yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{formatLabel(s.tier)}</TableCell>
                    <TableCell>{formatCurrency(s.investment)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[s.status]}>{formatLabel(s.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {!staff || staff.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No staff assigned yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.role}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[s.status]}>{formatLabel(s.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            {!contracts || contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No contracts for this event yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{formatCurrency(c.value)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[c.status]}>{formatLabel(c.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{formatDate(t.dueDate)}</TableCell>
                    <TableCell className={t.type === "income" ? "text-emerald-500" : "text-red-500"}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[t.status]}>{formatLabel(t.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Ticket Types
          </CardTitle>
          <Link href="/ticket-types">
            <Button variant="outline" size="sm">Manage Ticket Types</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!ticketTypes || ticketTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No ticket types configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketTypes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.price === 0 ? "Free" : formatCurrency(t.price)}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registrations</CardTitle>
          <div className="flex items-center gap-2">
            <a href={`${import.meta.env.BASE_URL}api/registrations/export?eventId=${encodeURIComponent(eventId)}`}>
              <Button variant="outline" size="sm" disabled={!registrations || registrations.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </a>
            <a href={`/e/${eventId}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Public Ticket Page
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {!registrations || registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No registrations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Ticket Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((r) => {
                  const ticketTypeName = ticketTypes?.find((t) => t.id === r.ticketTypeId)?.name ?? "—";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.participantName}</TableCell>
                      <TableCell>{ticketTypeName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.ticketCode}</TableCell>
                      <TableCell>{formatCurrency(r.price)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[r.status]}>{formatLabel(r.status)}</Badge>
                      </TableCell>
                      <TableCell>{r.checkedIn ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
