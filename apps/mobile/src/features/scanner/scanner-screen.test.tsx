import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useScanRequestStore } from '@/shared/scanner/scan-request-store';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { askPermission, emitScanFrame, resetScannerMock, setCameraPermission, setStillFrame } from '@/test/scanner-camera-mock';
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

const VIN = '1HGCM82633A004352';
const textLine = (text: string, height = 40) => ({ text, top: 0, left: 0, width: 300, height });

describe('ScannerScreen VIN mode', () => {
  beforeEach(() => {
    resetScannerMock();
    resetRouterMock();
    useScanRequestStore.getState().clear();
    useScanRequestStore.getState().open('vin');
  });

  it('takes the door-jamb barcode straight away', async () => {
    await render(<ScannerScreen initialMode="vin" locked />);

    await act(async () => {
      emitScanFrame({ barcodes: [{ format: 'CODE_39', value: `I${VIN}` }] });
    });

    expect(useScanRequestStore.getState().result?.value).toBe(VIN);
  });

  it('locks windshield text after agreeing frames', async () => {
    await render(<ScannerScreen initialMode="vin" locked />);

    await act(async () => {
      emitScanFrame({ lines: [textLine(VIN)] });
      emitScanFrame({ lines: [textLine('1HGCM82633AOO4352')] });
    });
    expect(useScanRequestStore.getState().result).toBeNull();

    await act(async () => {
      emitScanFrame({ lines: [textLine(VIN)] });
    });
    expect(useScanRequestStore.getState().result?.value).toBe(VIN);
  });

  it('reads a still photo with the shutter', async () => {
    setStillFrame({ lines: [textLine(`VIN ${VIN}`)] });
    await render(<ScannerScreen initialMode="vin" locked />);

    await fireEvent.press(screen.getByTestId('scanner-shutter'));

    expect(useScanRequestStore.getState().result?.value).toBe(VIN);
  });

  it('says so when the photo has no VIN', async () => {
    setStillFrame({ lines: [textLine('GVWR 4500 LB')] });
    await render(<ScannerScreen initialMode="vin" locked />);

    await fireEvent.press(screen.getByTestId('scanner-shutter'));

    expect(screen.getByTestId('scanner-notice')).toHaveTextContent(/Couldn't read it/);
    expect(useScanRequestStore.getState().result).toBeNull();
  });
});

let clock = 0;
const now = () => clock;

async function emitOdometer(text: string, times: number) {
  for (let i = 0; i < times; i += 1) {
    clock += 200;
    await act(async () => {
      emitScanFrame({ lines: [textLine(text)] });
    });
  }
}

describe('ScannerScreen odometer mode', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clock = 0;
    resetScannerMock();
    resetRouterMock();
    useScanRequestStore.getState().clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });


  it('locks a stable reading and fills the field with whole miles', async () => {
    useScanRequestStore.getState().open('odometer');
    await render(<ScannerScreen initialMode="odometer" locked now={now} />);

    await emitOdometer('ODO 48,210.7 mi', 3);

    expect(useScanRequestStore.getState().result?.value).toBe('48210');
  });

  it('ranks with the consistency bounds the caller passed', async () => {
    useScanRequestStore.getState().open('odometer', { odometerBounds: { min: 45_000, max: 50_000 } });
    await render(<ScannerScreen initialMode="odometer" locked now={now} />);

    for (let i = 0; i < 3; i += 1) {
      clock += 200;
      await act(async () => {
        emitScanFrame({ lines: [textLine('30500', 60), textLine('48210', 40)] });
      });
    }

    expect(useScanRequestStore.getState().result?.value).toBe('48210');
  });

  it('warns about km and converts only after confirmation', async () => {
    useScanRequestStore.getState().open('odometer');
    await render(<ScannerScreen initialMode="odometer" locked now={now} />);

    await emitOdometer('ODO 100000 km', 3);

    expect(screen.getByTestId('scanner-km')).toHaveTextContent(/100,000 km/);
    expect(useScanRequestStore.getState().result).toBeNull();
    await fireEvent.press(screen.getByTestId('scanner-km-convert'));
    expect(useScanRequestStore.getState().result?.value).toBe('62137');
  });

  it('offers both readings of an ambiguous 7-digit drum', async () => {
    useScanRequestStore.getState().open('odometer');
    setStillFrame({ lines: [textLine('1234567')] });
    await render(<ScannerScreen initialMode="odometer" locked now={now} />);

    await fireEvent.press(screen.getByTestId('scanner-shutter'));
    await fireEvent.press(screen.getByTestId('scanner-choice-123456'));

    expect(useScanRequestStore.getState().result?.value).toBe('123456');
  });

  it('suggests typing or a photo after about 6 seconds without a lock', async () => {
    await render(<ScannerScreen initialMode="odometer" locked now={now} />);
    expect(screen.queryByTestId('scanner-timeout')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(6_000);
    });

    expect(screen.getByTestId('scanner-timeout')).toHaveTextContent(/Type it instead, or take a photo/);
  });
});
