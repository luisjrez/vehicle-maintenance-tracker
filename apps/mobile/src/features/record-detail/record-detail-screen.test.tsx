import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { useLogWorkDraft } from '@/shared/log-work-draft/log-work-draft';
import { useGarageStore } from '@/shared/store/garage-store';
import { recordFixture, vehicleFixture } from '@/test/fixtures';
import { requestMethod } from '@/test/http';
import { resetRouterMock, routerMock } from '@/test/router-mock';
import { resetGarageStore } from '@/test/store';
import { RecordDetailScreen } from './record-detail-screen';

describe('RecordDetailScreen', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const alertMock = jest.spyOn(Alert, 'alert');
  const record = recordFixture({
    id: 'record-1',
    vehicleId: 'vehicle-1',
    date: '2026-03-04',
    odometer: 52_000,
    providerName: 'Honda of Downtown',
    providerType: 'dealer',
    totalCents: 42_995,
    notes: 'Asked about the rattle',
    lineItems: [
      { id: 'l1', serviceSlug: 'scheduled-maintenance', customName: null, costCents: 18_900, notes: null, packageCode: 'Honda B12' },
      { id: 'l2', serviceSlug: null, customName: 'Rattle diagnosis', costCents: null, notes: 'Heat shield', packageCode: null },
    ],
  });

  beforeEach(() => {
    resetGarageStore();
    resetRouterMock();
    fetchMock.mockReset();
    alertMock.mockReset();
    useGarageStore.setState({ vehicles: [vehicleFixture({ id: 'vehicle-1' })], records: [record] });
  });

  it('shows total, date, odometer, provider, line items with costs and notes', async () => {
    await render(<RecordDetailScreen recordId="record-1" />);

    expect(screen.getByTestId('record-detail-total')).toHaveTextContent('$429.95');
    expect(screen.getByTestId('record-detail')).toHaveTextContent(/Mar 4, 2026/);
    expect(screen.getByTestId('record-detail')).toHaveTextContent(/52,000 mi/);
    expect(screen.getByTestId('record-detail')).toHaveTextContent(/Honda of Downtown · Dealer/);
    expect(screen.getByTestId('record-detail')).toHaveTextContent(/Honda B12/);
    expect(screen.getByTestId('record-detail')).toHaveTextContent(/Rattle diagnosis.*Heat shield/);
    expect(screen.getByTestId('record-detail')).toHaveTextContent(/\$189\.00/);
  });

  it('reopens the wizard prefilled with every field for editing', async () => {
    await render(<RecordDetailScreen recordId="record-1" />);

    await fireEvent.press(screen.getByTestId('record-edit'));

    const draft = useLogWorkDraft.getState();
    expect(draft).toMatchObject({
      recordId: 'record-1',
      vehicleId: 'vehicle-1',
      odometer: '52000',
      providerName: 'Honda of Downtown',
      providerType: 'dealer',
      total: '429.95',
      notes: 'Asked about the rattle',
    });
    expect(draft.lineItems.map((item) => [item.serviceSlug ?? item.customName, item.cost, item.packageCode])).toEqual([
      ['scheduled-maintenance', '189.00', 'Honda B12'],
      ['Rattle diagnosis', '', ''],
    ]);
    expect(routerMock.replace).toHaveBeenCalledWith({ pathname: '/log-work', params: { vehicleId: 'vehicle-1' } });
  });

  it('hard-deletes after a native confirmation', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await render(<RecordDetailScreen recordId="record-1" />);

    await fireEvent.press(screen.getByTestId('record-delete'));
    const buttons: AlertButton[] = alertMock.mock.calls[0]?.[2] ?? [];
    await act(async () => {
      buttons.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(requestMethod(0)).toBe('DELETE');
    expect(useGarageStore.getState().records).toEqual([]);
  });
});
