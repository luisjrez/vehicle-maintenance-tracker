import { kmToMiles } from '@vmt/shared';
import { useRouter } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { formatNumber } from '@/shared/format';
import { useScanRequestStore } from '@/shared/scanner/scan-request-store';
import type { ScanContext, ScanFrame, ScanMode } from '@/shared/scanner/scan-types';
import { strings } from '@/shared/strings';
import {
  initialOdometerScan,
  initialVinScan,
  interpretOdometerFrame,
  interpretStill,
  interpretVinFrame,
  type ScanProposal,
} from './scan-interpreter';
import { type ScannerCapture, ScannerCamera, useBackCameraAvailable, useScannerPermission } from './scanner-camera';
import { ScannerGuide } from './scanner-overlay';

const MODES: ScanMode[] = ['vin', 'odometer', 'qr'];
/** After this long without a lock, point the Owner to typing or a photo (odometer decision 1). */
export const SCAN_TIMEOUT_MS = 6_000;

type Props = {
  initialMode: ScanMode;
  /** Opened for a specific field: other modes are shown but cannot be picked. */
  locked: boolean;
  /** Injected so tests control time; defaults to the wall clock. */
  now?: () => number;
};

/** One full-screen scanner with VIN / Odometer / Transfer QR modes (ADR-0006). */
export function ScannerScreen({ initialMode, locked, now = Date.now }: Props) {
  const t = strings.scanner;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permission = useScannerPermission();
  const cameraAvailable = useBackCameraAvailable();
  const deliver = useScanRequestStore((state) => state.deliver);
  const context = useScanRequestStore((state) => state.request?.context) ?? noContext;
  const [mode, setMode] = useState(initialMode);
  const [torch, setTorch] = useState(false);
  const [question, setQuestion] = useState<Extract<ScanProposal, { kind: 'km' | 'choice' }> | null>(null);
  const [timedOutMode, setTimedOutMode] = useState<ScanMode | null>(null);
  const [done, setDone] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const captureRef = useRef<ScannerCapture | null>(null);
  // Frames arrive faster than React re-renders: refs hold the votes and make delivery happen once.
  const delivered = useRef(false);
  const vinScan = useRef(initialVinScan());
  const odometerScan = useRef(initialOdometerScan());

  // Switching modes starts the votes and the timeout over.
  useEffect(() => {
    vinScan.current = initialVinScan();
    odometerScan.current = initialOdometerScan();
    if (mode === 'qr') return undefined;
    const timer = setTimeout(() => setTimedOutMode(mode), SCAN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mode]);
  const timedOut = timedOutMode === mode;

  const finish = useCallback(
    (value: string) => {
      if (delivered.current) return;
      delivered.current = true;
      setDone(true);
      deliver(value);
      router.back();
    },
    [deliver, router],
  );

  // Every reading lands in an editable field; km and ties are asked here first.
  const propose = useCallback(
    (proposal: ScanProposal) => {
      if (proposal.kind === 'vin') finish(proposal.vin);
      else if (proposal.kind === 'miles') finish(String(proposal.miles));
      else setQuestion((current) => current ?? proposal);
    },
    [finish],
  );

  const handleFrame = useCallback(
    (frame: ScanFrame) => {
      if (delivered.current || question !== null) return;
      if (mode === 'qr') {
        const qr = frame.barcodes.find((barcode) => barcode.format === 'QR_CODE');
        if (qr !== undefined) finish(qr.value);
        return;
      }
      if (mode === 'vin') {
        const step = interpretVinFrame(vinScan.current, frame);
        vinScan.current = step.state;
        if (step.proposal !== null) propose(step.proposal);
        return;
      }
      const step = interpretOdometerFrame(odometerScan.current, frame, now(), context);
      odometerScan.current = step.state;
      if (step.proposal !== null) propose(step.proposal);
    },
    [mode, question, finish, now, context, propose],
  );

  const takePhoto = useCallback(async () => {
    if (mode === 'qr' || captureRef.current === null) return;
    setCapturing(true);
    setNotice(null);
    const still = await captureRef.current.capture();
    setCapturing(false);
    const proposal = still === null ? null : interpretStill(mode, still, context);
    if (proposal === null) setNotice(t.nothingFound);
    else propose(proposal);
  }, [mode, context, propose, t.nothingFound]);

  const handleTakePhoto = useCallback(() => {
    void takePhoto();
  }, [takePhoto]);
  const close = useCallback(() => router.back(), [router]);
  const toggleTorch = useCallback(() => setTorch((on) => !on), []);
  const askPermission = useCallback(() => {
    void permission.ask();
  }, [permission]);
  const openSettings = useCallback(() => {
    void permission.openSettings();
  }, [permission]);
  const answer = useCallback((miles: number) => finish(String(miles)), [finish]);

  const cameraLive = permission.granted && cameraAvailable;
  let body: ReactNode;
  if (!permission.granted) {
    body = (
      <View testID="scanner-permission" style={styles.message}>
        <Text style={styles.title}>{t.permissionTitle}</Text>
        <Text style={styles.body}>{t.permissionBody}</Text>
        {permission.canAsk ? (
          <Button testID="scanner-allow" title={t.allow} onPress={askPermission} />
        ) : (
          <Button testID="scanner-open-settings" title={t.openSettings} onPress={openSettings} />
        )}
      </View>
    );
  } else if (!cameraAvailable) {
    body = (
      <View testID="scanner-no-camera" style={styles.message}>
        <Text style={styles.body}>{t.noCamera}</Text>
      </View>
    );
  } else {
    body = (
      <>
        <ScannerCamera mode={mode} torch={torch} active={!done} onScanFrame={handleFrame} captureRef={captureRef} />
        <ScannerGuide mode={mode} />
      </>
    );
  }

  return (
    <View testID="scanner-screen" style={styles.screen}>
      {body}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={styles.segments}>
          {MODES.map((candidate) => (
            <ModeSegment
              key={candidate}
              mode={candidate}
              selected={candidate === mode}
              disabled={locked && candidate !== initialMode}
              onSelect={setMode}
            />
          ))}
        </View>
        <Text style={styles.hint}>{t.hints[mode]}</Text>
        {timedOut ? (
          <Text testID="scanner-timeout" style={styles.notice}>
            {t.timeout}
          </Text>
        ) : null}
        {notice === null ? null : (
          <Text testID="scanner-notice" style={styles.notice}>
            {notice}
          </Text>
        )}
      </View>
      {question === null ? null : <ScanQuestion question={question} onAnswer={answer} />}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {mode === 'qr' || !cameraLive ? null : (
          <Pressable testID="scanner-torch" accessibilityRole="switch" accessibilityState={{ checked: torch }} onPress={toggleTorch}>
            <Text style={styles.control}>{torch ? t.torchOn : t.torchOff}</Text>
          </Pressable>
        )}
        {mode === 'qr' || !cameraLive ? null : (
          <Pressable testID="scanner-shutter" accessibilityRole="button" accessibilityLabel={t.shutter} onPress={handleTakePhoto} style={styles.shutter}>
            {capturing ? <ActivityIndicator color="#000000" /> : null}
          </Pressable>
        )}
        <Pressable testID="scanner-type-instead" accessibilityRole="button" onPress={close}>
          <Text style={styles.control}>{mode === 'qr' ? t.close : t.typeInstead}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const noContext: ScanContext = {};

type QuestionProps = { question: Extract<ScanProposal, { kind: 'km' | 'choice' }>; onAnswer: (miles: number) => void };

/** km readings need a confirmed conversion; two close readings let the Owner pick (odometer decisions 2–3). */
function ScanQuestion({ question, onAnswer }: QuestionProps) {
  const t = strings.scanner;
  if (question.kind === 'km') {
    const miles = kmToMiles(question.km);
    return (
      <View testID="scanner-km" style={styles.question}>
        <Text style={styles.questionTitle}>{t.kmTitle}</Text>
        <Text style={styles.body}>{t.kmBody(formatNumber(question.km), formatNumber(miles))}</Text>
        <AnswerButton testID="scanner-km-convert" title={t.convertTo(formatNumber(miles))} miles={miles} onAnswer={onAnswer} />
        <AnswerButton
          testID="scanner-km-keep"
          title={t.keepAsMiles(formatNumber(question.km))}
          miles={question.km}
          onAnswer={onAnswer}
          variant="secondary"
        />
      </View>
    );
  }
  return (
    <View testID="scanner-choice" style={styles.question}>
      <Text style={styles.questionTitle}>{t.choiceTitle}</Text>
      {question.options.map((miles, index) => (
        <AnswerButton
          key={miles}
          testID={`scanner-choice-${miles}`}
          title={t.milesOption(formatNumber(miles))}
          miles={miles}
          onAnswer={onAnswer}
          variant={index === 0 ? 'primary' : 'secondary'}
        />
      ))}
    </View>
  );
}

type AnswerProps = { testID: string; title: string; miles: number; onAnswer: (miles: number) => void; variant?: 'primary' | 'secondary' };

function AnswerButton({ testID, title, miles, onAnswer, variant = 'primary' }: AnswerProps) {
  const handlePress = useCallback(() => onAnswer(miles), [onAnswer, miles]);
  return <Button testID={testID} title={title} variant={variant} onPress={handlePress} />;
}

type SegmentProps = { mode: ScanMode; selected: boolean; disabled: boolean; onSelect: (mode: ScanMode) => void };

function ModeSegment({ mode, selected, disabled, onSelect }: SegmentProps) {
  const handlePress = useCallback(() => onSelect(mode), [onSelect, mode]);
  return (
    <Pressable
      testID={`scanner-mode-${mode}`}
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[styles.segment, selected && styles.segmentSelected, disabled && styles.segmentDisabled]}
    >
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{strings.scanner.modes[mode]}</Text>
    </Pressable>
  );
}

// The camera is always dark, so the chrome uses fixed light-on-dark colors.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 12, alignItems: 'center' },
  segments: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 2 },
  segment: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  segmentSelected: { backgroundColor: '#ffffff' },
  segmentDisabled: { opacity: 0.4 },
  segmentLabel: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  segmentLabelSelected: { color: '#000000' },
  hint: { color: '#ffffff', fontSize: 15, textAlign: 'center', textShadowColor: '#000000', textShadowRadius: 4 },
  notice: { color: '#fde68a', fontSize: 15, textAlign: 'center', fontWeight: '600' },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
  },
  shutter: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#ffffff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  control: { color: '#ffffff', fontSize: 17, fontWeight: '600', padding: 8, minWidth: 90, textAlign: 'center' },
  message: { flex: 1, justifyContent: 'center', padding: 32, gap: 16 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { color: '#d1d5db', fontSize: 16, textAlign: 'center' },
  question: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 140,
    padding: 16,
    gap: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(17,24,39,0.94)',
  },
  questionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
