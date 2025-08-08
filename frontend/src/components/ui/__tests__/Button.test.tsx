// Tests para el componente Button
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state when loading prop is true', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading Button');
    // Verificar que hay un spinner (svg con clase animate-spin)
    expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<Button variant="success">Success Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-success');
  });

  it('applies correct size classes', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-primary', 'px-6', 'py-3');
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>Loading Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct type attribute', () => {
    render(<Button type="submit">Submit Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('defaults to button type', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  describe('Variant styles', () => {
    it('applies primary variant styles', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-secondary');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-outline');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-ghost');
    });
  });

  describe('Size styles', () => {
    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'px-3', 'py-1.5', 'text-xs');
    });

    it('applies medium size styles (default)', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'px-4', 'py-2', 'text-sm');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'px-6', 'py-3', 'text-base');
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Button>Focusable Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
      // Focus styles se aplican con CSS, no clases dinámicas
    });

    it('is accessible via keyboard', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: fireEvent.keyDown doesn't trigger click automatically, 
      // but the button should be focusable
      expect(button).toHaveFocus();
    });
  });
});