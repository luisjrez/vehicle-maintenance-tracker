import { fireEvent, render, screen } from '@testing-library/react-native';
import type { FieldErrors } from './use-vehicle-form';
import { useVehicleForm } from './use-vehicle-form';
import { VehicleFormFields } from './vehicle-form-fields';
import { emptyVehicleForm, type VehicleFormValues } from './vehicle-form-values';

function Harness({ initial, errors = {} }: { initial: VehicleFormValues; errors?: FieldErrors }) {
  const form = useVehicleForm(initial);
  return <VehicleFormFields values={form.values} setters={form.setters} errors={errors} />;
}

const decoded: VehicleFormValues = {
  ...emptyVehicleForm,
  year: '2003',
  make: 'Honda',
  model: 'Accord',
  trim: 'EX-V6',
  bodyClass: 'Coupe',
  cylinders: '6',
  displacementL: '3',
};

describe('VehicleFormFields', () => {
  it('shows only the essentials until more details are opened', async () => {
    await render(<Harness initial={emptyVehicleForm} />);

    expect(screen.getByTestId('vehicle-year')).toBeTruthy();
    expect(screen.getByTestId('vehicle-initial-odometer')).toBeTruthy();
    expect(screen.getByTestId('vehicle-nickname')).toBeTruthy();
    expect(screen.queryByTestId('vehicle-trim')).toBeNull();
    expect(screen.queryByTestId('vehicle-plate')).toBeNull();

    await fireEvent.press(screen.getByTestId('vehicle-more-details'));

    expect(screen.getByTestId('vehicle-trim')).toBeTruthy();
    expect(screen.getByTestId('vehicle-color')).toBeTruthy();
  });

  it('summarizes the hidden details that are filled in', async () => {
    await render(<Harness initial={decoded} />);

    expect(screen.getByTestId('vehicle-more-details-summary')).toHaveTextContent('EX-V6 · Coupe · 6 cyl · 3 L');
  });

  it('opens by itself when a hidden field has an error', async () => {
    await render(<Harness initial={emptyVehicleForm} errors={{ plateState: 'Use a US state code.' }} />);

    expect(screen.getByTestId('vehicle-plate-state-error')).toHaveTextContent('Use a US state code.');
  });
});
