import { useEffect, useRef, useState } from "react";
import { useCheckInRegistration, useListEvents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ScanLine, Camera, CameraOff } from "lucide-react";
import { formatDate } from "@/lib/format";

type Result = {
  ok: boolean;
  message: string;
  participantName?: string;
  alreadyCheckedIn?: boolean;
};

export default function CheckInPage() {
  const { data: events } = useListEvents();
  const [eventId, setEventId] = useState<string>("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const checkInMutation = useCheckInRegistration();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeEvents = (events ?? []).filter((e) => e.status !== "cancelled");

  async function submitCode(rawCode: string) {
    const ticketCode = rawCode.trim().toUpperCase();
    if (!ticketCode) return;

    try {
      const res = await checkInMutation.mutateAsync({ data: { ticketCode } });
      if (res.alreadyCheckedIn) {
        setResult({
          ok: false,
          message: "Este ingresso já teve check-in realizado anteriormente.",
          participantName: res.registration.participantName,
          alreadyCheckedIn: true,
        });
      } else {
        setResult({
          ok: true,
          message: "Check-in confirmado com sucesso!",
          participantName: res.registration.participantName,
        });
      }
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setResult({ ok: false, message: "Código de ingresso não encontrado." });
      } else {
        setResult({ ok: false, message: "Erro ao processar o check-in. Tente novamente." });
      }
    } finally {
      setCode("");
      inputRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!scannerActive) return;

    let html5QrCode: any;
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            submitCode(decodedText);
          },
          () => {},
        );
      } catch {
        setScannerActive(false);
      }
    })();

    return () => {
      cancelled = true;
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-in de Ingressos</h1>
        <p className="text-muted-foreground">Escaneie o QR Code do ingresso ou digite o código manualmente.</p>
      </div>

      <div className="space-y-1.5">
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por evento (opcional, apenas informativo)" />
          </SelectTrigger>
          <SelectContent>
            {activeEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} — {formatDate(e.date)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scanner de QR Code
          </CardTitle>
          <Button
            variant={scannerActive ? "destructive" : "outline"}
            size="sm"
            onClick={() => setScannerActive((v) => !v)}
          >
            {scannerActive ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                Parar Câmera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Ativar Câmera
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {scannerActive ? (
            <div id="qr-reader" className="w-full rounded-md overflow-hidden" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Ative a câmera para escanear o QR Code do participante, ou digite o código abaixo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrada manual do código</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitCode(code);
            }}
          >
            <Input
              ref={inputRef}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: A1B2C3D4E5"
              className="font-mono uppercase"
            />
            <Button type="submit" disabled={!code.trim() || checkInMutation.isPending}>
              Confirmar
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.ok ? "border-emerald-500" : "border-destructive"}>
          <CardContent className="flex items-center gap-4 py-6">
            {result.ok ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.participantName && (
                <p className="text-sm text-muted-foreground">Participante: {result.participantName}</p>
              )}
              {result.alreadyCheckedIn && <Badge variant="outline" className="mt-1">Duplicado</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
