import { Result } from './result';

describe('Result', () => {
  describe('ok', () => {
    it('should create a successful result', () => {
      const result = Result.ok('value');
      expect(result.isOk()).toBe(true);
      expect(result.isFailure()).toBe(false);
      expect(result.getValue()).toBe('value');
    });
  });

  describe('fail', () => {
    it('should create a failed result', () => {
      const result = Result.fail('error');
      expect(result.isOk()).toBe(false);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('error');
    });
  });

  describe('getValue', () => {
    it('should throw when getting value of failed result', () => {
      const result = Result.fail('error');
      expect(() => result.getValue()).toThrow('Cannot get value of a failed result');
    });
  });

  describe('getError', () => {
    it('should throw when getting error of successful result', () => {
      const result = Result.ok('value');
      expect(() => result.getError()).toThrow('Cannot get error of a successful result');
    });
  });

  describe('map', () => {
    it('should transform successful value', () => {
      const result = Result.ok(5).map((v) => v * 2);
      expect(result.getValue()).toBe(10);
    });

    it('should propagate failure', () => {
      const result = Result.fail<number>('err').map((v) => v * 2);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('err');
    });
  });

  describe('flatMap', () => {
    it('should chain successful results', () => {
      const result = Result.ok(5).flatMap((v) => Result.ok(v * 2));
      expect(result.getValue()).toBe(10);
    });

    it('should short-circuit on failure', () => {
      const result = Result.ok(5).flatMap(() => Result.fail('failed'));
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('failed');
    });

    it('should propagate initial failure', () => {
      const result = Result.fail<number>('initial').flatMap((v) => Result.ok(v));
      expect(result.getError()).toBe('initial');
    });
  });

  describe('combine', () => {
    it('should succeed when all results succeed', () => {
      const result = Result.combine([Result.ok(1), Result.ok(2), Result.ok(3)]);
      expect(result.isOk()).toBe(true);
    });

    it('should fail when any result fails', () => {
      const result = Result.combine([Result.ok(1), Result.fail('err'), Result.ok(3)]);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('err');
    });

    it('should return first error', () => {
      const result = Result.combine([Result.fail('first'), Result.fail('second')]);
      expect(result.getError()).toBe('first');
    });
  });
});
