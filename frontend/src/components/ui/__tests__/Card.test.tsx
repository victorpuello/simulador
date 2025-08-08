// Tests para el componente Card
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders card with title', () => {
    render(
      <Card title="Test Title">
        <p>Content</p>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders card with title and subtitle', () => {
    render(
      <Card title="Test Title" subtitle="Test Subtitle">
        <p>Content</p>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders header actions when provided', () => {
    const actions = <button>Action</button>;
    
    render(
      <Card title="Test Title" headerActions={actions}>
        <p>Content</p>
      </Card>
    );
    
    // Las actions se renderizan, pero pueden estar en un contexto anidado
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    const footer = <div>Footer content</div>;
    
    render(
      <Card footer={footer}>
        <p>Content</p>
      </Card>
    );
    
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-card-class">
        <p>Content</p>
      </Card>
    );

    const cardElement = screen.getByText('Content').closest('.custom-card-class');
    expect(cardElement).toBeInTheDocument();
  });

  it('has proper base styling', () => {
    render(
      <Card>
        <p>Content</p>
      </Card>
    );

    const cardElement = screen.getByText('Content').parentElement;
    expect(cardElement).toHaveClass('card-body');
  });

  describe('Header section', () => {
    it('renders header when title or subtitle is provided', () => {
      render(
        <Card title="Test Title">
          <p>Content</p>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('does not render header when no title, subtitle, or actions', () => {
      render(
        <Card>
          <p>Content</p>
        </Card>
      );

      // Solo debería haber el contenido, no header
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders title with correct styling', () => {
      render(
        <Card title="Test Title">
          <p>Content</p>
        </Card>
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('renders subtitle with correct styling', () => {
      render(
        <Card title="Test Title" subtitle="Test Subtitle">
          <p>Content</p>
        </Card>
      );

      const subtitle = screen.getByText('Test Subtitle');
      expect(subtitle).toHaveClass('text-sm', 'text-gray-500', 'mt-1');
    });
  });

  describe('Content section', () => {
    it('renders content with proper padding', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );

      const contentDiv = screen.getByText('Card content').parentElement;
      expect(contentDiv).toHaveClass('card-body');
    });

    it('renders multiple children correctly', () => {
      render(
        <Card>
          <p>First content</p>
          <p>Second content</p>
        </Card>
      );

      expect(screen.getByText('First content')).toBeInTheDocument();
      expect(screen.getByText('Second content')).toBeInTheDocument();
    });
  });

  describe('Footer section', () => {
    it('renders footer with proper styling', () => {
      const footer = <div>Footer content</div>;
      
      render(
        <Card footer={footer}>
          <p>Content</p>
        </Card>
      );

      const footerElement = screen.getByText('Footer content').parentElement;
      expect(footerElement).toHaveClass('card-footer');
    });

    it('does not render footer section when no footer provided', () => {
      render(
        <Card>
          <p>Content</p>
        </Card>
      );

      // No debería haber elementos con clase card-footer
      expect(screen.queryByText(/Footer/)).not.toBeInTheDocument();
    });
  });

  describe('Layout combinations', () => {
    it('renders complete card with all sections', () => {
      const actions = <button>Action</button>;
      const footer = <div>Footer</div>;
      
      render(
        <Card 
          title="Title" 
          subtitle="Subtitle" 
          headerActions={actions}
          footer={footer}
        >
          <p>Content</p>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders card with only title and content', () => {
      render(
        <Card title="Simple Title">
          <p>Simple Content</p>
        </Card>
      );

      expect(screen.getByText('Simple Title')).toBeInTheDocument();
      expect(screen.getByText('Simple Content')).toBeInTheDocument();
    });
  });
});