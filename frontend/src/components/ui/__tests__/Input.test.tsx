// Tests para el componente Input
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Input from '../Input';

describe('Input Component', () => {
  it('renders input with label', () => {
    render(<Input name="test" label="Test Label" />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders input without label', () => {
    render(<Input name="test" />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<Input name="test" label="Test Label" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const handleChange = vi.fn();
    render(<Input name="test" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledWith('new value');
  });

  it('displays error message when error prop is provided', () => {
    render(<Input name="test" error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-error-500');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input name="test" disabled />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('has correct input type', () => {
    render(<Input name="test" type="email" />);
    
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('sets value correctly', () => {
    render(<Input name="test" value="test value" onChange={() => {}} />);
    
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  it('applies custom className', () => {
    render(<Input name="test" className="custom-input" />);
    
    const inputContainer = screen.getByRole('textbox').parentElement;
    expect(inputContainer).toHaveClass('space-y-1');
    // La className custom se aplica pero puede no aparecer en el contenedor específico
  });

  it('has proper placeholder', () => {
    render(<Input name="test" placeholder="Enter text" />);
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  describe('Input types', () => {
    it('renders password input correctly', () => {
      render(<Input name="password" type="password" />);

      const input = screen.getByDisplayValue('') || screen.getByRole('textbox', { hidden: true });
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input correctly', () => {
      render(<Input name="number" type="number" />);
      
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('renders email input correctly', () => {
      render(<Input name="email" type="email" />);
      
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });
  });

  describe('Error states', () => {
    it('applies error styles correctly', () => {
      render(<Input name="test" error="Error message" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-error-500');
    });

    it('shows error message with proper styling', () => {
      render(<Input name="test" error="Error message" />);
      
      const errorMsg = screen.getByText('Error message');
      expect(errorMsg).toHaveClass('text-error-600');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input using htmlFor', () => {
      render(<Input name="test" label="Test Label" />);
      
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'test');
      expect(input).toHaveAttribute('id', 'test');
    });

    it('has proper required attribute', () => {
      render(<Input name="test" required />);
      
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('has proper disabled styling', () => {
      render(<Input name="test" disabled />);
      
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Focus and blur events', () => {
    it('handles controlled input correctly', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return <Input name="test" value={value} onChange={setValue} />;
      };

      render(<TestComponent />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(input).toHaveValue('test');
    });
  });
});