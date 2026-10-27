import { COMMON_SERVICES } from '@vmt/shared';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { SectionHeader } from '@/components/section-header';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { type DraftLineItem, useLogWorkDraft } from './log-work-draft';
import { SelectedServiceRow } from './selected-service-row';

const pickKey = (pick: (typeof COMMON_SERVICES)[number]) => `${pick.serviceSlug}|${pick.notes ?? ''}`;

function isPicked(items: DraftLineItem[], key: string): boolean {
  return items.some((item) => `${item.serviceSlug ?? ''}|${item.notes}` === key);
}

type Props = { error: string | undefined; onSearch: () => void };

export function WhatStep({ error, onSearch }: Props) {
  const lineItems = useLogWorkDraft((state) => state.lineItems);
  const toggleCatalogService = useLogWorkDraft((state) => state.toggleCatalogService);
  const removeLineItem = useLogWorkDraft((state) => state.removeLineItem);

  const togglePick = useCallback(
    (key: string) => {
      const pick = COMMON_SERVICES.find((candidate) => pickKey(candidate) === key);
      if (pick !== undefined) toggleCatalogService(pick.serviceSlug, pick.notes);
    },
    [toggleCatalogService],
  );

  return (
    <View testID="log-work-step-what" style={styles.step}>
      <SectionHeader title={strings.logWork.commonServices} />
      <View style={styles.chips}>
        {COMMON_SERVICES.map((pick) => (
          <Chip
            key={pickKey(pick)}
            testID={`common-service-${pick.serviceSlug}`}
            label={pick.label}
            value={pickKey(pick)}
            selected={isPicked(lineItems, pickKey(pick))}
            onToggle={togglePick}
          />
        ))}
      </View>
      <Button testID="log-work-search" title={strings.logWork.searchAll} variant="secondary" onPress={onSearch} />
      {lineItems.length === 0 ? null : (
        <>
          <SectionHeader title={strings.logWork.selectedServices} />
          <View style={styles.list}>
            {lineItems.map((item) => (
              <SelectedServiceRow key={item.key} item={item} onRemove={removeLineItem} />
            ))}
          </View>
        </>
      )}
      {error === undefined ? null : (
        <Text testID="log-work-services-error" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { backgroundColor: colors.card, borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden' },
  error: { color: colors.destructive, fontSize: 13 },
});
