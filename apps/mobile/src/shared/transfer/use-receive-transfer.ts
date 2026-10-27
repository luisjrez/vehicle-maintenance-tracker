import { parseTransferQr, transferConflictDetailsSchema } from '@vmt/shared';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError, errorMessage } from '@/shared/api/api-error';
import { redeemTransferCode } from '@/shared/api/transfer-api';
import { useScanner } from '@/shared/scanner/use-scanner';
import { useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import { syncGarage } from '@/shared/sync/use-garage-sync';

type ReceiveState = { busy: boolean; message: string | null; error: string | null };

function conflictCount(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.failure.kind !== 'http' || error.failure.code !== 'TRANSFER_CONFLICT') return null;
  const details = transferConflictDetailsSchema.safeParse(error.failure.details);
  return details.success ? details.data.vehicleCount : null;
}

/**
 * "Receive from another phone": scan the QR, redeem it, and if this phone
 * already has data, ask before it is deleted and replaced (ADR-0001).
 */
async function redeem(code: string, replaceExisting: boolean, report: (state: ReceiveState) => void): Promise<void> {
  report({ busy: true, message: null, error: null });
  try {
    const { vehicleCount } = await redeemTransferCode({ code, replaceExisting });
    // Start the mirror over so nothing from this phone's old data lingers.
    useGarageStore.setState({ vehicles: [], records: [], selectedVehicleId: null, vehiclesSyncedAt: null });
    await syncGarage().catch(() => undefined);
    report({ busy: false, message: strings.transfer.received(vehicleCount), error: null });
  } catch (error) {
    if (conflictCount(error) !== null && !replaceExisting) {
      report({ busy: false, message: null, error: null });
      // The API's message states how many vehicles will be deleted; the destructive button is red.
      Alert.alert(strings.transfer.replaceTitle, errorMessage(error), [
        { text: strings.transfer.cancel, style: 'cancel' },
        { text: strings.transfer.replaceConfirm, style: 'destructive', onPress: () => void redeem(code, true, report) },
      ]);
      return;
    }
    report({ busy: false, message: null, error: errorMessage(error) });
  }
}

export function useReceiveTransfer(): ReceiveState & { start: () => void } {
  const [state, setState] = useState<ReceiveState>({ busy: false, message: null, error: null });

  const handleScan = useCallback(
    (value: string) => {
      const code = parseTransferQr(value);
      if (code === null) {
        setState({ busy: false, message: null, error: strings.transfer.notATransferCode });
        return;
      }
      void redeem(code, false, setState);
    },
    [],
  );

  const start = useScanner('qr', handleScan);
  return { ...state, start };
}
