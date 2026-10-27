import { parseTransferQr, transferQrPayload } from './transfer.js';

describe('transfer QR payload', () => {
  const code = 'a'.repeat(43);

  it('round-trips a code through the QR payload', () => {
    expect(parseTransferQr(transferQrPayload(code))).toBe(code);
  });

  it('ignores QR codes that are not transfer codes', () => {
    expect(parseTransferQr('https://example.com')).toBeNull();
    expect(parseTransferQr('vmt-transfer:short')).toBeNull();
  });
});
