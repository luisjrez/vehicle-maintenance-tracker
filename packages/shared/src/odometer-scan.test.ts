import {
  addOdometerReading,
  emptyOdometerVote,
  kmToMiles,
  odometerLock,
  pickOdometerCandidates,
} from './odometer-scan.js';

const line = (text: string, height = 40) => ({ text, height });

describe('pickOdometerCandidates', () => {
  it('prefers the number next to ODO / mi', () => {
    const [best] = pickOdometerCandidates([line('72°F', 30), line('ODO 48,210 mi', 40), line('12:45 PM', 30)]);

    expect(best).toMatchObject({ miles: 48_210, unit: 'mi' });
  });

  it('ignores trip, temperature, clock, range, mpg and percentages', () => {
    const candidates = pickOdometerCandidates([
      line('TRIP A 123.4', 50),
      line('72 °F'),
      line('12:45'),
      line('RANGE 240 mi'),
      line('28.5 MPG'),
      line('85 %'),
      line('48210', 30),
    ]);

    expect(candidates.map((candidate) => candidate.miles)).toEqual([48_210]);
  });

  it('drops tenths and repairs confusable characters inside digit runs', () => {
    expect(pickOdometerCandidates([line('ODO 4B21O.7')])[0]?.miles).toBe(48_210);
  });

  it('ranks the tallest digits first when nothing else tells them apart', () => {
    const candidates = pickOdometerCandidates([line('2345', 20), line('48210', 60)]);

    expect(candidates.map((candidate) => candidate.miles)).toEqual([48_210, 2_345]);
  });

  it('offers both readings of a 7-digit drum: 6 digits plus tenths, or all 7', () => {
    const values = pickOdometerCandidates([line('1234567')]).map((candidate) => candidate.miles);

    expect(values).toEqual(expect.arrayContaining([123_456, 1_234_567]));
  });

  it('down-ranks but never hides a value outside the consistency bounds', () => {
    const candidates = pickOdometerCandidates([line('30500', 60), line('48210', 40)], { bounds: { min: 45_000, max: 50_000 } });

    expect(candidates.map((candidate) => [candidate.miles, candidate.inBounds])).toEqual([
      [48_210, true],
      [30_500, false],
    ]);
  });

  it('flags a km display instead of discarding it', () => {
    expect(pickOdometerCandidates([line('ODO 77589 km')])[0]).toMatchObject({ miles: 77_589, unit: 'km' });
  });

  it('keeps values within 0–9,999,999', () => {
    expect(pickOdometerCandidates([line('123456789')])).toEqual([]);
  });
});

describe('odometer stability lock', () => {
  it('locks when one value wins at least 3 frames and 60 % of the ~1.5 s window', () => {
    let vote = emptyOdometerVote();
    vote = addOdometerReading(vote, 48_210, 0);
    vote = addOdometerReading(vote, 48_210, 200);
    expect(odometerLock(vote, 200)).toBeNull();

    vote = addOdometerReading(vote, 48_219, 400);
    vote = addOdometerReading(vote, 48_210, 600);

    expect(odometerLock(vote, 600)).toEqual({ kind: 'single', miles: 48_210 });
  });

  it('forgets readings older than the window', () => {
    let vote = emptyOdometerVote();
    for (const at of [0, 100, 200]) vote = addOdometerReading(vote, 11_111, at);
    for (const at of [2_000, 2_100]) vote = addOdometerReading(vote, 48_210, at);

    expect(odometerLock(vote, 2_100)).toBeNull();
  });

  it('offers both values when two candidates are too close to call', () => {
    let vote = emptyOdometerVote();
    for (const [miles, at] of [[48_210, 0], [48_219, 100], [48_210, 200], [48_219, 300], [48_210, 400], [48_219, 500]] as const) {
      vote = addOdometerReading(vote, miles, at);
    }

    expect(odometerLock(vote, 500)).toEqual({ kind: 'choice', options: [48_210, 48_219] });
  });

  it('counts frames with no candidate against the lock', () => {
    let vote = emptyOdometerVote();
    for (const at of [0, 100, 200]) vote = addOdometerReading(vote, 48_210, at);
    for (const at of [300, 400, 500]) vote = addOdometerReading(vote, null, at);

    expect(odometerLock(vote, 500)).toBeNull();
  });
});

describe('kmToMiles', () => {
  it('converts and rounds to whole miles', () => {
    expect(kmToMiles(100_000)).toBe(62_137);
  });
});
