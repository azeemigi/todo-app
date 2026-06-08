import { DueDatePipe } from './due-date.pipe';

describe('DueDatePipe', () => {
  let pipe: DueDatePipe;

  beforeEach(() => {
    pipe = new DueDatePipe();
  });

  it('should return empty string when dueDate is null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should format a same-year date without the year', () => {
    const currentYear = new Date().getFullYear();
    const result = pipe.transform(`${currentYear}-06-15`);
    expect(result).toBe('Jun 15');
  });

  it('should format a future-year date with the year', () => {
    const result = pipe.transform('2099-08-20');
    expect(result).toBe('Aug 20, 2099');
  });

  it('should format a past-year date with the year', () => {
    const result = pipe.transform('2020-01-05');
    expect(result).toBe('Jan 5, 2020');
  });
});
