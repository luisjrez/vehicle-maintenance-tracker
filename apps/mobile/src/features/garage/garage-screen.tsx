import { currentMileage, spendingReport } from '@vmt/shared';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ErrorBanner } from '@/components/error-banner';
import { ListRow } from '@/components/list-row';
import { SectionHeader } from '@/components/section-header';
import { selectSelectedVehicle, useGarageStore } from '@/shared/store/garage-store';
import { useVehicleRecords } from '@/shared/store/use-vehicle-records';
import { strings } from '@/shared/strings';
import { useReceiveTransfer } from '@/shared/transfer/use-receive-transfer';
import { colors } from '@/shared/ui/colors';
import { GarageEmptyState } from './garage-empty-state';
import { HistoryList } from './history-list';
import { SpendingReportCard } from './spending-report-card';
import { VehicleCarousel } from './vehicle-carousel';
import { VehicleSummaryCard } from './vehicle-summary-card';

export function GarageScreen() {
  const router = useRouter();
  const vehicles = useGarageStore((state) => state.vehicles);
  const allRecords = useGarageStore((state) => state.records);
  const selected = useGarageStore(selectSelectedVehicle);
  const selectVehicle = useGarageStore((state) => state.selectVehicle);
  const records = useVehicleRecords(selected?.id);
  // Read once per mount; a year boundary while the app is open is not worth a timer.
  const [year] = useState(() => new Date().getFullYear());

  const openAddVehicle = useCallback(() => router.push('/add-vehicle'), [router]);
  const receive = useReceiveTransfer();
  const openActions = useCallback(() => router.push('/actions'), [router]);
  const selectedId = selected?.id;
  const openDetails = useCallback(() => {
    if (selectedId !== undefined) router.push({ pathname: '/vehicles/[vehicleId]', params: { vehicleId: selectedId } });
  }, [router, selectedId]);
  const openRecord = useCallback((recordId: string) => router.push({ pathname: '/records/[recordId]', params: { recordId } }), [router]);

  if (vehicles.length === 0 || selected === undefined) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen}>
        <GarageEmptyState onAddVehicle={openAddVehicle} onReceive={receive.start} />
        {receive.error === null ? null : (
          <View style={styles.section}>
            <ErrorBanner testID="garage-receive-error" message={receive.error} />
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <VehicleCarousel
          vehicles={vehicles}
          records={allRecords}
          year={year}
          selectedVehicleId={selected.id}
          onSelect={selectVehicle}
          onAdd={openAddVehicle}
        />
        <View style={styles.section}>
          <VehicleSummaryCard
            vehicle={selected}
            mileage={currentMileage(selected, records)}
            spentThisYearCents={spendingReport(records, year).totalCents}
            year={year}
          />
          <ListRow testID="vehicle-details-row" title={strings.garage.detailsRow} onPress={openDetails} />
          <SectionHeader title={strings.garage.spending} />
          <SpendingReportCard key={selected.id} records={records} />
          <SectionHeader title={strings.garage.history} />
          <HistoryList records={records} onOpen={openRecord} />
        </View>
      </ScrollView>
      <Pressable testID="garage-fab" accessibilityRole="button" accessibilityLabel="Add" onPress={openActions} style={styles.fab}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: 16, paddingVertical: 12, paddingBottom: 120 },
  section: { paddingHorizontal: 16, gap: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  },
  fabLabel: { color: colors.onTint, fontSize: 32, lineHeight: 34, fontWeight: '400' },
});
