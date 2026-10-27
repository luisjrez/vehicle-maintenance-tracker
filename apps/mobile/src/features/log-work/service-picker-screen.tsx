import { CATALOG, type CatalogService, searchCatalog } from '@vmt/shared';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGarageStore } from '@/shared/store/garage-store';
import { strings } from '@/shared/strings';
import { colors } from '@/shared/ui/colors';
import { useLogWorkDraft } from './log-work-draft';

type Row = { kind: 'service'; service: CatalogService } | { kind: 'custom'; name: string };
type Section = { title: string; data: Row[] };

const browseSections: Section[] = CATALOG.map((category) => ({
  title: category.name,
  data: category.services.filter((service) => !service.retired).map((service): Row => ({ kind: 'service', service })),
}));

function rowKey(row: Row): string {
  return row.kind === 'service' ? row.service.slug : `custom:${row.name}`;
}

/** Search across the whole catalog, browse by category, or name a custom service (ADR-0004). */
export function ServicePickerScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const records = useGarageStore((state) => state.records);
  const addCatalogService = useLogWorkDraft((state) => state.addCatalogService);
  const addCustomService = useLogWorkDraft((state) => state.addCustomService);

  const previousCustomNames = useMemo(() => {
    const names = new Set<string>();
    for (const record of records) for (const item of record.lineItems) if (item.customName !== null) names.add(item.customName);
    return [...names].toSorted((a, b) => a.localeCompare(b));
  }, [records]);

  const sections = useMemo((): Section[] => {
    const trimmed = query.trim();
    const custom: Row[] = trimmed === '' ? [] : [{ kind: 'custom', name: trimmed }];
    const matchingCustom = previousCustomNames
      .filter((name) => trimmed === '' || name.toLowerCase().includes(trimmed.toLowerCase()))
      .filter((name) => name.toLowerCase() !== trimmed.toLowerCase())
      .map((name): Row => ({ kind: 'custom', name }));
    const suggestions = matchingCustom.length === 0 ? [] : [{ title: strings.servicePicker.previousCustom, data: matchingCustom }];
    if (trimmed === '') return [...suggestions, ...browseSections];
    const results = searchCatalog(trimmed).map((service): Row => ({ kind: 'service', service }));
    return [{ title: strings.servicePicker.title, data: [...results, ...custom] }, ...suggestions];
  }, [query, previousCustomNames]);

  const choose = useCallback(
    (row: Row) => {
      if (row.kind === 'service') addCatalogService(row.service.slug);
      else addCustomService(row.name);
      router.back();
    },
    [addCatalogService, addCustomService, router],
  );

  const renderItem = useCallback(({ item }: { item: Row }) => <PickerRow row={item} onChoose={choose} />, [choose]);
  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>,
    [],
  );

  return (
    <View style={styles.screen}>
      <TextInput
        testID="service-search"
        value={query}
        onChangeText={setQuery}
        placeholder={strings.servicePicker.searchPlaceholder}
        placeholderTextColor={colors.secondaryLabel}
        autoFocus
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.search}
      />
      <SectionList
        testID="service-list"
        sections={sections}
        keyExtractor={rowKey}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function PickerRow({ row, onChoose }: { row: Row; onChoose: (row: Row) => void }) {
  const handlePress = useCallback(() => onChoose(row), [onChoose, row]);
  return (
    <Pressable testID={`service-option-${rowKey(row)}`} accessibilityRole="button" onPress={handlePress} style={styles.row}>
      {row.kind === 'service' ? (
        <>
          <Text style={styles.name}>{row.service.name}</Text>
          <Text numberOfLines={1} style={styles.description}>
            {row.service.description}
          </Text>
        </>
      ) : (
        <Text style={[styles.name, styles.custom]}>{strings.servicePicker.custom(row.name)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  search: {
    margin: 16,
    marginBottom: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.fill,
    fontSize: 17,
    color: colors.label,
  },
  list: { paddingBottom: 48 },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: colors.secondaryLabel, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  row: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  name: { fontSize: 16, color: colors.label },
  custom: { color: colors.tint, fontWeight: '600' },
  description: { fontSize: 13, color: colors.secondaryLabel },
});
