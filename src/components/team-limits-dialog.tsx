"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTeamLimits } from "@/lib/api/teams";
import { LIMIT_KEYS } from "@/lib/types/backend";
import type { TeamDirectoryRow } from "@/lib/types/view";

interface TeamLimitsDialogProps {
  team: TeamDirectoryRow | null;
  onOpenChange: (open: boolean) => void;
}

export function TeamLimitsDialog({ team, onOpenChange }: TeamLimitsDialogProps) {
  const [dailyLimit, setDailyLimit] = useState(0);
  const [totalLimit, setTotalLimit] = useState(0);
  const [memberLimit, setMemberLimit] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Seeds editable form state whenever a different team is opened for editing.
    if (team) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDailyLimit(team.dailyLimit);
      setTotalLimit(team.totalLimit);
      setMemberLimit(team.memberLimit);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [team]);

  const mutation = useMutation({
    mutationFn: () =>
      updateTeamLimits(team!.id, [
        { configName: LIMIT_KEYS.dailyScanLimit, configValue: dailyLimit },
        { configName: LIMIT_KEYS.totalScanLimit, configValue: totalLimit },
        { configName: LIMIT_KEYS.teamMemberLimit, configValue: memberLimit },
      ]),
    onSuccess: () => {
      toast.success(`Limits updated for ${team?.name}`);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to update limits"),
  });

  return (
    <Dialog open={!!team} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit team limits</DialogTitle>
          <DialogDescription>{team?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dailyLimit">Daily scan limit</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="totalLimit">Total scan limit</Label>
            <Input
              id="totalLimit"
              type="number"
              value={totalLimit}
              onChange={(e) => setTotalLimit(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memberLimit">Team member limit</Label>
            <Input
              id="memberLimit"
              type="number"
              value={memberLimit}
              onChange={(e) => setMemberLimit(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
