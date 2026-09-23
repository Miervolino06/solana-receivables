import { describe, expect, it } from 'vitest';
import { resolveSurface } from './navigation';

describe('public introduction and wallet entry', () => {
  it('keeps the introduction available before and after connecting', () => {
    expect(resolveSurface('/', '', false)).toBe('landing');
    expect(resolveSurface('/', '', true)).toBe('landing');
  });
  it('requires a connected wallet for the workspace, including a direct refresh', () => {
    expect(resolveSurface('/app', '', false)).toBe('connect');
    expect(resolveSurface('/app/', '?from=site', false)).toBe('connect');
    expect(resolveSurface('/app', '', true)).toBe('workspace');
  });
  it('keeps shared requests, receipts and invalid links inspectable without login', () => {
    for (const query of ['?r=example', '?r=example&tx=signature', '?r=', '?r=invalid&r=second']) {
      expect(resolveSurface('/', query, false)).toBe('public');
      expect(resolveSurface('/app', query, false)).toBe('public');
    }
  });
  it('offers receipt verification without signing or connecting', () => {
    expect(resolveSurface('/verify', '', false)).toBe('public');
    expect(resolveSurface('/verify/', '', false)).toBe('public');
  });
});
