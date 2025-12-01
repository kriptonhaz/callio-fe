import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSendUssd, useDisconnectUssd, useUssdResult } from '@/hooks/api/useGsmDevices';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SendUssdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  portNumber: number;
}

export function SendUssdModal({ open, onOpenChange, deviceId, portNumber }: SendUssdModalProps) {
  const { t } = useTranslation();
  const [ussdCode, setUssdCode] = useState('');
  const [resultText, setResultText] = useState('');

  const { mutate: sendUssd, isPending: isSending } = useSendUssd();
  const { mutate: disconnectUssd, isPending: isDisconnecting } = useDisconnectUssd();
  
  // Enable polling when modal is open
  const { data: ussdResult } = useUssdResult(deviceId, open);

  useEffect(() => {
    if (ussdResult?.results) {
      const portResult = ussdResult.results.find(r => r.line === portNumber);
      if (portResult && portResult.result) {
        setResultText(portResult.result);
      }
    }
  }, [ussdResult, portNumber]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setUssdCode('');
      setResultText('');
    }
  }, [open]);

  const handleSend = () => {
    if (!ussdCode) return;
    
    setResultText(''); // Clear previous result
    sendUssd({
      deviceId,
      lineNumber: portNumber,
      ussdCode
    }, {
      onSuccess: () => {
        toast.success(t('gsmDevices.ussd.sendSuccess', 'USSD code sent'));
      },
      onError: (error: any) => {
        toast.error(error?.message || t('gsmDevices.ussd.sendError', 'Failed to send USSD code'));
      }
    });
  };

  const handleDisconnect = () => {
    disconnectUssd({
      deviceId,
      lineNumber: portNumber
    }, {
      onSuccess: () => {
        toast.success(t('gsmDevices.ussd.disconnectSuccess', 'USSD session disconnected'));
        setResultText('');
      },
      onError: (error: any) => {
        toast.error(error?.message || t('gsmDevices.ussd.disconnectError', 'Failed to disconnect USSD'));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('gsmDevices.ussd.title', 'Send USSD')}</DialogTitle>
          <DialogDescription>
            {t('gsmDevices.ussd.description', 'Send USSD code to Port {{port}}', { port: portNumber })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ussdCode">{t('gsmDevices.ussd.code', 'USSD Code')}</Label>
            <div className="flex gap-2">
              <Input
                id="ussdCode"
                value={ussdCode}
                onChange={(e) => setUssdCode(e.target.value)}
                placeholder="*123#"
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isSending || !ussdCode}>
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.send', 'Send')}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="result">{t('gsmDevices.ussd.result', 'Result')}</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="h-8 text-destructive hover:text-destructive"
              >
                {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('gsmDevices.ussd.disconnect', 'Disconnect')}
              </Button>
            </div>
            <Textarea
              id="result"
              value={resultText}
              readOnly
              className="min-h-[200px] font-mono text-sm"
              placeholder={t('gsmDevices.ussd.waitingForResult', 'Waiting for response...')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
