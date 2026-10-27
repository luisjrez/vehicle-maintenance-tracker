import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useScanRequestStore } from '@/shared/scanner/scan-request-store';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { askPermission, emitScanFrame, resetScannerMock, setCameraPermission } from '@/test/scanner-camera-mock';
import { ScannerScreen } from './scanner-screen';

describe('ScannerScreen', () => {
  beforeEach(() => {
    resetScannerMock();
    resetRouterMock();
    useScanRequestStore.getState().clear();
  });

  it('returns the first QR code to the caller and closes, without saving anything', async () => {
    const requestId = useScanRequestStore.getState().open('qr');
    await render(<ScannerScreen initialMode="qr" locked />);

    await act(async () => {
      emitScanFrame({ barcodes: [{ format: 'CODE_128', value: 'ignored' }] });
      emitScanFrame({ barcodes: [{ format: 'QR_CODE', value: 'vmt-transfer:ABC123' }] });
      emitScanFrame({ barcodes: [{ format: 'QR_CODE', value: 'second' }] });
    });

    expect(useScanRequestStore.getState().result).toEqual({ requestId, mode: 'qr', value: 'vmt-transfer:ABC123' });
    expect(routerMock.back).toHaveBeenCalledTimes(1);
  });

  it('shows a guide box per mode and locks other modes when opened for a field', async () => {
    await render(<ScannerScreen initialMode="vin" locked />);

    expect(screen.getByTestId('scanner-guide-vin')).toBeTruthy();
    expect(screen.getByTestId('scanner-mode-odometer')).toBeDisabled();
  });

  it('switches modes when opened freely', async () => {
    await render(<ScannerScreen initialMode="qr" locked={false} />);

    await fireEvent.press(screen.getByTestId('scanner-mode-odometer'));

    expect(screen.getByTestId('scanner-guide-odometer')).toBeTruthy();
    expect(screen.getByTestId('scanner-torch')).toBeTruthy();
  });

  it('toggles the torch, off by default', async () => {
    await render(<ScannerScreen initialMode="odometer" locked />);

    expect(screen.getByTestId('scanner-torch')).toHaveTextContent('Torch off');
    await fireEvent.press(screen.getByTestId('scanner-torch'));
    expect(screen.getByTestId('scanner-torch')).toHaveTextContent('Torch on');
  });

  it('asks for camera permission with clear copy', async () => {
    setCameraPermission({ granted: false, canAsk: true });
    await render(<ScannerScreen initialMode="qr" locked />);

    expect(screen.getByTestId('scanner-permission')).toHaveTextContent(/Nothing is recorded or uploaded/);
    await fireEvent.press(screen.getByTestId('scanner-allow'));
    expect(askPermission).toHaveBeenCalled();
  });

  it('goes back to the field with "Type it instead"', async () => {
    await render(<ScannerScreen initialMode="vin" locked />);

    await fireEvent.press(screen.getByTestId('scanner-type-instead'));

    expect(routerMock.back).toHaveBeenCalled();
    expect(useScanRequestStore.getState().result).toBeNull();
  });
});
