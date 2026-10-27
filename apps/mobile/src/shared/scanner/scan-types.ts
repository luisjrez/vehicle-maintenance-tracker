export type ScanMode = 'vin' | 'odometer' | 'qr';

export type ScannedBarcode = { format: string; value: string };

/** One recognized text line, with its box in frame pixels (used to rank odometer digits by size). */
export type ScannedTextLine = { text: string; top: number; left: number; width: number; height: number };

/** Plain data copied out of a camera frame; nothing native crosses into React. */
export type ScanFrame = { barcodes: ScannedBarcode[]; lines: ScannedTextLine[]; frameWidth: number; frameHeight: number };

/** What the caller knows that helps rank readings (ADR-0007 bounds for the date being logged). */
export type ScanContext = { odometerBounds?: { min: number; max: number | null } };
