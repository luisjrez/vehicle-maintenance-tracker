import { currentMileage, type ServiceRecord, type Vehicle } from '@vmt/shared';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { VehicleTile } from './vehicle-tile';

type Props = {
  vehicles: Vehicle[];
  records: ServiceRecord[];
  selectedVehicleId: string | undefined;
  onSelect: (vehicleId: string) => void;
  onAdd: () => void;
};

export function VehicleCarousel({ vehicles, records, selectedVehicleId, onSelect, onAdd }: Props) {
  return (
    <ScrollView
      testID="vehicle-carousel"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {vehicles.map((vehicle) => (
        <VehicleTile
          key={vehicle.id}
          vehicle={vehicle}
          mileage={currentMileage(vehicle, records.filter((record) => record.vehicleId === vehicle.id))}
          selected={vehicle.id === selectedVehicleId}
          onSelect={onSelect}
        />
      ))}
      <Pressable testID="vehicle-tile-add" accessibilityRole="button" onPress={onAdd} style={styles.addTile}>
        <Text style={styles.plus}>+</Text>
        <Text style={styles.addLabel}>{strings.garage.add}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 16 },
  addTile: {
    width: 90,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontSize: 24, color: colors.tint },
  addLabel: { fontSize: 13, color: colors.tint },
});
