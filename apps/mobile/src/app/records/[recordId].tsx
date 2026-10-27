import { useLocalSearchParams } from 'expo-router';
import { RecordDetailScreen } from '@/features/record-detail/record-detail-screen';

export default function RecordDetailRoute() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  return <RecordDetailScreen recordId={recordId} />;
}
