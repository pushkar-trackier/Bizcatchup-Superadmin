"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { getAppConfig, updateAppConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/api/query-keys";
import { LIMIT_KEYS } from "@/lib/types/backend";

const CONFIG_KEY = "limits";

export default function PlansPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.appConfig(CONFIG_KEY), queryFn: () => getAppConfig(CONFIG_KEY) });

  const [dailyLimit, setDailyLimit] = useState(0);
  const [totalLimit, setTotalLimit] = useState(0);
  const [memberLimit, setMemberLimit] = useState(0);

  useEffect(() => {
    // Seeds editable form state from fetched config; intentionally re-syncs
    // whenever the query resolves or refetches.
    if (query.data) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDailyLimit(query.data[LIMIT_KEYS.dailyScanLimit] ?? 0);
      setTotalLimit(query.data[LIMIT_KEYS.totalScanLimit] ?? 0);
      setMemberLimit(query.data[LIMIT_KEYS.teamMemberLimit] ?? 0);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateAppConfig(CONFIG_KEY, [
        { configName: LIMIT_KEYS.dailyScanLimit, configValue: dailyLimit },
        { configName: LIMIT_KEYS.totalScanLimit, configValue: totalLimit },
        { configName: LIMIT_KEYS.teamMemberLimit, configValue: memberLimit },
      ]),
    onSuccess: () => {
      toast.success("Global limits updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.appConfig(CONFIG_KEY) });
    },
    onError: () => toast.error("Failed to update limits"),
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Plans" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Plans" }]} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              System configuration
            </div>
            <div className="text-lg font-semibold">Global limits</div>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || query.isLoading}>
            {mutation.isPending ? "Updating…" : "Update limits"}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
            <Label htmlFor="memberLimit">Team member limit</Label>
            <Input
              id="memberLimit"
              type="number"
              value={memberLimit}
              onChange={(e) => setMemberLimit(Number(e.target.value))}
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
        </CardContent>
      </Card>
    </div>
  );
}
