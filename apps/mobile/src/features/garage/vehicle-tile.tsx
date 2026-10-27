import { type Vehicle, vehicleDisplayName } from '@vmt/shared';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { formatCents, formatMiles } from '@/shared/format';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

type Props = {
  vehicle: Vehicle;
  mileage: number;
  spentThisYearCents: number;
  selected: boolean;
  onSelect: (vehicleId: string) => void;
};

export function VehicleTile({ vehicle, mileage, spentThisYearCents, selected, onSelect }: Props) {
  const handlePress = useCallback(() => onSelect(vehicle.id), [onSelect, vehicle.id]);
  const subtitle = vehicle.nickname === null ? vehicle.make : vehicle.nickname;

  return (
    <Pressable
      testID={`vehicle-tile-${vehicle.id}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={[styles.tile, selected && styles.selected]}
    >
      <Text numberOfLines={1} style={styles.caption}>
        {subtitle}
      </Text>
      <Text numberOfLines={1} style={styles.title}>
        {`${vehicle.year} ${vehicle.model}`}
      </Text>
      <Text accessibilityLabel={vehicleDisplayName(vehicle)} numberOfLines={1} style={styles.caption}>
        {formatMiles(mileage)}
      </Text>
      <Text testID={`vehicle-tile-spent-${vehicle.id}`} numberOfLines={1} style={styles.caption}>
        {strings.garage.thisYear(formatCents(spentThisYearCents, { wholeDollars: true }))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 150,
    padding: 12,
    gap: 2,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.tint },
  caption: { fontSize: 13, color: colors.secondaryLabel },
  title: { fontSize: 16, fontWeight: '700', color: colors.label },
});
