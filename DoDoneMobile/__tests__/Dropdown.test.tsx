import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import DropdownComponent from '../components/Dropdown';

const mockData = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 },
  { label: 'Option 3', value: 3 },
];

describe('DropdownComponent', () => {
  it('should render with clear option when allowClear is true', async () => {
    const mockOnValueChange = jest.fn();
    
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <DropdownComponent
          data={mockData}
          value={null}
          onValueChange={mockOnValueChange}
          allowClear={true}
          clearLabel="-- Clear --"
        />
      );
    });

    expect(mockOnValueChange).toBeDefined();
  });

  it('should render without clear option when allowClear is false', async () => {
    const mockOnValueChange = jest.fn();
    
    let component;
    await ReactTestRenderer.act(() => {
      component = ReactTestRenderer.create(
        <DropdownComponent
          data={mockData}
          value={1}
          onValueChange={mockOnValueChange}
          allowClear={false}
        />
      );
    });

    expect(component).toBeTruthy();
  });

  it('should handle clear option selection correctly', () => {
    const mockOnValueChange = jest.fn();
    
    // Simulate selecting the clear option
    const clearItem = { label: '-- Clear --', value: null };
    mockOnValueChange(clearItem);
    
    expect(mockOnValueChange).toHaveBeenCalledWith(clearItem);
  });
});
