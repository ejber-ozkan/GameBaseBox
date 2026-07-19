import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { C64ShaderBackground } from './C64ShaderBackground';

describe('C64ShaderBackground', () => {
  let mockGetContext: any;

  beforeEach(() => {
    // Mock WebGLRenderingContext
    mockGetContext = vi.fn().mockReturnValue({
      createShader: vi.fn().mockReturnValue({}),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn().mockReturnValue({}),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      useProgram: vi.fn(),
      createBuffer: vi.fn().mockReturnValue({}),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      getAttribLocation: vi.fn().mockReturnValue(0),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      getUniformLocation: vi.fn().mockReturnValue({}),
      viewport: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      drawArrays: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteProgram: vi.fn(),
      deleteShader: vi.fn(),
    });

    HTMLCanvasElement.prototype.getContext = mockGetContext as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders the canvas element correctly', () => {
    const { container } = render(<C64ShaderBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  test('attempts to initialize WebGL context', () => {
    render(<C64ShaderBackground />);
    expect(mockGetContext).toHaveBeenCalledWith('webgl');
  });
});
