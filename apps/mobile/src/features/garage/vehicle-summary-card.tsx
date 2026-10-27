import { type Vehicle, vehicleDisplayName } from '@vmt/shared';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/card';
import { formatCents, formatMiles } from '@/shared/format';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';

type Props = { vehicle: Vehicle; mileage: number; spentThisYearCents: number; year: number };

export function VehicleSummaryCard({ vehicle, mileage, spentThisYearCents, year }: Props) {
  const plate = vehicle.plate === null ? null : [vehicle.plate, vehicle.plateState].filter(Boolean).join(' · ');
  const subtitle = [vehicle.trim, plate].filter((part) => part !== null && part !== '').join(' · ');

  return (
    <Card testID="vehicle-summary">
      {vehicle.nickname === null ? null : <Text style={styles.caption}>{vehicle.nickname}</Text>}
      <Text testID="vehicle-summary-name" style={styles.name}>
        {vehicle.nickname === null ? vehicleDisplayName(vehicle) : `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      </Text>
      {subtitle === '' ? null : <Text style={styles.caption}>{subtitle}</Text>}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.caption}>{strings.garage.currentMileage}</Text>
          <Text testID="vehicle-summary-mileage" selectable style={styles.value}>
            {formatMiles(mileage)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.caption}>{strings.garage.spentIn(year)}</Text>
          <Text testID="vehicle-summary-spent" selectable style={styles.value}>
            {formatCents(spentThisYearCents)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: 13, color: colors.secondaryLabel },
  name: { fontSize: 26, fontWeight: '700', color: colors.label },
  stats: { flexDirection: 'row', gap: 16, paddingTop: 8 },
  stat: { flex: 1, gap: 2 },
  value: { fontSize: 17, fontWeight: '700', color: colors.label, fontVariant: ['tabular-nums'] },
});
