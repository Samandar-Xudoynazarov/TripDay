import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  reason: string;
  setReason: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function RejectOrgDialog({ open, reason, setReason, onClose, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tashkilotni rad etish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Rad etish sababi</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Sababni kiriting..."
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={onSubmit}>
              Rad etish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
