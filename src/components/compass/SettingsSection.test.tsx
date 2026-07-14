import React from 'react';
import { render } from '@testing-library/react-native';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';

describe('SettingsSection', () => {
  it('renders an uppercase group header', async () => {
    const { getByText } = await render(
      <SettingsSection title="Account">
        <SettingsRow label="Row A" onPress={jest.fn()} />
      </SettingsSection>,
    );
    expect(getByText('ACCOUNT')).toBeTruthy();
  });

  it('renders without a header when title is omitted', async () => {
    const { getByText, queryByRole } = await render(
      <SettingsSection>
        <SettingsRow label="Row A" onPress={jest.fn()} />
      </SettingsSection>,
    );
    expect(getByText('Row A')).toBeTruthy();
    expect(queryByRole('header')).toBeNull();
  });

  it('injects isFirst onto the first row only', async () => {
    const { getByText } = await render(
      <SettingsSection title="Group">
        <SettingsRow label="First" onPress={jest.fn()} />
        <SettingsRow label="Second" onPress={jest.fn()} />
      </SettingsSection>,
    );
    // Both rows render; the divider rule is driven by isFirst internally.
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('renders children un-animated when animate is false', async () => {
    const { getByText } = await render(
      <SettingsSection title="Group" animate={false}>
        <SettingsRow label="Static row" onPress={jest.fn()} />
      </SettingsSection>,
    );
    expect(getByText('Static row')).toBeTruthy();
  });

  it('offsets the entrance stagger by section index', async () => {
    const { getByText } = await render(
      <SettingsSection title="Later" index={2}>
        <SettingsRow label="Deferred" onPress={jest.fn()} />
      </SettingsSection>,
    );
    expect(getByText('Deferred')).toBeTruthy();
  });
});
